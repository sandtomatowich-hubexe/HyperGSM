#!/system/bin/sh
MODDIR=${0%/*}
. "$MODDIR/common.sh"
[ -f "$MODDIR/settings.conf" ] && . "$MODDIR/settings.conf"
echo "REGION=$(detect_region)"
echo "MODE_EFFECTIVE=$(detect_mode)"
echo "DEVICE=$(getprop ro.product.mod_device)"
rom=$(getprop ro.mi.os.version.incremental); [ -z "$rom" ] && rom=$(getprop ro.build.version.incremental)
echo "ROM=$rom"
for p in com.google.android.gms com.google.android.gsf com.android.vending; do
  if installed $p; then v=1; else v=0; fi
  echo "PKG_$(echo $p | tr '.' '_')=$v"
done
n=$( (ss -tn 2>/dev/null || netstat -tn 2>/dev/null) | grep -E ':(5228|5229|5230)[[:space:]]' | grep -ci estab )
echo "FCM_CONN=${n:-0}"
