# CM-File-Cabinet 文件柜

一个简单高效的文件中转服务，专为 CM-EdgeTunnel 设计。

## 功能特点

- 简洁的 Web 界面
- 支持拖拽上传
- API 集成支持
- 自动文件清理
- Docker 容器化部署
- 国内镜像源支持

## 一键部署

```bash
curl -fsSL https://raw.githubusercontent.com/clover-eric/cm-file-cabinet/main/deploy.sh | bash
``` 

部署完成后，访问 `http://your-server-ip:5001` 即可使用。

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

方法一：使用更新脚本（推荐）
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/clover-eric/cm-file-cabinet/main/deploy.sh)
```

方法二：手动更新
bash
拉取最新镜像
docker compose pull
重新构建并启动
docker compose up -d --build


## 注意事项

1. 仅支持上传 CSV 或 TXT 格式的文件
2. 文件大小限制为 16MB
3. 上传新文件会自动清空文件柜
4. 请确保服务器的 5001 端口已开放

## 目录结构

cm-file-cabinet/
├── app.py # 主应用程序
├── static/ # 静态资源
│ ├── css/ # 样式文件
│ └── js/ # JavaScript 文件
├── templates/ # HTML 模板
├── uploads/ # 文件上传目录
├── logs/ # 日志目录
├── api_keys.json # API 密钥存储文件
├── Dockerfile # Docker 配置文件
├── docker-compose.yml # Docker Compose 配置
├── requirements.txt # Python 依赖
└── deploy.sh # 部署脚本
└── update.sh # 升级脚本


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

### v1.2.1
- 添加 Gitee 镜像源支持
- 优化部署脚本，支持从 Gitee 下载
- 提升国内访问速度

### v1.1.0
- 添加国内镜像源支持
- 优化文件上传界面
- 完善错误处理
- 更新部署文档

### v1.0.0
- 初始版本发布
- 基础文件上传功能
- API 集成支持
### v1.1.1
- 修复 API 密钥生成功能
- 优化错误处理机制
- 改进文件存储逻辑

### v1.2.0
- 添加用户认证功能
- 首次访问时请访问 `/register` 创建管理员账号
- 增强安全性，防止未授权访问
