#!/bin/bash

# 输出颜色配置
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}启动后端服务器...${NC}"

# 查找并关闭占用 3302 端口的进程
PORT=3302
PID=$(lsof -t -i:$PORT)
if [ ! -z "$PID" ]; then
    echo -e "${RED}端口 $PORT 被占用，正在关闭旧进程...${NC}"
    kill -9 $PID
    sleep 1
fi

# 启动服务器
node server.js 