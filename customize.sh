SKIPUNZIP=0
[ "$API" -lt 34 ] && abort "! Needs Android 14+ (found API $API)"
r=$(getprop ro.miui.build.region); [ -z "$r" ] && r=$(getprop ro.miui.region)
r=$(echo "$r" | tr 'A-Z' 'a-z')
ui_print "- Region: ${r:-unknown}"
if [ "$r" = "cn" ]; then
  ui_print "- CN ROM: adding sysconfig allowlist for GMS"
  mkdir -p "$MODPATH/system/product/etc/sysconfig"
  cat > "$MODPATH/system/product/etc/sysconfig/hypergsm.xml" <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<config>
    <allow-in-power-save package="com.google.android.gms" />
    <allow-in-data-usage-save package="com.google.android.gms" />
</config>
XML
else
  ui_print "- Global ROM: battery profile mode (no sysconfig added)"
fi
set_perm_recursive "$MODPATH" 0 0 0755 0644
for f in apply.sh status.sh diag.sh service.sh uninstall.sh customize.sh; do set_perm "$MODPATH/$f" 0 0 0755; done
