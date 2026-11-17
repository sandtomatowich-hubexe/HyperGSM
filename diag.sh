#!/system/bin/sh
# Usage: diag.sh start | state | read
# "start" returns immediately and collects in the background, so the WebUI never blocks.
MODDIR=${0%/*}
. "$MODDIR/common.sh"
[ -f "$MODDIR/settings.conf" ] && . "$MODDIR/settings.conf"
OUT=$MODDIR/diag.txt
STATE=$MODDIR/diag.state

T=""
command -v timeout >/dev/null 2>&1 && T="timeout 12"

worker(){
  {
    echo "== build =="
    getprop ro.build.fingerprint
    echo "region: $(detect_region)"
    getprop ro.mi.os.version.incremental
    echo
    echo "== google packages =="
    pm list packages 2>/dev/null | grep -E 'google.android.(gms|gsf)|android.vending'
    echo
    echo "== FCM sockets (5228-5230) =="
    (ss -tn 2>/dev/null || netstat -tn 2>/dev/null) | grep -E ':(5228|5229|5230)[[:space:]]'
    echo
    echo "== deviceidle whitelist (gms / telegram / whatsapp) =="
    $T dumpsys deviceidle whitelist 2>/dev/null | grep -E 'gms|telegram|whatsapp'
    for p in $GMS org.telegram.messenger com.whatsapp; do
      echo
      echo "== $p =="
      echo "RUN_ANY_IN_BACKGROUND: $($T cmd appops get "$p" RUN_ANY_IN_BACKGROUND 2>&1 | head -n 1)"
      echo "standby bucket: $($T am get-standby-bucket "$p" 2>&1 | head -n 1)"
    done
    echo
    echo "== notification service: focus mentions =="
    $T dumpsys notification 2>/dev/null | grep -i focus | head -n 20
    echo
    echo "== recent push / notification log lines =="
    $T logcat -d -t 3000 -b main,system 2>/dev/null | grep -iE 'GCM|FCM|MiuiNotification|focus.*notif' | tail -n 60
  } > "$OUT.tmp" 2>&1
  mv -f "$OUT.tmp" "$OUT"
  echo DONE > "$STATE"
}

case "$1" in
  start)
    echo RUNNING > "$STATE"
    nohup sh "$0" worker >/dev/null 2>&1 </dev/null &
    echo started
    ;;
  worker) worker ;;
  state)  cat "$STATE" 2>/dev/null || echo NONE ;;
  read)
    # Plain ASCII only, bounded size: keeps the WebView bridge safe.
    [ -f "$OUT" ] && head -c 20000 "$OUT" | cut -c1-200 | tr -c 'A-Za-z0-9 \t\n._:/=@,()[]<>%+#*|;-' '?'
    ;;
esac
exit 0
