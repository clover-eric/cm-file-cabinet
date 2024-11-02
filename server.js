const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3302;

// 修改 CORS 配置
app.use(cors({
  origin: [
    'http://localhost:3301',
    'http://192.168.1.5:3301'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 添加预检请求处理
app.options('*', cors());

app.use(bodyParser.json());

// 存储路径配置
const STORAGE_PATH = path.join(__dirname, 'storage');
const USER_FILE = path.join(STORAGE_PATH, 'users.json');
const API_KEY_FILE = path.join(STORAGE_PATH, 'api_key.json');
const UPLOAD_PATH = path.join(STORAGE_PATH, 'uploads');

// 修改文件上传配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_PATH);
  },
  filename: function (req, file, cb) {
    // 根据文件类型设置标准化的文件名
    const standardizedName = file.originalname.toLowerCase().endsWith('.csv') ? 'cfip.csv' : 'cfip.txt';
    
    // 先删除可能存在的旧文件
    fs.readdir(UPLOAD_PATH)
      .then(files => {
        const deletePromises = files.map(file => 
          fs.unlink(path.join(UPLOAD_PATH, file))
        );
        return Promise.all(deletePromises);
      })
      .then(() => {
        cb(null, standardizedName);
      })
      .catch(err => {
        console.error('处理旧文件失败:', err);
        cb(null, standardizedName);
      });
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // 只允许上传 CSV 和 TXT 文件
    const allowedTypes = ['text/csv', 'text/plain'];
    const allowedExtensions = ['.csv', '.txt'];
    
    // 检查文件类型和扩展名
    const isValidMimeType = allowedTypes.includes(file.mimetype);
    const isValidExtension = allowedExtensions.some(ext => 
      file.originalname.toLowerCase().endsWith(ext)
    );

    if (isValidMimeType && isValidExtension) {
      cb(null, true);
    } else {
      cb(new Error('只支持 CSV 或 TXT 文件'));
    }
  }
});

// 确保存储目录存在
async function ensureStorageExists() {
  try {
    await fs.access(STORAGE_PATH);
    await fs.access(UPLOAD_PATH);
  } catch {
    await fs.mkdir(STORAGE_PATH, { recursive: true });
    await fs.mkdir(UPLOAD_PATH, { recursive: true });
  }
}

// 验证 API 密钥的中间件
async function validateApiKey(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '未提供 API 密钥' });
  }

  const apiKey = authHeader.split(' ')[1];
  try {
    const data = await fs.readFile(API_KEY_FILE, 'utf8');
    const { key } = JSON.parse(data);
    if (apiKey !== key) {
      return res.status(401).json({ message: '无效的 API 密钥' });
    }
    next();
  } catch (error) {
    res.status(401).json({ message: '验证 API 密钥失败' });
  }
}

// 生成新的 API 密钥
app.post('/generate-api-key', async (req, res) => {
  try {
    const apiKey = crypto.randomBytes(32).toString('hex');
    await fs.writeFile(API_KEY_FILE, JSON.stringify({ key: apiKey }));
    res.json({ apiKey });
  } catch (error) {
    console.error('生成 API 密钥失败:', error);
    res.status(500).json({ message: '生成 API 密钥失败' });
  }
});

// 文件上传处理
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '未收到文件' });
    }

    // 清理旧文件
    const files = await fs.readdir(UPLOAD_PATH);
    for (const file of files) {
      if (file !== req.file.filename) {
        await fs.unlink(path.join(UPLOAD_PATH, file));
      }
    }

    res.json({ 
      success: true,
      file: {
        name: req.file.originalname,
        size: req.file.size,
        uploadTime: Date.now()
      }
    });
  } catch (error) {
    console.error('上传文件失败:', error);
    res.status(500).json({ message: '上传文件失败' });
  }
});

// 修改文件信息路由
app.get('/file-info', authenticateToken, async (req, res) => {
  try {
    const files = await fs.readdir(UPLOAD_PATH);
    if (files.length === 0) {
      return res.json(null);
    }

    const file = files[0];
    const stats = await fs.stat(path.join(UPLOAD_PATH, file));
    
    // 获取完整的服务器URL
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    // 不再返回时间戳文件名，而是返回标准化的文件名
    const standardizedName = file.toLowerCase().endsWith('.csv') ? 'cfip.csv' : 'cfip.txt';
    
    res.json({
      name: standardizedName,
      size: stats.size,
      uploadTime: stats.mtime,
      previewUrl: `${baseUrl}/files/${standardizedName}`
    });
  } catch (error) {
    console.error('获取文件信息失败:', error);
    res.status(500).json({ 
      message: '获取文件信息失败',
      error: error.message
    });
  }
});

