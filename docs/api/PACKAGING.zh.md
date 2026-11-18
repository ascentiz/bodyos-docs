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
```bash
# 完全卸载（交互确认）
sudo ./bodyos_sdk_upgrade.sh --uninstall

# 跳过确认
sudo ./bodyos_sdk_upgrade.sh --uninstall --yes

# 只删旧版本，保留当前和配置
sudo ./bodyos_sdk_upgrade.sh --uninstall --version v2.0.0

# 预览（安全）
sudo ./bodyos_sdk_upgrade.sh --uninstall --dry-run

# 重装场景：保留配置和用户
sudo ./bodyos_sdk_upgrade.sh --uninstall --yes --keep-config --keep-user
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