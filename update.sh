#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# 设置仓库信息和镜像源
REPO="clover-eric/cm-file-cabinet"
BRANCH="main"
MIRROR_URL="https://gitee.com/${REPO}/raw/${BRANCH}"
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

# 备份函数
backup_files() {
    echo -e "${BLUE}备份当前文件...${NC}"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_dir="backup_${timestamp}"
    mkdir -p "$backup_dir"
    
    # 备份重要文件
    cp -r app.py docker-compose.yml Dockerfile requirements.txt static templates "$backup_dir/" 2>/dev/null || true
    
    echo -e "${GREEN}文件已备份到 ${backup_dir}${NC}"
}

# 主更新流程
main() {
    echo -e "${BLUE}开始更新 CM-File-Cabinet...${NC}"
    
    # 检查是否在正确的目录
    if [ ! -f "docker-compose.yml" ]; then
        echo -e "${RED}错误：请在项目根目录运行此脚本${NC}"
        exit 1
    }
    
    # 备份当前文件
    backup_files
    
    # 下载更新的文件
    echo -e "${BLUE}下载更新文件...${NC}"
    FILES=(
        "app.py"
        "docker-compose.yml"
        "Dockerfile"
        "requirements.txt"
        "static/css/styles.css"
        "static/js/scripts.js"
        "templates/index.html"
    )
    
    for file in "${FILES[@]}"; do
        if ! download_file "$file" "$file"; then
            echo -e "${RED}更新失败：无法下载 ${file}${NC}"
            echo -e "${BLUE}正在恢复备份...${NC}"
            cp -r backup_*/. .
            exit 1
        fi
    done
    
    # 重新构建并启动容器
    echo -e "${BLUE}重新构建并启动服务...${NC}"
    if docker compose up -d --build; then
        echo -e "${GREEN}更新成功！${NC}"
        echo -e "${GREEN}服务已在 http://localhost:5001 重新启动${NC}"
        
        # 清理旧的备份（保留最近3个）
        echo -e "${BLUE}清理旧备份...${NC}"
        ls -dt backup_* | tail -n +4 | xargs rm -rf 2>/dev/null || true
    else
        echo -e "${RED}更新失败：容器构建失败${NC}"
        echo -e "${BLUE}正在恢复备份...${NC}"
        cp -r backup_*/. .
        docker compose up -d
        exit 1
    fi
}

# 执行更新
main 