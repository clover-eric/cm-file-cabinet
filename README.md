# 网络文件柜程序

一个基于 Node.js 和 React 的网络文件柜系统，支持文件上传、管理和 API 访问。

## 功能特点

- 用户认证系统（管理员账户）
- 文件上传和管理
- API 密钥生成和验证
- 支持 CSV 和 TXT 文件格式
- Docker 容器化部署
- 数据持久化存储

## 系统要求

### 直接安装
- Node.js >= 14.0.0
- npm >= 6.0.0

### Docker 部署
- Docker >= 20.10.0
- Docker Compose >= 2.0.0

## 快速开始

### 方式一：一键部署（推荐）

使用 curl：

bash

curl -fsSL https://raw.githubusercontent.com/clover-eric/cm-file-cabinet/main/deploy.sh | bash

或使用 wget：

bash

wget -qO- https://raw.githubusercontent.com/clover-eric/cm-file-cabinet/main/deploy.sh | bash

\### 方式二：手动 Docker 部署

1. 克隆仓库：

bash

git clone https://github.com/clover-eric/cm-file-cabinet.git

2. 进入项目目录：

bash

cd cm-file-cabinet

3. 启动 Docker 容器：

bash

docker-compose up -d

\### 方式三：直接安装

1. 克隆仓库并进入目录：

bash

git clone https://github.com/clover-eric/cm-file-cabinet.git

cd cm-file-cabinet

2. 运行安装脚本：

bash

chmod +x setup.sh

./setup.sh

3. 启动程序：

bash

./start.sh

\## 配置说明

\### 端口配置

\- 前端服务：3301

\- 后端服务：3302

\### 环境变量

\- `REACT_APP_API_URL`: 后端 API 地址

\- `REACT_APP_PORT`: 前端服务端口

\- `REACT_APP_STORAGE_PATH`: 文件存储路径

\## 使用说明

\### 首次使用

1. 访问 `http://localhost:3301`
2. 注册管理员账号（仅支持一个管理员账号）
3. 使用注册的账号登录系统

\### 文件管理

\- 支持上传 CSV 和 TXT 格式文件

\- 文件会被重命名为标准格式（cfip.csv 或 cfip.txt）

\- 新上传的文件会自动覆盖旧文件

\### API 访问

1. 在系统中生成 API 密钥
2. 使用 Bearer Token 方式在请求头中携带 API 密钥
3. API 端点说明：

  \- 文件上传：POST /upload

  \- 文件信息：GET /file-info

  \- 删除文件：DELETE /file

\## 数据存储

\- Docker 部署方式下，所有数据存储在 `storage` 目录

\- 包括用户数据、API 密钥和上传的文件

\- 数据通过 Docker volume 持久化

\## 维护命令

\### 重启服务

bash

# Docker 方式

docker-compose restart

# 直接安装方式

./restart.sh

\### 查看日志

bash

# 前端日志

tail -f frontend.log

# 后端日志

tail -f server.log

\### 重置系统

通过 API 调用 `/reset-system` 端点（需要管理员认证）

\## 安全说明

\- 所有 API 访问需要认证

\- 支持 CORS 安全配置

\- 文件上传限制类型和大小

\- 用户密码和令牌安全存储

\## 故障排除

1. 端口冲突

  \- 确保端口 3301 和 3302 未被占用

  \- 可以通过环境变量修改端口配置

2. 权限问题

  \- 确保 storage 目录具有正确的读写权限

  \- Docker 部署时确保 volume 映射正确

3. 网络问题

  \- 检查防火墙配置

  \- 确保 Docker 网络正常

\## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

\## 许可证

ISC License

\## 联系方式

项目维护者：clover-eric

GitHub：https://github.com/clover-eric/cm-file-cabinet