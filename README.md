<p align="center">
  <img
    src="assets/HyperGSM-Banner.png"
    alt="HyperGSM Banner"
    width="100%"
  />
</p>

<p align="center">
  <img
    src="https://raw.githubusercontent.com/sandtomatowich-hubexe/sandtomatowich-hubexe/main/HyperGSM.svg"
    alt="HyperGSM"
    width="100%"
  />
</p>
###What is HyperGSM?

**HyperGSM (Hyper Google System Manager)** is an Android system management module designed to improve Google Mobile Services integration, notification reliability, and background behavior on HyperOS.

Built around a modular architecture, HyperGSM combines system-level configuration, battery management, package validation, and a WebUI into a unified management environment.

Rather than modifying Android framework components or bundling an entire Google Apps package, HyperGSM focuses on managing supported components through configurable system operations and a structured package management framework.

---

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Notification Management](#notification-management)
- [GMS Battery Management](#gms-battery-management)
- [Google Package Framework](#google-package-framework)
- [WebUI](#webui)
- [Architecture](#architecture)
- [Compatibility](#compatibility)
- [Installation](#installation)
- [Configuration and Diagnostics](#configuration-and-diagnostics)
- [Development](#development)
- [Credits](#credits)
- [License](#license)

---

## Overview

Google Mobile Services can behave differently across Android distributions, particularly on devices running China-region ROMs.

Background restrictions, application standby policies, autostart behavior, and system-level permission handling can affect notification delivery and the operation of Google applications.

HyperGSM aims to provide a configurable management layer for these behaviors.

Its main objectives include:

- Improving background notification reliability for supported applications.
- Providing configurable battery management for Google Mobile Services.
- Supporting Google services integration on compatible HyperOS environments.
- Introducing a structured framework for managing Google application packages.
- Validating package compatibility and integrity before deployment.
- Providing configuration and diagnostic information through a WebUI.

HyperGSM does not bundle Google Play Services or independently replace Android framework components.

## Core Features

| Feature | Description |
|---|---|
| Notification Management | Configures supported system settings to improve background notification reliability. |
| GMS Battery Management | Provides configurable battery profiles for Google Mobile Services. |
| CN ROM Support | Includes dedicated integration mechanisms for China-region ROMs. |
| WebUI | Provides an interface for module configuration and diagnostics. |
| Manifest-Based Package Management | Uses structured manifests to define supported Google packages. |
| Package Validation | Checks package metadata, integrity, compatibility, and signing information. |
| Partition-Aware Planning | Handles package placement according to declared system partitions. |
| Diagnostic Reports | Collects device and deployment information for troubleshooting. |

## Notification Management

Android and HyperOS use several background-management mechanisms that can affect how applications receive notifications.

HyperGSM provides configurable operations intended to reduce notification delays by managing selected system-level restrictions.

### Supported Operations

| Operation | Purpose |
|---|---|
| Doze Whitelist | Exempts selected applications from certain Doze restrictions. |
| AppOps Configuration | Adjusts supported application operation settings. |
| Autostart AppOp | Manages the relevant MIUI/HyperOS autostart operation where supported. |
| Standby Bucket | Adjusts the standby classification of selected applications. |
| Application Selection | Allows supported packages to be managed through the WebUI. |

Selected applications such as Telegram and WhatsApp can be configured for notification-related management.

Additional package names can be managed through the module interface.

**Note:** Actual behavior depends on the ROM implementation. These operations cannot guarantee uninterrupted notification delivery on every device or firmware version.

## GMS Battery Management

Google Play Services and related Google components can perform background tasks such as synchronization, location-related operations, and notification handling.

HyperGSM provides battery profiles to control its additional GMS management behavior.

### Available Profiles

| Profile | Description |
|---|---|
| Off | Disables HyperGSM's additional GMS battery management. |
| Balanced | Applies moderate background management. |
| Aggressive | Applies more restrictive battery-oriented management. |

### Default Behavior

The default profile can differ depending on the ROM configuration:

| ROM Configuration | Default Profile |
|---|---|
| China ROM | Off |
| Global ROM | Balanced |

These profiles control HyperGSM's management behavior; they do not guarantee a specific battery-life improvement.

## Google Package Framework

One of HyperGSM's major components is its manifest-based Google package management framework.

Instead of relying on unverified APK files or uncontrolled package installation, the framework uses structured package definitions and validation rules.

### Manifest Architecture

HyperGSM separates core Google components from optional applications.

| Manifest | Purpose |
|---|---|
| `google/manifest.json` | Defines the core Google components. |
| `google/apps.json` | Defines optional Google applications such as Chrome, Gmail, Maps, Photos, Drive, Contacts, and Calendar. |

Package entries can contain information such as:

- Package name and component type.
- Target partition.
- Expected version and version code.
- Download and file metadata.
- SHA-256 checksum.
- Signing certificate fingerprint.
- Split APK definitions.
- Runtime permission declarations.
- Compatibility requirements.

### Package Validation

Before a package can be considered deployable, the framework checks several conditions.

| Validation | Purpose |
|---|---|
| SDK Compatibility | Ensures the package targets a supported Android version. |
| ABI Compatibility | Checks compatibility with the device architecture. |
| Version Pinning | Requires the declared package version and version code. |
| Package Identity | Verifies the expected Android package name. |
| SHA-256 Verification | Checks file integrity. |
| Certificate Verification | Validates the expected signing certificate fingerprint. |
| Split Validation | Checks the declared APK split set. |
| Partition Validation | Ensures the declared deployment destination is supported. |
| Downgrade Protection | Prevents unsupported version downgrades. |

A package that fails a required validation check is rejected by the deployment planner.

### Partition-Aware Deployment

Android system components may belong to different partitions, and their configuration files must be placed in appropriate locations.

HyperGSM's deployment architecture accounts for declared partition destinations, including:

- `system/product`
- `system/system_ext`

The framework also supports explicit configuration-file destinations and associated integrity metadata.

This allows package definitions and deployment planning to remain separate from the actual installation process.

### Runtime Permission Management

The framework includes a permission-grant mechanism for supported deployment definitions.

Permission grants are designed to be applied once per build, without automatically restoring permissions that a user has subsequently revoked.

Privileged permission handling also requires appropriate allowlist configuration. Merely placing an APK inside a privileged application directory does not automatically grant privileged permissions.

### Deployment Limitations

Not every Google component can be deployed through a systemless approach.

For example:

- Play Services APEX packages are rejected by the current deployment planner.
- Boot-time components and certain overlays cannot simply be supplied as ordinary systemless files.
- Package signing and partition requirements must be validated.
- Real-device testing is necessary before considering a package configuration reliable.

The bundled manifests currently do not contain deployable package builds. Therefore, the package framework should not be interpreted as a working one-click Google Apps installer.

## WebUI

HyperGSM includes a WebUI for accessing module settings and viewing relevant system information.

The interface is organized into dedicated sections.

| Section | Description |
|---|---|
| Home | Displays module information and general status. |
| Notify | Provides notification-management settings. |
| Battery | Allows selection of GMS battery profiles. |
| Google | Displays package information, pinned versions, validation results, and deployment reports. |
| About | Contains module information and related details. |

The Google section is designed to make package validation results and deployment restrictions visible rather than silently ignoring failed checks.

## Architecture

HyperGSM uses separate components for configuration, package management, validation, and reporting.

### Main Components

| Component | Responsibility |
|---|---|
| Module Scripts | Handle module installation and system integration. |
| Configuration Layer | Stores and manages user-selected settings. |
| Notification Manager | Applies supported notification-related system configurations. |
| Battery Manager | Controls the selected GMS battery profile. |
| Manifest Parser | Reads structured Google package definitions. |
| Deployment Planner | Evaluates package compatibility and deployment requirements. |
| Grant Manager | Handles declared runtime permission operations. |
| Diagnostic Reporter | Collects device information and deployment metadata. |
| WebUI | Provides access to user-facing controls and reports. |

### Configuration Storage

Module settings are stored at:

`/data/adb/modules/hypergsm/settings.conf`

The module uses structured configuration handling to keep settings separate from its main management logic.

## Compatibility

HyperGSM is intended for compatible Android environments running HyperOS.

| Requirement | Details |
|---|---|
| Android | Android 14 or newer |
| ROM | HyperOS-based ROMs |
| Architecture | Depends on the supported package and device ABI |
| Root | KernelSU, Magisk, or APatch |
| WebUI | A compatible WebUI manager |

WebUI availability depends on the installed root solution and its supported interface implementation.

Some features may behave differently across ROM versions and device configurations.

## Installation

1. Download the desired HyperGSM release ZIP.
2. Open your supported root manager.
3. Flash the ZIP package.
4. Reboot the device.
5. Open the HyperGSM WebUI.
6. Configure the available notification and battery settings.

Always use a release intended for your Android and ROM environment.

## Configuration and Diagnostics

HyperGSM provides configuration and diagnostic mechanisms to make troubleshooting easier.

### Settings

The module stores its configuration in:

`/data/adb/modules/hypergsm/settings.conf`

Available settings depend on the installed module version.

### Diagnostic Reports

The diagnostic reporting system can collect information such as:

- Device build fingerprint.
- Manifest revisions.
- Pinned package versions.
- Deployment information.
- Staged file hashes.

These reports are intended to help identify configuration and package-validation problems.

### Uninstallation

HyperGSM can be removed through the installed root manager.

After uninstalling, reboot the device to complete module removal. User-created backups or external files should be handled separately.

## Development

HyperGSM is developed with an emphasis on modularity, validation, and predictable system integration.

Its package management framework includes a maintainer utility:

`tools/hypergsm-manifest.py`

### Manifest Utility

| Command | Purpose |
|---|---|
| `add` | Adds a package definition. |
| `add-config` | Adds a configuration-file definition. |
| `pin` | Pins a package version. |
| `verify-cert` | Verifies or records certificate information. |
| `check` | Checks package definitions. |
| `validate` | Validates manifest structure and requirements. |

### Testing

Automated lifecycle tests use mocked package data and stubbed Android commands.

These tests help validate internal logic, but they do not replace testing on physical devices.

Real-device validation remains necessary for firmware-specific behavior, package compatibility, permissions, and deployment operations.

## Credits

- **HyperTouch** — WebUI foundation and inspiration.
- **MindTheGapps** — Reference for Google package organization and configuration research.

## License

HyperGSM is licensed under the **GNU General Public License v3.0**.

See [LICENSE](LICENSE) for the full license text.
