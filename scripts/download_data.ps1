# 下载和解压 v4.0-13d 数据集。用法与 download_data.sh 相同。
$years = ''
$decompress = $false
$all = $false
for ($i = 0; $i -lt $args.Count; $i++) {
    switch ($args[$i]) {
        '--years' {
            if (++$i -ge $args.Count) { Write-Error '--years 需要年份'; exit 2 }
            $years = $args[$i]
        }
        '--decompress' {
            $decompress = $true
            if ($i + 1 -lt $args.Count -and $args[$i + 1] -notmatch '^--') { $years = $args[++$i] }
        }
        '--all' { $all = $true }
        { $_ -in '-h', '--help' } {
            Write-Host '用法: .\scripts\download_data.ps1 --years 1990,2000 [--decompress 1990,2000] | --all'
            exit 0
        }
        default { Write-Error "未知参数: $($args[$i])"; exit 2 }
    }
}

if (-not $all -and -not $years) { Write-Error '请用 --years 1990,2000 或 --all'; exit 2 }
$zstd = Get-Command zstd -ErrorAction SilentlyContinue
if ($decompress -and -not $zstd) {
    & node -e "process.exit(typeof require('node:zlib').createZstdDecompress === 'function' ? 0 : 1)"
    if ($LASTEXITCODE -ne 0) { Write-Error '解压需要 zstd，或支持 Zstandard 的 Node.js（22.15+）'; exit 1 }
}

$repo = Split-Path -Parent $PSScriptRoot
$dataDir = if ($env:ZIWEI_DATA_DIR) { $env:ZIWEI_DATA_DIR } else { Join-Path $repo 'data' }
$rawDir = Join-Path $dataDir 'raw'
$zstDir = Join-Path $dataDir 'zst'
New-Item -ItemType Directory -Force $rawDir, $zstDir | Out-Null
$base = 'https://github.com/Renhuai123/ziwei-doushu/releases/download/v4.0-13d'

$downloadYears = if ($all) { @(1950..2026) } else { @($years.Split(',') | ForEach-Object { $_.Trim() }) }
foreach ($year in $downloadYears) {
    $archive = Join-Path $zstDir "year-$year.jsonl.zst"
    if ((Test-Path $archive) -and (Get-Item $archive).Length -gt 0) {
        Write-Host "跳过 year-$year.jsonl.zst（已存在）"
        continue
    }
    $part = "$archive.part"
    Write-Host "下载 year-$year.jsonl.zst ..."
    & curl.exe -fL --retry 3 --retry-delay 2 --max-time 600 -o $part "$base/year-$year.jsonl.zst"
    if ($LASTEXITCODE -ne 0) {
        Remove-Item -LiteralPath $part -ErrorAction SilentlyContinue
        Write-Error "下载失败: year-$year"
        exit 1
    }
    Move-Item -LiteralPath $part -Destination $archive -Force
}

if ($decompress) {
    foreach ($year in $years.Split(',') | ForEach-Object { $_.Trim() }) {
        $archive = Join-Path $zstDir "year-$year.jsonl.zst"
        $raw = Join-Path $rawDir "year-$year.jsonl"
        if (-not (Test-Path $archive) -or (Get-Item $archive).Length -eq 0) { Write-Error "缺压缩包: $archive"; exit 1 }
        if ((Test-Path $raw) -and (Get-Item $raw).Length -gt 0) {
            Write-Host "跳过解压 year-$year.jsonl（已存在）"
            continue
        }
        $part = "$raw.part"
        Write-Host "解压 year-$year.jsonl.zst ...（--long=27）"
        if ($zstd) {
            & $zstd.Source -d --long=27 -f $archive -o $part
        } else {
            & node (Join-Path $PSScriptRoot 'decompress_zstd.mjs') $archive $part
        }
        if ($LASTEXITCODE -ne 0) { Remove-Item -LiteralPath $part -ErrorAction SilentlyContinue; exit 1 }
        Move-Item -LiteralPath $part -Destination $raw -Force
    }
}

Write-Host "完成。压缩包目录: $zstDir"
Write-Host "解压后目录:   $rawDir"
