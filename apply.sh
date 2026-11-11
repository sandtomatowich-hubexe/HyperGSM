#!/system/bin/sh
MODDIR=${0%/*}
LOG=$MODDIR/hypergsm.log
. "$MODDIR/common.sh"
[ -f "$MODDIR/settings.conf" ] && . "$MODDIR/settings.conf"
log(){ echo "$(date +%m-%d_%H:%M:%S) $*" >> "$LOG"; }
[ -f "$LOG" ] && [ "$(wc -c < "$LOG")" -gt 65536 ] && tail -n 100 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"

EFFECTIVE=$(detect_mode)
log "apply: mode=$EFFECTIVE profile=$GMS_PROFILE notif_fix=$NOTIF_FIX"

# Components widely used for analytics/ads measurement. Missing ones just fail quietly.
COMPONENTS="
com.google.android.gms.analytics.AnalyticsService
com.google.android.gms.analytics.AnalyticsReceiver
com.google.android.gms.analytics.AnalyticsJobService
com.google.android.gms.measurement.AppMeasurementService
com.google.android.gms.measurement.AppMeasurementReceiver
com.google.android.gms.measurement.AppMeasurementJobService
com.google.android.gms.measurement.AppMeasurementInstallReferrerReceiver
"

unrestrict(){
  p=$1
  installed "$p" || return 0
  cmd deviceidle whitelist +"$p" >/dev/null 2>&1
  cmd appops set "$p" RUN_IN_BACKGROUND allow >/dev/null 2>&1
  cmd appops set "$p" RUN_ANY_IN_BACKGROUND allow >/dev/null 2>&1
  cmd appops set "$p" AUTO_START allow >/dev/null 2>&1   # MIUI autostart (best effort)
  am set-standby-bucket "$p" active >/dev/null 2>&1
  log "unrestricted $p"
}

set_components(){ # $1 = enable|disable
  for c in $COMPONENTS; do
    pm "$1" "$GMS/$c" >/dev/null 2>&1
  done
}

# --- Part 1b: GMS battery tuning (Global-style behaviour) ---
if [ "$EFFECTIVE" = "global" ]; then
  case "$GMS_PROFILE" in
    balanced)   set_components disable ;;
    aggressive) set_components disable; cmd deviceidle whitelist -"$GMS" >/dev/null 2>&1 ;;
    *)          set_components enable ;;
  esac
  log "gms profile: $GMS_PROFILE"
else
  set_components enable   # CN: never leave GMS analytics components disabled by us
fi

# --- Part 2: notification delay fix without touching framework.jar ---
if [ "$NOTIF_FIX" = "1" ]; then
  # GMS carries FCM. On Global with a battery profile we leave it to the profile.
  if [ "$EFFECTIVE" = "cn" ] || [ "$GMS_PROFILE" = "off" ]; then
    for p in $GMS com.google.android.gsf com.android.vending; do unrestrict "$p"; done
  fi
  for p in $PRIORITY_APPS; do valid_pkg "$p" && unrestrict "$p"; done
fi
exit 0
