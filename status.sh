#!/system/bin/sh
MODDIR=${0%/*}
. "$MODDIR/common.sh"

region=$(detect_region)
echo "REGION=$region"
if [ "$region" = "cn" ]; then echo "ROMTYPE=cn"; else echo "ROMTYPE=global"; fi
echo "DEVICE=$(getprop ro.product.mod_device)"
rom=$(getprop ro.mi.os.version.incremental)
[ -z "$rom" ] && rom=$(getprop ro.build.version.incremental)
echo "ROM=$rom"
if installed "$GMS"; then echo "GMS=1"; else echo "GMS=0"; fi
n=$( (ss -tn 2>/dev/null || netstat -tn 2>/dev/null) | grep -E ':(5228|5229|5230)[[:space:]]' | grep -ci estab )
echo "FCM_CONN=${n:-0}"