// 修改文件预览路由
app.get('/files/:filename', async (req, res) => {
  try {
    // 只允许访问 cfip.csv 或 cfip.txt
    const allowedFiles = ['cfip.csv', 'cfip.txt'];
    const requestedFile = req.params.filename;
    
    if (!allowedFiles.includes(requestedFile)) {
      return res.status(404).json({ message: '文件不存在' });
    }

    // 获取文件夹中的所有文件
    const files = await fs.readdir(UPLOAD_PATH);
    if (files.length === 0) {
      return res.status(404).json({ message: '文件不存在' });
    }

    // 获取实际文件路径（使用文件夹中的第一个文件）
    const actualFilePath = path.join(UPLOAD_PATH, files[0]);
    
    try {
      await fs.access(actualFilePath);
    } catch (error) {
      return res.status(404).json({ message: '文件不存在' });
    }

    // 读取文件内容
    const content = await fs.readFile(actualFilePath, 'utf8');
    
    // 返回 HTML 页面
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>文件预览</title>
          <style>
            body {
              font-family: monospace;
              padding: 20px;
              white-space: pre-wrap;
              word-wrap: break-word;
              max-width: 100%;
              margin: 0 auto;
              background: #f5f5f5;
            }
            pre {
              background: white;
              padding: 15px;
              border-radius: 5px;
              border: 1px solid #ddd;
              overflow-x: auto;
            }
          </style>
        </head>
        <body>
          <pre>${content}</pre>
        </body>
      </html>
    `;
    
    // 设置响应头为 HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'unsafe-inline'");
    
    // 发送 HTML 内容
    res.send(html);
    
  } catch (error) {
    console.error('获取文件失败:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: '获取文件失败' });
    }
  }
});

// 删除文件
app.delete('/file', async (req, res) => {
  try {
    const files = await fs.readdir(UPLOAD_PATH);
    for (const file of files) {
      await fs.unlink(path.join(UPLOAD_PATH, file));
    }
    res.json({ success: true });
  } catch (error) {
    console.error('删除败:', error);
    res.status(500).json({ message: '删除文件失败' });
  }
});

// 用户认证中间件
async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const data = await fs.readFile(USER_FILE, 'utf8');
    const users = JSON.parse(data);
    const user = users.find(u => u.token === token);
    
    if (!user) {
      return res.status(401).json({ message: '无效的认证令牌' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('认证失败:', error);
    res.status(401).json({ message: '认证失败' });
  }
}

// 检查是否有注册用户
app.get('/check-user', async (req, res) => {
  try {
    await fs.access(USER_FILE);
    const data = await fs.readFile(USER_FILE, 'utf8');
    const users = JSON.parse(data);
    res.json({ hasUser: users.length > 0 });
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(USER_FILE, '[]');
      res.json({ hasUser: false });
    } else {
      console.error('检查用户失败:', error);
      res.status(500).json({ message: '检查用户失败' });
    }
  }
});

// 用户注册
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    const data = await fs.readFile(USER_FILE, 'utf8');
    const users = JSON.parse(data);
    
    if (users.length > 0) {
      return res.status(409).json({ message: '已存在注册用户' });
    }
    
    const token = crypto.randomBytes(32).toString('hex');
    users.push({ username, password, token });
    await fs.writeFile(USER_FILE, JSON.stringify(users));
    
    res.json({ token });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ message: '注册失败' });
  }
});

// 用户登录
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const data = await fs.readFile(USER_FILE, 'utf8');
    const users = JSON.parse(data);
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    
    const token = crypto.randomBytes(32).toString('hex');
    user.token = token;
    await fs.writeFile(USER_FILE, JSON.stringify(users));
    
    res.json({ token });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ message: '登录失败' });
  }
});

// 重置系统路由 - 放在最前面
app.post('/reset-system', authenticateToken, async (req, res) => {
  try {
    // 1. 删除所有上传的文件
    if (await fs.access(UPLOAD_PATH).then(() => true).catch(() => false)) {
      const files = await fs.readdir(UPLOAD_PATH);
      for (const file of files) {
        await fs.unlink(path.join(UPLOAD_PATH, file));
      }
    }

    // 2. 重置用户数据
    await fs.writeFile(USER_FILE, '[]');

    // 3. 重新创建必要的目录
    await fs.mkdir(UPLOAD_PATH, { recursive: true });

    // 4. 清除其他状态文件（如果有的话）
    const stateFiles = [
      path.join(STORAGE_PATH, 'api_keys.json'),
      path.join(STORAGE_PATH, 'file_info.json')
    ];

    for (const file of stateFiles) {
      if (await fs.access(file).then(() => true).catch(() => false)) {
        await fs.unlink(file);
      }
    }

    // 5. 确保存储目录存在
    await ensureStorageExists();

    res.json({ 
      success: true, 
      message: '系统已重置' 
    });
  } catch (error) {
    console.error('重置系统失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '重置系统失败：' + error.message 
    });
  }
});

// 其他路由和中间件
app.use('/file-info', authenticateToken);
app.use('/upload', authenticateToken);
app.use('/file', authenticateToken);
app.use('/generate-api-key', authenticateToken);

// 启动服务器时添加错误处理
async function start() {
  try {
    await ensureStorageExists();
    app.listen(port, () => {
      console.log(`服务器运行在 http://localhost:${port}`);
      console.log('允许的来源:', ['http://localhost:3301', 'http://192.168.1.5:3301']);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

start().catch(console.error); 