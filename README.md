<p align="center">
  <!-- TODO: Replace with the actual battery banner image URL -->
  <img src="assets/HyperGSM-Banner.png" alt="HyperGSM Banner" width="100%">
</p><p align="center">
  <!-- TODO: Replace with the custom HyperGSM SVG URL -->
  <p align="center">
  <img
    src="https://raw.githubusercontent.com/sandtomatowich-hubexe/sandtomatowich-hubexe/main/HyperGSM.svg"
    alt="HyperGSM"
    width="100%"
  />
</p>
### What's HyperGSM?
HyperGSM is an Android system management module focused on Google Mobile Services integration, notification reliability, and GMS battery management on HyperOS.

Designed with a modular architecture, HyperGSM provides configurable system-level behavior through a WebUI and a structured package management framework.

---

Features

- Notification Management — Improve background notification reliability through configurable system settings.
- GMS Battery Management — Configurable battery profiles for Google Mobile Services.
- CN ROM Compatibility — Dedicated support mechanisms for Google services on China ROMs.
- WebUI Configuration — Manage module settings through an integrated interface.
- Manifest-Based Package Management — Structured package definitions with version pinning and validation.
- Deployment Validation — Compatibility, package integrity, signing certificate, and partition checks before deployment.
- Diagnostic Reports — Generate reports containing device information, manifest revisions, and staged file hashes.

GMS Management

HyperGSM provides configurable GMS management with three battery profiles:

Profile| Description
Off| Disables additional GMS battery management
Balanced| Moderate background management
Aggressive| More restrictive battery-oriented management

Available defaults may differ between ROM configurations.

Google Package Framework

Starting with v0.5, HyperGSM introduces a manifest-based package management architecture.

The framework supports:

- Version-pinned packages
- SHA-256 integrity verification
- Signing certificate verification
- Split APK validation
- Partition-aware deployment planning
- Package compatibility checks
- Runtime permission grant definitions
- Deployment reports

The framework is still experimental. Actual Google app deployment requires validated package builds and real-device testing.

WebUI

The WebUI provides access to the module's configuration and diagnostic features.

Available sections include:

- Home — Module overview and status
- Notify — Notification management
- Battery — GMS battery profiles
- Google — Package information and deployment status
- About — Module information

Compatibility

- Android 14+
- HyperOS-based ROMs
- Root access through KernelSU, Magisk, or APatch

WebUI availability depends on the installed root solution and its supported WebUI manager.

Installation

1. Download the latest available release.
2. Flash the ZIP through your supported root manager.
3. Reboot your device.
4. Open the HyperGSM WebUI to configure available features.

Note: Experimental Google package deployment features are not yet generally available.

Development

HyperGSM is developed with a focus on modularity, package integrity, compatibility checks, and safe system integration.

Contributions, testing, and technical feedback are welcome.

License

This project is licensed under the GNU General Public License v3.0.

Credits

- HyperTouch — WebUI foundation and inspiration.
- MindTheGapps — Reference for Google package organization and configuration research.
