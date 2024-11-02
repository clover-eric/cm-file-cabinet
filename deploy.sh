#!/bin/bash

# 输出颜色配置
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}开始部署网络文件柜程序...${NC}"

# 检查 Docker 和 Docker Compose
if ! command -v docker &> /dev/null; then
    echo -e "${RED}未检测到 Docker，请先安装 Docker${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}未检测到 Docker Compose，请先安装 Docker Compose${NC}"
    exit 1
fi

# 创建临时目录
TEMP_DIR=$(mktemp -d)
cd $TEMP_DIR || exit

# 创建项目目录
mkdir -p cm-file-cabinet
cd cm-file-cabinet || exit

# 创建基本目录结构
mkdir -p src/components src/api public storage/uploads

# 创建 .dockerignore
cat > .dockerignore << 'EOL'
node_modules
npm-debug.log
Dockerfile*
docker-compose*
.dockerignore
.git
.gitignore
README.md
.env
dist
EOL

# 创建 nginx.conf
echo "创建 nginx 配置文件..."
cat > nginx.conf << 'EOL'
server {
    listen 3301;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3302;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOL

# 创建 webpack.config.js
echo "创建 webpack 配置文件..."
cat > webpack.config.js << 'EOL'
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    })
  ]
};
EOL

# 创建 .babelrc
echo "创建 babel 配置文件..."
cat > .babelrc << 'EOL'
{
  "presets": [
    "@babel/preset-env",
    "@babel/preset-react"
  ]
}
EOL

# 创建 package.json
echo "创建前端基础文件..."
cat > package.json << 'EOL'
{
  "name": "cm-file-cabinet",
  "version": "1.0.0",
  "description": "网络文件柜系统",
  "main": "server.js",
  "scripts": {
    "start": "webpack serve --mode development",
    "build": "webpack --mode production --progress"
  },
  "dependencies": {
    "react": "^17.0.2",
    "react-dom": "^17.0.2",
    "axios": "^0.24.0",
    "express": "^4.17.1",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@babel/core": "^7.16.0",
    "@babel/preset-react": "^7.16.0",
    "@babel/preset-env": "^7.16.0",
    "webpack": "^5.64.0",
    "webpack-cli": "^4.9.1",
    "babel-loader": "^8.2.3",
    "html-webpack-plugin": "^5.5.0"
  }
}
EOL

# 创建 React 入口文件
echo "创建 React 入口文件..."
cat > src/index.js << 'EOL'
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
EOL

# 创建 App.js
cat > src/App.js << 'EOL'
import React from 'react';

function App() {
  return (
    <div>
      <h1>网络文件柜</h1>
    </div>
  );
}

export default App;
EOL

# 创建 HTML 模板
cat > public/index.html << 'EOL'
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>网络文件柜</title>
</head>
<body>
    <div id="root"></div>
</body>
</html>
EOL

# 创建后端服务器文件
echo "创建后端服务器文件..."
cat > server.js << 'EOL'
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3302;

app.get('/api/status', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
EOL

# 创建 Dockerfile.frontend
cat > Dockerfile.frontend << 'EOL'
# 构建阶段
FROM node:14-alpine as builder

WORKDIR /app

# 复制前端相关文件
COPY package*.json ./

# 使用 npm install 而不是 npm ci
RUN npm install && \
    npm cache clean --force

# 复制其他源文件
COPY . .

# 构建
RUN npm run build

# 运行阶段
FROM nginx:alpine

# 复制构建产物和配置
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3301

CMD ["nginx", "-g", "daemon off;"]
EOL

# 创建 Dockerfile.backend
cat > Dockerfile.backend << 'EOL'
FROM node:14-alpine

WORKDIR /app

# 复制后端相关文件
COPY package*.json ./

# 使用 npm install 而不是 npm ci
RUN npm install --production && \
    npm cache clean --force

# 复制其他文件
COPY . .

# 创建存储目录
RUN mkdir -p storage/uploads && \
    chmod -R 755 storage

EXPOSE 3302

CMD ["node", "server.js"]
EOL

# 创建 docker-compose.yml
cat > docker-compose.yml << 'EOL'
version: '3.8'
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3301:3301"
    environment:
      - REACT_APP_API_URL=http://localhost:3302
    depends_on:
      - backend
    networks:
      - file-cabinet-network

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3302:3302"
    volumes:
      - storage-data:/app/storage
    environment:
      - NODE_ENV=production
      - PORT=3302
      - STORAGE_PATH=/app/storage
    networks:
      - file-cabinet-network

networks:
  file-cabinet-network:
    driver: bridge

volumes:
  storage-data:
    driver: local
EOL

# 设置文件权限
echo "设置文件权限..."
chmod -R 755 .

# 停止并删除旧容器和卷
echo "清理旧容器和卷..."
docker-compose down -v

# 构建并启动 Docker 容器
echo "构建和启动 Docker 容器..."
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker-compose build --parallel
docker-compose up -d

# 等待服务启动
echo "等待服务启动..."
sleep 15

# 检查服务状态
echo "检查服务状态..."
if curl -s http://localhost:3301 > /dev/null; then
    echo -e "${GREEN}前端服务启动成功${NC}"
else
    echo -e "${RED}前端服务启动失败${NC}"
    docker-compose logs frontend
fi

if curl -s http://localhost:3302/api/status > /dev/null; then
    echo -e "${GREEN}后端服务启动成功${NC}"
else
    echo -e "${RED}后端服务启动失败${NC}"
    docker-compose logs backend
fi

# 清理临时文件
cd ../..
rm -rf "$TEMP_DIR"

echo -e "${GREEN}部署完成！${NC}"
echo "访问 http://localhost:3301 使用系统"