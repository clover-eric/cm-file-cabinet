# 使用 Node.js 官方镜像作为基础镜像
FROM node:14

# 设置工作目录
WORKDIR /app

# 复制项目文件
COPY . .

# 设置权限
RUN chmod +x setup.sh start.sh start-server.sh restart.sh

# 安装依赖
RUN ./setup.sh

# 暴露端口
EXPOSE 3301 3302

# 启动命令
CMD ["./restart.sh"] 