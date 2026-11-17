#!/system/bin/sh
MODDIR=${0%/*}
LOG=$MODDIR/hypergsm.log
. "$MODDIR/common.sh"
[ -f "$MODDIR/settings.conf" ] && . "$MODDIR/settings.conf"

log(){ echo "$(date +%m-%d_%H:%M:%S) $*" >> "$LOG"; }
if [ -f "$LOG" ] && [ "$(wc -c < "$LOG")" -gt 65536 ]; then
  tail -n 100 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
fi

# Analytics / measurement components of Play Services. Missing ones fail quietly.
COMPONENTS="
com.google.android.gms.analytics.AnalyticsService
com.google.android.gms.analytics.AnalyticsReceiver
com.google.android.gms.analytics.AnalyticsJobService
com.google.android.gms.measurement.AppMeasurementService
com.google.android.gms.measurement.AppMeasurementReceiver
com.google.android.gms.measurement.AppMeasurementJobService
com.google.android.gms.measurement.AppMeasurementInstallReferrerReceiver
"

set_components(){ # $1 = enable | disable
  for c in $COMPONENTS; do
    pm "$1" "$GMS/$c" >/dev/null 2>&1
  done
}

unrestrict(){
  p=$1
  installed "$p" || return 0
  cmd deviceidle whitelist +"$p" >/dev/null 2>&1
  cmd appops set "$p" RUN_IN_BACKGROUND allow >/dev/null 2>&1
  cmd appops set "$p" RUN_ANY_IN_BACKGROUND allow >/dev/null 2>&1
  cmd appops set "$p" AUTO_START allow >/dev/null 2>&1   # MIUI autostart, best effort
  am set-standby-bucket "$p" active >/dev/null 2>&1
  log "unrestricted $p"
}

PROFILE=$GMS_PROFILE
case "$PROFILE" in off|balanced|aggressive) ;; *) PROFILE=off ;; esac
log "apply: region=$(detect_region) profile=$PROFILE notif_fix=$NOTIF_FIX"

# GMS battery profile
case "$PROFILE" in
  balanced)   set_components disable ;;
  aggressive) set_components disable; cmd deviceidle whitelist -"$GMS" >/dev/null 2>&1 ;;
  *)          set_components enable ;;
esac

# Notification fix (no framework patch)
if [ "$NOTIF_FIX" = "1" ]; then
  if [ "$PROFILE" = "off" ]; then
    for p in $GMS com.google.android.gsf com.android.vending; do unrestrict "$p"; done
  fi
  for p in $PRIORITY_APPS; do
    valid_pkg "$p" && unrestrict "$p"
  done
fi
exit 0
