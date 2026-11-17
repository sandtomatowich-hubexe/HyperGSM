#!/system/bin/sh
MODDIR=${0%/*}
while [ "$(getprop sys.boot_completed)" != "1" ]; do sleep 5; done
sleep 25
sh "$MODDIR/apply.sh"
while :; do
  sleep 900
  KEEP_APPLIED=1
  [ -f "$MODDIR/settings.conf" ] && . "$MODDIR/settings.conf"
  [ "$KEEP_APPLIED" = "1" ] && sh "$MODDIR/apply.sh"
done
