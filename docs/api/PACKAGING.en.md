# BodyOS SDK Deployment Guide

## Directory Layout

```text
/opt/bodyos/
├── v2.0.0/
├── v2.1.0/
└── current -> v2.1.0 ← systemd only uses current

/etc/bodyos/daemon.conf ← User configuration (preserved during upgrades)
/var/log/bodyos/ ← Logs (preserved during upgrades)
/run/bodyos/ ← Runtime files (preserved during upgrades)
```

## First-Time Installation

```bash
tar xzf bodyos-sdk-v2.0.0.tar.gz
cd bodyos-sdk-2.0.0
sudo ./bodyos_sdk_install.sh
```

To use a custom deployment path:

```bash
sudo ./bodyos_sdk_install.sh --root /usr/local/bodyos
```

## Upgrade

```bash
sudo ./bodyos_sdk_upgrade.sh bodyos-sdk-v2.1.0.tar.gz
```

The upgrade script automatically performs the following steps: extract the package → build the Python SDK → compare the systemd configuration → atomically switch the symlink → restart the service → roll back on failure → remove old versions.

## Rollback

```bash
sudo ./bodyos_sdk_upgrade.sh --rollback             # Roll back to the previous version
sudo ./bodyos_sdk_upgrade.sh --rollback-to v2.0.0   # Roll back to a specified version
sudo ./bodyos_sdk_upgrade.sh --list                 # List installed versions
```

## Uninstall

```bash
# Complete uninstall (requires interactive confirmation)
sudo ./bodyos_sdk_upgrade.sh --uninstall

# Skip confirmation
sudo ./bodyos_sdk_upgrade.sh --uninstall --yes

# Remove only an old version; keep the current version and configuration
sudo ./bodyos_sdk_upgrade.sh --uninstall --version v2.0.0

# Preview changes without applying them (safe)
sudo ./bodyos_sdk_upgrade.sh --uninstall --dry-run

# Reinstallation scenario: preserve configuration and the service user
sudo ./bodyos_sdk_upgrade.sh --uninstall --yes --keep-config --keep-user
```

## Frequently Asked Questions

### Q: Why does Python report `bad magic number` after an upgrade?

The upgrade script automatically recompiles `.pyc` files using the target system's `python3`. If the error persists, verify that `python3` is available.

### Q: How can I view the Git hash of the running version?

Run `bodyos-daemon --version`. It prints the version, Git hash, and build time.

### Q: Can two versions run at the same time?

No. systemd starts only `current`. Older version directories are retained, and rollback only switches the symlink.

### Q: Will old versions continue to consume disk space?

The upgrade script retains two versions—the current version and the previous version—and automatically removes older versions.
