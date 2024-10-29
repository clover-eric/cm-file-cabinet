#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# 设置 GitHub 仓库信息和镜像源
REPO="clover-eric/cm-file-cabinet"
BRANCH="main"
# 使用 Gitee 镜像
MIRROR_URL="https://gitee.com/your-gitee-username/cm-file-cabinet/raw/${BRANCH}"
RAW_URL="https://raw.githubusercontent.com/${REPO}/${BRANCH}"

# 下载文件函数，带镜像源支持
download_file() {
    local filename="$1"
    local output="$2"
    local max_retries=3
    local retry=0
    
    # 优先尝试镜像源
    echo -e "${BLUE}从镜像源下载 ${filename}...${NC}"
    if curl -fsSL --connect-timeout 5 "${MIRROR_URL}/${filename}" -o "$output"; then
        return 0
    fi
    
    # 镜像源失败后尝试 GitHub
    echo -e "${BLUE}从 GitHub 下载 ${filename}...${NC}"
    while [ $retry -lt $max_retries ]; do
        if curl -fsSL --connect-timeout 5 "${RAW_URL}/${filename}" -o "$output"; then
            return 0
        fi
        retry=$((retry+1))
        [ $retry -lt $max_retries ] && sleep 3
    done
    
    echo -e "${RED}下载 ${filename} 失败${NC}"
    return 1
}

echo -e "${BLUE}开始部署 CM-File-Cabinet...${NC}"

# 创建项目目录并进入
mkdir -p cm-file-cabinet
cd cm-file-cabinet || exit 1

# 下载必要的文件
echo -e "${BLUE}下载必要的文件...${NC}"
FILES=("docker-compose.yml" "Dockerfile" "requirements.txt" "app.py")
for file in "${FILES[@]}"; do
    if ! download_file "$file" "$file"; then
        echo -e "${RED}部署失败：无法下载必要文件${NC}"
        exit 1
    fi
done

# 创建目录结构
echo -e "${BLUE}创建目录结构...${NC}"
mkdir -p static/{css,js} templates uploads logs
touch api_keys.json

# 下载静态文件和模板
STATIC_FILES=(
    "static/css/styles.css"
    "static/js/scripts.js"
    "templates/index.html"
)

for file in "${STATIC_FILES[@]}"; do
    if ! download_file "$file" "$file"; then
        echo -e "${RED}警告：无法下载 ${file}，将使用空文件${NC}"
        touch "$file"
    fi
done

# 设置权限
chmod 755 uploads logs

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${BLUE}安装 Docker...${NC}"
    # 使用国内源安装 Docker
    curl -fsSL https://get.docker.com | sh -s docker --mirror Aliyun
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    newgrp docker
fi

# 检查 Docker 服务状态
echo -e "${BLUE}检查 Docker 服务...${NC}"
if ! sudo systemctl is-active --quiet docker; then
    echo -e "${BLUE}启动 Docker 服务...${NC}"
    sudo systemctl start docker
fi

# 构建和启动容器
echo -e "${BLUE}构建和启动容器...${NC}"
if docker compose up -d --build; then
    echo -e "${GREEN}部署成功！${NC}"
    echo -e "${GREEN}服务已在 http://localhost:5001 启动${NC}"
    echo -e "${GREEN}如需停止服务，请运行: docker compose down${NC}"
else
    echo -e "${RED}部署失败，请检查错误信息${NC}"
    exit 1
fi 