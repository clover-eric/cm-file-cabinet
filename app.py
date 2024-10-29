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

app = Flask(__name__, static_url_path='/static')

# 修改配置，增加安全和访问控制设置
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

# 确保上传目录存在并设置正确的权限
upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), app.config['UPLOAD_FOLDER'])
os.makedirs(upload_dir, exist_ok=True)
os.chmod(upload_dir, 0o755)  # 设置目录权限

# 添加 CORS 支持
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response

# 修改文件访问路由
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    try:
        return send_from_directory(
            upload_dir, 
            filename,
            as_attachment=False,  # 在浏览器中直接显示
            mimetype='text/plain'  # 指定 MIME 类型
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

@app.route('/')
def index():
    return render_template('index.html')

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

# 定期清理过期文件
def cleanup_old_files():
    """清理超过24小时的文件"""
    current_time = time.time()
    for filename in os.listdir(app.config['UPLOAD_FOLDER']):
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if os.path.isfile(file_path):
            file_age = current_time - os.path.getmtime(file_path)
            if file_age > 24 * 60 * 60:  # 24小时
                try:
                    os.remove(file_path)
                    app.logger.info(f'Removed old file: {filename}')
                except Exception as e:
                    app.logger.error(f'Error removing old file {filename}: {e}')

if __name__ == '__main__':
    # 使用 threaded=True 支持并发请求
    app.run(
        host=app.config['HOST'],
        port=app.config['PORT'],  # 使用新的端口
        debug=True,
        threaded=True
    )
