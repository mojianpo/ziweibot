# Windows PowerShell 脚本

在**仓库根目录**（有 `package.json` 的目录）打开 PowerShell，运行以下命令。`scripts` 是脚本存放目录，不是这些命令的工作目录。

如果当前已经进入 `scripts` 目录，先返回上一级：

```powershell
Set-Location ..
```

然后在仓库根目录运行：

```powershell
npm run typecheck:win
npm run acceptance:win
npm run data:download:win -- --years 1982,1983,1990,2000,2020 --decompress 1982,1983,1990,2000,2020
```

数据下载脚本还支持 `--all`、`--decompress 年份列表` 和 `--help`。解压优先使用系统中的 `zstd`；未安装时使用 Node.js 22.15+ 自带的 Zstandard 解压功能。解压会占用大量磁盘空间，与 Linux 脚本相同。可用 `ZIWEI_DATA_DIR` 指定数据目录。
