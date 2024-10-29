from flask import Flask, request, redirect, url_for, render_template, send_from_directory, jsonify
import os
from werkzeug.utils import secure_filename
import hashlib
import time
import logging
from logging.handlers import RotatingFileHandler
from functools import lru_cache
import secrets
import json
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__, static_url_path='/static')
app.config.update(
    UPLOAD_FOLDER='uploads',
    HOST='0.0.0.0',  # 允许外部访问
    PORT=5001,  # 修改端口为5001
    MAX_CONTENT_LENGTH=16 * 1024 * 1024,  # 16MB 限制
    SEND_FILE_MAX_AGE_DEFAULT=0,  # 禁用缓存
    # 添加 CORS 支持
    CORS_HEADERS='Content-Type',
    API_KEYS_FILE='api_keys.json',  # 存储API密钥的文件
)
app.config['SECRET_KEY'] = secrets.token_hex(16)  # 添加密钥用于session加密

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# 用户模型
class User(UserMixin):
    def __init__(self, username):
        self.username = username
        
    def get_id(self):
        return self.username

@login_manager.user_loader
def load_user(username):
    if username in load_users():
        return User(username)
    return None

def load_users():
    """加载用户信息"""
    try:
        with open('users.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def save_users(users):
    """保存用户信息"""
    with open('users.json', 'w') as f:
        json.dump(users, f, indent=4)

# 登录路由
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        users = load_users()
        
        if username in users and check_password_hash(users[username]['password'], password):
            user = User(username)
            login_user(user)
            return redirect(url_for('index'))
        
        return render_template('login.html', error='用户名或密码错误')
    
    return render_template('login.html')

# 注册路由(仅允许第一个用户注册)
@app.route('/register', methods=['GET', 'POST'])
def register():
    users = load_users()
    if users:  # 如果已经有用户了,禁止注册
        return redirect(url_for('login'))
        
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if username and password:
            users[username] = {
                'password': generate_password_hash(password),
                'created_at': time.time()
            }
            save_users(users)
            return redirect(url_for('login'))
            
    return render_template('register.html')

# 登出路由
@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

# 修改现有的路由,添加登录要求
@app.route('/')
@login_required
def index():
    return render_template('index.html')

# 确保上传目录存在并设置正确的权限
upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), app.config['UPLOAD_FOLDER'])
os.makedirs(upload_dir, exist_ok=True)
os.chmod(upload_dir, 0o755)  # 设置目录权限

# 修改文件访问路由
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    try:
        return send_from_directory(
            upload_dir,  # 使用正确定义的 upload_dir
            filename,
            as_attachment=False,
            mimetype='text/plain'
        )
    except Exception as e:
        app.logger.error(f"Error serving file {filename}: {e}")
        return jsonify({
            'status': 'error',
            'message': '文件访问失败'
        }), 404

