#!/bin/bash

# 输出颜色配置
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}开始重启程序...${NC}"

# 1. 停止所有相关进程
echo -e "${GREEN}1. 停止现有进程...${NC}"
pkill -f "node server.js"
pkill -f "webpack"
sleep 2

# 2. 清理缓存（可选）
echo -e "${GREEN}2. 清理缓存...${NC}"
if [ -d "node_modules" ]; then
    rm -rf node_modules
    rm -f package-lock.json
fi

# 3. 重新安装依赖
echo -e "${GREEN}3. 安装依赖...${NC}"
npm install

# 4. 启动后端服务器（后台运行）
echo -e "${GREEN}4. 启动后端服务器...${NC}"
node server.js > server.log 2>&1 &
sleep 2

# 5. 启动前端开发服务器（后台运行）
echo -e "${GREEN}5. 启动前端服务器...${NC}"
npm start > frontend.log 2>&1 &

# 6. 等待服务器启动
echo -e "${BLUE}等待服务器启动...${NC}"
sleep 5

# 7. 检查服务器状态
echo -e "${GREEN}检查服务器状态：${NC}"

# 检查后端服务器
if lsof -i:3302 > /dev/null; then
    echo -e "后端服务器 (端口 3302): ${GREEN}运行中${NC}"
else
    echo -e "后端服务器 (端口 3302): ${RED}未运行${NC}"
fi

# 检查前端服务器
if lsof -i:3301 > /dev/null; then
    echo -e "前端服务器 (端口 3301): ${GREEN}运行中${NC}"
else
    echo -e "前端服务器 (端口 3301): ${RED}未运行${NC}"
fi

echo -e "${BLUE}程序重启完成！${NC}"
echo -e "前端日志: tail -f frontend.log"
echo -e "后端日志: tail -f server.log" 