# Changelog

## v0.2
- Fixed: the WebUI button was missing in the root manager. The WebUI folder is now `webroot`, which is where KernelSU, APatch and MMRL look for it.
- Fixed: the author tag in `module.prop` now reads Sep.
- Diagnostics output now writes to `webroot/diag.txt`.
- README updated for the WebUI location.

## v0.1
- First test build.
- Notification fix for GMS and priority apps without framework patching.
- CN sysconfig allowlist for Play Services.
- Global GMS battery profiles (Off / Balanced / Aggressive).
- WebUI with status, priority apps, profiles and diagnostics.
