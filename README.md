# 紫微BOT（ziwei-assistant）

> 输入生辰 → 确定性排盘 → 12 宫命盘与 13 维解读 → 命盘本地存档、基于命盘的多轮追问。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![数据集: CC BY 4.0](https://img.shields.io/badge/%E6%95%B0%E6%8D%AE%E9%9B%86-CC%20BY%204.0-blue.svg)](https://github.com/Renhuai123/ziwei-doushu)

**不是「再训一个紫微大模型」项目。** 排盘是确定性计算由程序做，
解读正文来自大规模预生成的数据集按需检索，模型只负责可选的追问环节。

> 本工具仅供文化兴趣与学习之用，不构成任何医疗、法律、投资或人生决策建议。

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
 
