# CM-File-Cabinet 文件柜

一个简单高效的文件中转服务，专为 CM-EdgeTunnel 设计。

## 功能特点

- 🚀 支持拖拽上传文件
- 📁 自动重命名为标准格式
- 🔑 API 密钥认证
- 🔄 自动清理过期文件
- 📱 响应式设计，支持移动端
- 🌐 支持跨域访问
- 🔒 安全的文件存储

## 快速开始

### 一键部署 

```bash
curl -fsSL https://raw.githubusercontent.com/your-repo/cm-file-cabinet/main/deploy.sh | bash
``` 

部署完成后，访问 `http://your-server-ip:5001` 即可使用。

### 手动部署

1. 克隆仓库

```bash
git clone https://github.com/your-repo/cm-file-cabinet.git
```

2. 使用 Docker Compose 部署

```bash
docker-compose up -d
```


## 使用说明

### Web 界面使用

1. 打开浏览器访问 `http://your-server-ip:5001`
2. 拖拽文件到上传区域或点击选择文件
3. 等待上传完成，获取文件链接

### API 使用

1. 在 Web 界面生成 API 密钥
2. 使用提供的 Python 代码示例进行文件上传：

python
import requests
def upload_file(file_path, api_key):
"""
上传文件到文件柜
:param file_path: 本地文件路径
:param api_key: API密钥
"""
url = 'http://your-server-ip:5001/upload'
headers = {'X-API-Key': api_key}
with open(file_path, 'rb') as f:
files = {'file': f}
response = requests.post(url,
files=files,
headers=headers)
return response.json()
```

## 常用命令

```bash
docker-compose up -d  # 启动服务
docker-compose down  # 停止服务
```

### 查看容器日志

```bash
docker-compose logs -f
```

### 停止服务

```bash
docker-compose down
```

### 重启服务

```bash
docker-compose restart
```

### 更新服务

```bash
docker-compose pull
docker-compose up -d
```

## 注意事项

1. 仅支持上传 CSV 或 TXT 格式的文件
2. 文件大小限制为 16MB
3. 上传新文件会自动清空文件柜
4. 文件会在 24 小时后自动清理
5. 请确保服务器的 5001 端口已开放

## 目录结构

cm-file-cabinet/
├── app.py              # 主应用程序
├── static/             # 静态资源
│   ├── css/           # 样式文件
│   └── js/            # JavaScript 文件
├── templates/          # HTML 模板
├── uploads/           # 文件上传目录
├── logs/              # 日志目录
├── api_keys.json      # API 密钥存储文件
├── Dockerfile         # Docker 配置文件
├── docker-compose.yml # Docker Compose 配置
├── requirements.txt   # Python 依赖
└── deploy.sh          # 部署脚本

## 环境要求

- Docker
- Docker Compose
- 开放 5001 端口
- 支持 Python 3.9+

## 技术栈

- 后端：Flask
- 前端：Bootstrap 5 + JavaScript
- 容器化：Docker
- 数据存储：文件系统

## 安全性

- API 密钥认证
- 文件类型限制
- 文件大小限制
- 自动文件清理
- 跨域保护

## 许可证

MIT License

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 更新日志

### v1.0.0
- 初始版本发布
- 基础文件上传功能
- API 集成支持