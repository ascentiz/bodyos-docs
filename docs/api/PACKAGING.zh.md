# BodyOS SDK 部署指南

## 目录布局
```text
/opt/bodyos/
├── v2.0.0/
├── v2.1.0/
└── current -> v2.1.0 ← systemd 只认 current

/etc/bodyos/daemon.conf ← 用户配置（升级不动）
/var/log/bodyos/ ← 日志（升级不动）
/run/bodyos/ ← 运行时（升级不动）
```

## 首次安装

```bash
tar xzf bodyos-sdk-v2.0.0.tar.gz
cd bodyos-sdk-2.0.0
sudo ./bodyos_sdk_install.sh
```
自定义部署路径：

```bash
sudo ./bodyos_sdk_install.sh --root /usr/local/bodyos
```

安装脚本不会覆盖已有安装或残留服务。已有部署请使用升级脚本；需要重装时，
先卸载（默认保留配置和用户），再执行安装。
升级脚本目前仅支持默认部署路径的升级；自定义路径支持下面的卸载命令。
daemon 启动后会等待最多约 30 秒，检查控制 IPC 应答和推流 socket 连接；
这不代表硬件链路或传感器数据正常。启动或就绪检查失败时，安装文件和
`current` 保留以供排查，请查看 `journalctl -u bodyos-daemon -n 50 --no-pager`。

## 升级
```bash
sudo ./bodyos_sdk_upgrade.sh bodyos-sdk-v2.1.0.tar.gz
```
自动完成：解压 → 编译 Python SDK → 对比 systemd → 原子切换 symlink → 重启 → 失败回滚 → 清理旧版本。

## 回滚
```bash
sudo ./bodyos_sdk_upgrade.sh --rollback             # 回上一版本
sudo ./bodyos_sdk_upgrade.sh --rollback-to v2.0.0   # 回指定版本
sudo ./bodyos_sdk_upgrade.sh --list                 # 查看已安装
```

## 卸载
默认保留 `/etc/bodyos/` 用户配置及 `bodyos` 用户；日志默认删除，可用
`--keep-logs` 保留。

```bash
# 完全卸载（交互确认）
sudo ./bodyos_sdk_upgrade.sh --uninstall

# 跳过确认
sudo ./bodyos_sdk_upgrade.sh --uninstall --yes

# 只删旧版本，保留当前和配置
sudo ./bodyos_sdk_upgrade.sh --uninstall --version v2.0.0

# 预览（安全）
sudo ./bodyos_sdk_upgrade.sh --uninstall --dry-run

# 显式删除配置和用户（仅在用户没有运行中的进程时删除用户）
sudo ./bodyos_sdk_upgrade.sh --uninstall --purge-config --purge-user

# 自定义根目录安装的卸载（--root 放在子命令前）
sudo ./bodyos_sdk_upgrade.sh --root /usr/local/bodyos --uninstall
```

## 常见问题
### Q: 升级后 Python 报 bad magic number？
升级脚本会自动用目标机 python3 重新编译 .pyc。如仍报错，检查 python3 是否可用。

### Q: 如何看当前运行的 git hash？
bodyos-daemon --version 会打印 version、git hash、build time。

### Q: 可以同时跑两个版本吗？
不行，systemd 只启动 current。但旧版本目录保留，回滚只切软链。

### Q: 旧版本会一直占空间吗？
升级脚本保留 2 个版本（当前 + 上一个），更旧的自动清理。
