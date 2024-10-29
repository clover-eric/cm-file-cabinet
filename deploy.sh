#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}开始部署 CM-File-Cabinet...${NC}"

# 创建项目目录并进入
mkdir -p cm-file-cabinet
cd cm-file-cabinet

# 下载必要的文件
echo -e "${BLUE}下载必要的文件...${NC}"
curl -O https://raw.githubusercontent.com/clover-eric/cm-file-cabinet/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/clover-eric/cm-file-cabinet/main/Dockerfile

# 创建必要的目录和文件
echo -e "${BLUE}创建必要的目录和文件...${NC}"
mkdir -p uploads logs
touch api_keys.json
chmod 755 uploads logs

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${BLUE}安装 Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    sudo systemctl start docker
    sudo systemctl enable docker
    # 添加当前用户到 docker 组
    sudo usermod -aG docker $USER
    newgrp docker
fi

# 构建和启动容器
echo -e "${BLUE}构建和启动容器...${NC}"
docker compose up -d --build

# 检查部署状态
if [ $? -eq 0 ]; then
    echo -e "${GREEN}部署成功！${NC}"
    echo -e "${GREEN}服务已在 http://localhost:5001 启动${NC}"
    echo -e "${GREEN}如需停止服务，请运行: docker compose down${NC}"
else
    echo -e "\033[0;31m部署失败，请检查错误信息${NC}"
fi 