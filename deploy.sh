#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}开始部署 CM-File-Cabinet...${NC}"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${BLUE}正在安装 Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    sudo systemctl start docker
    sudo systemctl enable docker
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo -e "${BLUE}正在安装 Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.12.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# 创建必要的目录和文件
echo -e "${BLUE}创建必要的目录和文件...${NC}"
mkdir -p uploads logs
touch api_keys.json
chmod 755 uploads logs

# 构建和启动容器
echo -e "${BLUE}构建和启动容器...${NC}"
docker-compose up -d --build

# 检查部署状态
if [ $? -eq 0 ]; then
    echo -e "${GREEN}部署成功！${NC}"
    echo -e "${GREEN}服务已在 http://localhost:5001 启动${NC}"
    echo -e "${GREEN}如需停止服务，请运行: docker-compose down${NC}"
else
    echo -e "\033[0;31m部署失败，请检查错误信息${NC}"
fi 