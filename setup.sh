#!/bin/bash

# 输出颜色配置
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}开始安装网络文件柜程序...${NC}"

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo -e "${RED}未检测到 Node.js，请先安装 Node.js${NC}"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo -e "${RED}未检测到 npm，请先安装 npm${NC}"
    exit 1
fi

# 初始化项目
echo "初始化项目..."
npm init -y

# 安装依赖
echo "安装必要依赖..."
npm install react react-dom react-router-dom axios @mui/material @emotion/react @emotion/styled

# 安装开发依赖
echo "安装开发依赖..."
npm install --save-dev @babel/core @babel/preset-react @babel/preset-env
npm install --save-dev webpack webpack-cli webpack-dev-server babel-loader
npm install --save-dev css-loader style-loader file-loader
npm install --save-dev dotenv-webpack html-webpack-plugin
npm install --save-dev @babel/plugin-transform-runtime

# 创建必要的目录（如果不存在）
echo "检查项目目录结构..."
mkdir -p src/components src/context src/api public storage

# 创建 api.js 文件
echo "创建 API 配置文件..."
cat > src/api/api.js << EOL
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = \`Bearer \${token}\`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
EOL

# 创建环境配置文件
echo "创建环境配置文件..."
cat > .env << EOL
REACT_APP_API_URL=http://localhost:3000
REACT_APP_STORAGE_PATH=./storage
EOL

# 创建 webpack 配置
echo "创建 webpack 配置..."
cat > webpack.config.js << EOL
const path = require('path');
const Dotenv = require('dotenv-webpack');
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
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  devServer: {
    historyApiFallback: true,
    port: 3000,
    hot: true,
    open: true
  },
  plugins: [
    new Dotenv(),
    new HtmlWebpackPlugin({
      template: './public/index.html'
    })
  ]
};
EOL

# 创建 babel 配置
echo "创建 babel 配置..."
cat > .babelrc << EOL
{
  "presets": ["@babel/preset-react", "@babel/preset-env"],
  "plugins": ["@babel/plugin-transform-runtime"]
}
EOL

# 更新 package.json 的脚本
npm pkg set scripts.start="webpack serve --mode development --open"
npm pkg set scripts.build="webpack --mode production"

# 设置文件权限
echo "设置文件权限..."
chmod -R 755 .
chmod 644 .env

echo -e "${GREEN}安装完成！${NC}"
echo "您可以通过以下命令启动项目："
echo "npm start"