#!/system/bin/sh
MODDIR=${0%/*}
while [ "$(getprop sys.boot_completed)" != "1" ]; do sleep 5; done
sleep 25
sh "$MODDIR/apply.sh"
while :; do
  sleep 900
  . "$MODDIR/settings.conf" 2>/dev/null
  [ "$KEEP_APPLIED" = "1" ] && sh "$MODDIR/apply.sh"
done
