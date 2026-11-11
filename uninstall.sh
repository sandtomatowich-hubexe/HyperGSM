#!/system/bin/sh
for c in analytics.AnalyticsService analytics.AnalyticsReceiver analytics.AnalyticsJobService measurement.AppMeasurementService measurement.AppMeasurementReceiver measurement.AppMeasurementJobService measurement.AppMeasurementInstallReferrerReceiver; do
  pm enable "com.google.android.gms/com.google.android.gms.$c" >/dev/null 2>&1
done
