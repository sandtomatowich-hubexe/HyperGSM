[ "$API" -lt 34 ] && abort "! Needs Android 14+ (found API $API)"

r=$(getprop ro.miui.build.region)
[ -z "$r" ] && r=$(getprop ro.miui.region)
r=$(echo "$r" | tr 'A-Z' 'a-z')
ui_print "- Region: ${r:-unknown}"

# Keep the user's settings across updates (drop keys that no longer exist)
OLD=/data/adb/modules/hypergsm/settings.conf
if [ -f "$OLD" ]; then
  ui_print "- Keeping existing settings"
  grep -vE '^(MODE|CONF_VERSION)=' "$OLD" > "$MODPATH/settings.conf.new"
  echo "CONF_VERSION=2" >> "$MODPATH/settings.conf.new"
  # Settings from before v0.3 had a different profile meaning: reset it to the region default
  grep -q '^CONF_VERSION=1' "$OLD" && sed -i '/^GMS_PROFILE=/d' "$MODPATH/settings.conf.new" && RESET_PROFILE=1
  mv -f "$MODPATH/settings.conf.new" "$MODPATH/settings.conf"
  [ -n "$RESET_PROFILE" ] && echo "GMS_PROFILE=off" >> "$MODPATH/settings.conf"
fi
if [ ! -f "$OLD" ] || [ -n "$RESET_PROFILE" ]; then
  if [ "$r" != "cn" ]; then
    ui_print "- Global ROM: default profile = balanced"
    sed -i 's/^GMS_PROFILE=.*/GMS_PROFILE=balanced/' "$MODPATH/settings.conf"
  fi
fi

if [ "$r" = "cn" ]; then
  ui_print "- CN ROM: adding sysconfig allowlist for Play Services"
  mkdir -p "$MODPATH/system/product/etc/sysconfig"
  cat > "$MODPATH/system/product/etc/sysconfig/hypergsm.xml" <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<config>
    <allow-in-power-save package="com.google.android.gms" />
    <allow-in-data-usage-save package="com.google.android.gms" />
</config>
XML
fi

set_perm_recursive "$MODPATH" 0 0 0755 0644
for f in apply status diag service uninstall customize; do
  set_perm "$MODPATH/$f.sh" 0 0 0755
done
