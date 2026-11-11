#!/system/bin/sh
# Collects what we need to decide whether a framework patch is required.
MODDIR=${0%/*}
OUT=$MODDIR/webui/diag.txt
. "$MODDIR/common.sh"
[ -f "$MODDIR/settings.conf" ] && . "$MODDIR/settings.conf"
{
echo "== build =="; getprop ro.build.fingerprint; getprop ro.miui.build.region; getprop ro.miui.region; getprop ro.mi.os.version.incremental
echo; echo "== gms packages =="; pm list packages | grep -E 'google.android.(gms|gsf)|android.vending'
echo; echo "== FCM sockets (5228-5230) =="; (ss -tn 2>/dev/null || netstat -tn 2>/dev/null) | grep -E ':(5228|5229|5230)[[:space:]]'
echo; echo "== deviceidle whitelist (gms/tg/wa) =="; dumpsys deviceidle whitelist 2>/dev/null | grep -E 'gms|telegram|whatsapp'
for p in $GMS org.telegram.messenger com.whatsapp; do
  echo; echo "== $p =="
  echo -n "RUN_ANY_IN_BACKGROUND: "; cmd appops get $p RUN_ANY_IN_BACKGROUND 2>&1 | head -1
  echo -n "standby bucket: "; am get-standby-bucket $p 2>&1 | head -1
done
echo; echo "== notification service mentions of focus =="; dumpsys notification 2>/dev/null | grep -i focus | head -20
echo; echo "== recent push/notification log lines =="; logcat -d -b main,system 2>/dev/null | grep -iE 'GCM|FCM|MiuiNotification|focus.*notif|NotificationService.*(delay|block)' | tail -60
} > "$OUT" 2>&1
echo done
