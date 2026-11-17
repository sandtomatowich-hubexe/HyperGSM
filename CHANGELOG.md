# Changelog

## v0.3
- Fixed: the Diagnostics button froze the WebUI and crashed the root manager. Diagnostics now run in the background, the WebUI polls for the result, and the output is limited to 20 KB of plain ASCII.
- Fixed: the Battery page had no clear way to set a profile. Profiles are now a selectable list with an explicit "Apply profile" button and an ACTIVE tag.
- Changed: GMS profiles now apply on any ROM, including CN. Previously they were ignored on CN. The default is Off on CN and Balanced on Global, chosen at install.
- Changed: with the Off profile, Google services are kept unrestricted. Balanced and Aggressive leave them to the battery profile.
- Removed: the ROM mode override (it is no longer needed) and the duplicate Apply buttons.
- Removed: about 8 KB of unused CSS and dead code inherited from the sample UI.
- Settings are kept when updating from an older version.
- Shell scripts and WebUI cleaned up and checked.

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
