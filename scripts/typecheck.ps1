# 全仓类型检查；与 typecheck.sh 一样，逐个检查含 tsconfig.json 的目录。
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo

$targets = @(
    Get-ChildItem packages, apps -Directory | Where-Object { Test-Path (Join-Path $_.FullName 'tsconfig.json') }
    if (Test-Path tests/tsconfig.json) { Get-Item tests }
)
if ($targets.Count -eq 0) {
    Write-Error '没有找到任何 tsconfig.json'
    exit 1
}

$failed = @()
foreach ($target in $targets) {
    $name = $target.FullName.Substring($repo.Length + 1).Replace('\', '/')
    $output = & npx tsc --noEmit -p (Join-Path $target.FullName 'tsconfig.json') 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  $name ok"
    } else {
        Write-Host "  $name FAIL"
        $output | Select-Object -First 12 | ForEach-Object { Write-Host "      $_" }
        $failed += $name
    }
}

if ($failed.Count -gt 0) {
    Write-Error "类型检查未通过: $($failed -join ', ')"
    exit 1
}
Write-Host "类型检查全部通过：$($targets.Count) 个目录"
