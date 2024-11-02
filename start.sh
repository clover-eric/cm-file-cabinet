#!/bin/bash

# 输出颜色配置
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}启动网络文件柜程序...${NC}"

# 检查是否在正确的目录
if [ ! -d "node_modules" ]; then
    echo "请先运行 setup.sh 安装程序"
    exit 1
fi

# 启动开发服务器
npm start 