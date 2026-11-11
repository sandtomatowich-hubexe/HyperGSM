# HyperGSM

A KernelSU / Magisk / APatch module for HyperOS that keeps Google Play Services and push notifications working properly on CN ROMs, and tames Play Services battery drain on Global ROMs. It includes a WebUI for configuration.

> **Status:** v0.2, test build. Developed against the Poco X6 Pro (`duchamp`) on HyperOS 3.0.305 / Android 16.

## What it does

**1. Notification delay fix (no framework patch)**
Keeps Google services and your chosen apps out of background restrictions:
- Doze whitelist
- `RUN_IN_BACKGROUND` / `RUN_ANY_IN_BACKGROUND` appops
- MIUI autostart appop (best effort)
- "Active" app standby bucket

Telegram and WhatsApp are preloaded as priority apps. Add any other package from the WebUI.

**2. CN ROM support**
- Adds a sysconfig allowlist so Play Services is allowed in power-save and data-saver modes.
- Always keeps Play Services, GSF and Play Store unrestricted.

**3. Global ROM battery tuning**

| Profile | Behaviour |
|---|---|
| Off | Nothing disabled. |
| Balanced | Disables Play Services analytics and measurement components. Push, location and sync are untouched. |
| Aggressive | Balanced, plus removes Play Services from the Doze whitelist. Saves more, but push can arrive late. |

The ROM mode is detected from the build region (`ro.miui.build.region`). You can force CN or Global from the WebUI.

## What it does not do

- It does **not** bundle Google Play Services. On a CN ROM, install it yourself.
- It does **not** ship the CN location overlays (they need a compiled overlay APK).
- It does **not** patch `framework.jar` or `services.jar`. A Focus notification whitelist patch is a possible later step if the diagnostics show it is needed.

## Requirements

- Android 14 or newer (built for HyperOS on Android 16)
- Root with KernelSU, Magisk or APatch.
- For the WebUI: KernelSU or APatch (shows an Open button on the module), or a WebUI app such as MMRL / KsuWebUI on Magisk. The WebUI files live in `webroot/`.

## Install

1. Flash `HyperGSM-vX.Y.zip` from your root manager.
2. Reboot.
3. Open the module's WebUI from the manager.

## Using the WebUI

- **Home:** push connection status, ROM mode, Play Services state, quick toggles, Apply.
- **Notify:** priority app list and a diagnostics button.
- **Battery:** GMS battery profile and ROM mode override.
- **About:** recent module log.

Settings live in `/data/adb/modules/hypergsm/settings.conf`. Edit by hand if you prefer, then run `sh /data/adb/modules/hypergsm/apply.sh`.

## Diagnostics

If notifications are still delayed, run diagnostics on the Notify page and share the output. It reports Play Services push sockets, Doze and appop state, standby buckets, and related notification log lines.

## Uninstall

Remove the module from your root manager and reboot. The uninstall script re-enables any Play Services components the module disabled.

## Credits

The WebUI is based on the HyperTouch WebUI, used with its author's permission.

## License

GPL-3.0. See [LICENSE](LICENSE).
