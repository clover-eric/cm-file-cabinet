#!/bin/bash

# 输出颜色配置
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}开始部署网络文件柜程序...${NC}"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}未检测到 Docker，请先安装 Docker${NC}"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}未检测到 Docker Compose，请先安装 Docker Compose${NC}"
    exit 1
fi

# 停止并删除旧容器
echo "清理旧容器..."
docker-compose down

# 构建新镜像
echo "构建 Docker 镜像..."
docker-compose build

# 启动容器
echo "启动容器..."
docker-compose up -d

# 等待服务启动
echo "等待服务启动..."
sleep 10

# 检查服务状态
echo "检查服务状态..."
if curl -s http://localhost:3301 > /dev/null; then
    echo -e "${GREEN}前端服务启动成功${NC}"
else
    echo -e "${RED}前端服务启动失败${NC}"
fi

if curl -s http://localhost:3302 > /dev/null; then
    echo -e "${GREEN}后端服务启动成功${NC}"
else
    echo -e "${RED}后端服务启动失败${NC}"
fi

echo -e "${GREEN}部署完成！${NC}"
echo "访问 http://localhost:3301 使用系统" 