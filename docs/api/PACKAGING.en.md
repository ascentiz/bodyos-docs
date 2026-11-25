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

The installation script does not overwrite an existing installation or residual services. For an existing deployment,
use the upgrade script; to reinstall, uninstall it first (which preserves the configuration and service user by default),
then run the installer.
The upgrade script currently supports upgrades only for the default deployment path; use the uninstall command below
for custom paths.
After the daemon starts, it waits up to approximately 30 seconds to check the control IPC response and push-stream socket.
This does not guarantee that the hardware link or sensor data is healthy. If startup or readiness checks fail, installation
files and `current` are retained for troubleshooting. Check `journalctl -u bodyos-daemon -n 50 --no-pager`.

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
By default, `/etc/bodyos/` and the `bodyos` user are preserved. Logs are deleted by default; use
`--keep-logs` to preserve them.

```bash
# Complete uninstall (requires interactive confirmation)
sudo ./bodyos_sdk_upgrade.sh --uninstall

# Skip confirmation
sudo ./bodyos_sdk_upgrade.sh --uninstall --yes

# Remove only an old version; keep the current version and configuration
sudo ./bodyos_sdk_upgrade.sh --uninstall --version v2.0.0

# Preview changes without applying them (safe)
sudo ./bodyos_sdk_upgrade.sh --uninstall --dry-run

# Explicitly remove configuration and the user (the user is removed only when no processes are running)
sudo ./bodyos_sdk_upgrade.sh --uninstall --purge-config --purge-user

# Uninstall a custom-root installation (--root must precede the subcommand)
sudo ./bodyos_sdk_upgrade.sh --root /usr/local/bodyos --uninstall
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
