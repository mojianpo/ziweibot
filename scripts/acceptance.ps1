# MVP 总验收；逐项报告 PASS / FAIL，失败时返回非零退出码。
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo
$pass = 0
$fail = 0
$skip = 0
$failedItems = @()

function Check($name, $command, [string[]]$arguments, $needle = $null) {
    $output = (& $command @arguments 2>&1 | Out-String)
    $code = $LASTEXITCODE
    if ($code -eq 0 -and ($null -eq $needle -or $output.Contains($needle))) {
        Write-Host "  PASS $name"
        $script:pass++
    } else {
        Write-Host "  FAIL $name"
        ($output.TrimEnd() -split "`r?`n" | Select-Object -Last 5) | ForEach-Object { Write-Host "      $_" }
        if ($null -ne $needle -and -not $output.Contains($needle)) { Write-Host "      未找到: $needle" }
        $script:fail++
        $script:failedItems += $name
    }
}

Write-Host '1. 环境'
Write-Host "  node $(& node -v) / npm $(& npm -v)"

Write-Host '2. 数据与索引'
$indexCount = if (Test-Path data/index) { @(Get-ChildItem data/index -Filter '*.idx.json').Count } else { 0 }
if ($indexCount -gt 0) {
    Write-Host "  索引文件: $indexCount 个"
} else {
    Write-Host '  无索引目录（数据相关项将跳过）'
    $skip++
}

Write-Host '3. 类型检查'
foreach ($name in @('chart-engine', 'reading-index', 'core', 'citation-guard', 'ask')) {
    $path = "packages/$name/tsconfig.json"
    if (Test-Path $path) { Check "packages/$name" 'npx' @('tsc', '--noEmit', '-p', $path) }
}
foreach ($name in @('cli', 'web')) {
    $path = "apps/$name/tsconfig.json"
    if (Test-Path $path) { Check "apps/$name" 'npx' @('tsc', '--noEmit', '-p', $path) }
}

Write-Host '4. 回归测试'
if (Test-Path tests/run.ts) { Check 'npm test' 'npm' @('test') } else { $skip++ }

Write-Host '5. 键口径实证校验'
if ($indexCount -eq 0) {
    Write-Host '  跳过键口径校验（无数据索引）'
    $skip++
} elseif (Test-Path tests/test_key_alignment.ts) {
    $output = (& npx tsx tests/test_key_alignment.ts 2>&1 | Out-String)
    $code = $LASTEXITCODE
    $output -split "`r?`n" | Where-Object { $_ -match '样本总数|口径A|口径B|不匹配' } | ForEach-Object { Write-Host "    $_" }
    if ($code -eq 0 -and ($output.Contains('PASS') -or ($output -match '失败\s*0' -and $output.Contains('口径A')))) {
        Write-Host '  PASS 键口径一致'
        $pass++
    } else {
        Write-Host '  FAIL 键口径一致'
        $fail++
        $failedItems += '键口径校验'
    }
}

Write-Host '6. CLI 端到端'
if (Test-Path apps/cli/src/index.ts) {
    $chart = @('tsx', 'apps/cli/src/index.ts', 'chart', '--date', '1990-01-01', '--hour', '0', '--gender', 'male')
    $read = @('tsx', 'apps/cli/src/index.ts', 'read', '--date', '1990-01-01', '--hour', '0', '--gender', 'male')
    Check 'chart 输出 命宫' 'npx' $chart '命宫'
    Check 'chart 输出 水二局' 'npx' $chart '水二局'
    Check 'chart 输出 命主巨门' 'npx' $chart '巨门'
    if ($indexCount -gt 0) {
        Check 'read 命中 13 维' 'npx' $read '13/13'
        Check '中文时辰等价' 'npx' @('tsx', 'apps/cli/src/index.ts', 'read', '--date', '1990-01-01', '--hour', '子', '--gender', 'male') '天府'
        Check '未覆盖诚实提示' 'npx' @('tsx', 'apps/cli/src/index.ts', 'read', '--date', '1949-06-15', '--hour', '6', '--gender', 'female') '样本库未覆盖'
    } else {
        Write-Host '  跳过 read 数据集检查（无数据索引）'
        $skip += 3
    }
    Check '署名（数据集）' 'npx' $chart '王多鱼AI'
    Check '免责声明' 'npx' $chart '不构成任何医疗'
    if ($indexCount -gt 0) {
        Check 'coverage 输出年份' 'npx' @('tsx', 'apps/cli/src/index.ts', 'coverage') '1990'
    } else { $skip++ }
    Check 'help 无参数可用' 'npx' @('tsx', 'apps/cli/src/index.ts', 'help')
    Check '晚子时按次日排盘' 'npx' @('tsx', 'apps/cli/src/index.ts', 'chart', '--date', '1990-01-01', '--clock', '23:30', '--gender', 'male') '1990年1月2日'
    $json = (& npx tsx apps/cli/src/index.ts chart --date 1990-01-01 --hour 0 --gender male --json 2>$null | Out-String)
    try {
        if ($LASTEXITCODE -ne 0) { throw 'CLI 返回非零退出码' }
        $null = $json | ConvertFrom-Json -ErrorAction Stop
        Write-Host '  PASS --json 输出可解析'
        $pass++
    } catch {
        Write-Host '  FAIL --json 输出不可解析'
        $fail++
        $failedItems += '--json'
    }
} else { $skip++ }

Write-Host '7. 引用降级与追问模块'
if (Test-Path packages/citation-guard/src/selftest.ts) { Check 'citation-guard 自测' 'npx' @('tsx', 'packages/citation-guard/src/selftest.ts') }
if (Test-Path packages/ask/src/__selftest.ts) { Check 'ask 模块自测' 'npx' @('tsx', 'packages/ask/src/__selftest.ts') }

Write-Host '8. Web 构建'
if (Test-Path apps/web/package.json) { Check 'next build' 'npm' @('run', 'web:build') } else { $skip++ }

Write-Host "总览: 通过 $pass  失败 $fail  跳过 $skip"
if ($failedItems.Count -gt 0) { Write-Host "失败项: $($failedItems -join ', ')" }
if ($fail -gt 0) { exit 1 }
Write-Host 'MVP 验收通过'