# 允许的文件类型
ALLOWED_EXTENSIONS = {'csv', 'txt'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 添加全局错误处理
@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({
        'status': 'error',
        'message': '文件太大，请选择较小的文件'
    }), 413

@app.errorhandler(500)
def internal_server_error(error):
    return jsonify({
        'status': 'error',
        'message': '服务器内部错误，请稍后重试'
    }), 500

# 配置日志
if not app.debug:
    if not os.path.exists('logs'):
        os.mkdir('logs')
    file_handler = RotatingFileHandler('logs/file_storage.log', maxBytes=10240,
                                     backupCount=10)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('文件存储服务启动')

def generate_api_key():
    """生成新的API密钥"""
    return secrets.token_urlsafe(32)

def load_api_keys():
    """加载API密钥"""
    try:
        with open(app.config['API_KEYS_FILE'], 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def save_api_key(api_key):
    """保存API密钥"""
    try:
        api_keys = load_api_keys()
        api_keys[api_key] = {
            'created_at': time.time(),
            'last_used': None
        }
        
        # 确保目录存在
        os.makedirs(os.path.dirname(app.config['API_KEYS_FILE']), exist_ok=True)
        
        # 保存到文件
        with open(app.config['API_KEYS_FILE'], 'w') as f:
            json.dump(api_keys, f, indent=4)
            
    except Exception as e:
        app.logger.error(f"Error saving API key: {e}")
        raise

@app.route('/generate-api-key', methods=['POST'])
def generate_api_key_route():
    try:
        # 生成新的 API 密钥
        api_key = generate_api_key()
        
        # 加载现有的 API 密钥
        try:
            with open(app.config['API_KEYS_FILE'], 'r') as f:
                api_keys = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            api_keys = {}
        
        # 添加新的 API 密钥
        api_keys[api_key] = {
            'created_at': time.time(),
            'last_used': None
        }
        
        # 保存 API 密钥到文件
        with open(app.config['API_KEYS_FILE'], 'w') as f:
            json.dump(api_keys, f)
        
        return jsonify({
            'status': 'success',
            'api_key': api_key
        })
    except Exception as e:
        app.logger.error(f"Error generating API key: {e}")
        return jsonify({
            'status': 'error',
            'message': '生成 API 密钥失败，请重试'
        }), 500

# 修改上传路由，添加API密钥验证
@app.route('/upload', methods=['POST'])
@login_required
def upload_file():
    # 检查API密钥（如果存在）
    api_key = request.headers.get('X-API-Key')
    if api_key:
        api_keys = load_api_keys()
        if api_key not in api_keys:
            return jsonify({
                'status': 'error',
                'message': 'Invalid API key'
            }), 401
        # 更新最后使用时间
        api_keys[api_key]['last_used'] = time.time()
        with open(app.config['API_KEYS_FILE'], 'w') as f:
            json.dump(api_keys, f)

    if 'file' not in request.files:
        return jsonify({
            'status': 'error', 
            'message': '未检测到上传文件'
        }), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({
            'status': 'error', 
            'message': '未选择文件'
        }), 400

    # 检查文件类型
    if not allowed_file(file.filename):
        return jsonify({
            'status': 'error', 
            'message': '只支持 CSV 或 TXT 格式的文件'
        }), 400

    # 根据文件扩展名自动重命名为 cfip.csv 或 cfip.txt
    file_extension = file.filename.rsplit('.', 1)[1].lower()
    new_filename = f"cfip.{file_extension}"

    # 检查是否已存在文件，如果存在则清空文件柜
    existing_files = os.listdir(app.config['UPLOAD_FOLDER'])
    if existing_files:
        for existing_file in existing_files:
            try:
                os.remove(os.path.join(app.config['UPLOAD_FOLDER'], existing_file))
            except Exception as e:
                app.logger.error(f"Error removing file {existing_file}: {e}")

    if file:
        try:
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], new_filename))
            return jsonify({
                'status': 'success', 
                'filename': new_filename,
                'originalname': file.filename,
                'replaced': len(existing_files) > 0
            }), 200
        except Exception as e:
            app.logger.error(f"Error saving file: {e}")
            return jsonify({
                'status': 'error',
                'message': '文件保存失败，请重试'
            }), 500

@app.route('/clear-files', methods=['POST'])
def clear_files():
    try:
        # 清空上传目录中的所有文件
        for filename in os.listdir(app.config['UPLOAD_FOLDER']):
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            try:
                if os.path.isfile(file_path):
                    os.remove(file_path)
            except Exception as e:
                print(f"Error removing file {filename}: {e}")
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@lru_cache(maxsize=128)
def get_file_list():
    """缓存文件列表查询结果"""
    return os.listdir(app.config['UPLOAD_FOLDER'])

if __name__ == '__main__':
    # 使用 threaded=True 支持并发请求
    app.run(
        host=app.config['HOST'],
        port=app.config['PORT'],  # 使用新的端口
        debug=True,
        threaded=True
    )
