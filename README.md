# 紫微BOT（ziwei-bot）

> 输入生辰 → 确定性排盘 → 12 宫命盘与 13 维解读 → 命盘本地存档、基于命盘的多轮追问。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![数据集: CC BY 4.0](https://img.shields.io/badge/%E6%95%B0%E6%8D%AE%E9%9B%86-CC%20BY%204.0-blue.svg)](https://github.com/Renhuai123/ziwei-doushu)

**不是「再训一个紫微大模型」项目。** 排盘是确定性计算由程序做，
解读正文来自大规模预生成的数据集按需检索，模型只负责可选的追问环节。

> 本工具仅供文化兴趣与学习之用，不构成任何医疗、法律、投资或人生决策建议。

## 部署
---
git clone https://github.com/mojianpo/ziweibot && cd ziweibot

# ① 装依赖
npm install  或者  pnpm install

# ② 拉解读数据（在上游 release，CC BY 4.0；压缩包单年约 2MB）
#    这里只取 3 年做演示；全部 77 年见下方「全年覆盖」
scripts/download_data.sh --years 1990,2000,2020 --decompress 1990,2000,2020

# ③ 建索引（字节偏移索引，几秒）
npm run index:build -- --years 1990,2000,2020

```
## 全部数据

for y in $(seq 1950 2026); do scripts/download_data.sh --years $y --decompress $y; done
npm run index:build            # 建全量索引，约 3.5 分钟
npm run data:compact -- --all  # 压成 compact 形态：1.5GB（替代 53GB raw）
# 压完之后 data/raw 可以删掉 —— 查询优先走 compact，缺了才回退 raw
```
# ④ 起服务
npm run web:dev        # http://localhost:3000
---

## API接口

### 创建账号接口

curl -X POST "http://localhost:3000/ziweibot/api/account/create" -H "API_KEY: ***"

### 验证账号接口

curl -X POST 'http://localhost:3000/ziweibot/api/account/verify' \
-H 'API_KEY: ***' \
-H 'Content-Type: application/json' \
-d '{"key":"mojianpo"}'

返回 {"valid":true} 表示账号 KEY 当前可以登录
 
