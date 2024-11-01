#!/bin/bash

# 输出颜色配置
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}开始部署网络文件柜程序...${NC}"

# 创建临时目录
TEMP_DIR=$(mktemp -d)
cd $TEMP_DIR

# 下载程序包
echo "下载程序包..."
git clone https://github.com/clover-eric/cm-file-cabinet.git
cd cm-file-cabinet

# 构建并启动 Docker 容器
echo "启动 Docker 容器..."
docker-compose up -d

# 清理临时文件
cd ..
rm -rf $TEMP_DIR

echo -e "${GREEN}部署完成！${NC}"
echo "访问 http://localhost:3301 使用系统"