document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const progressBar = document.querySelector('.progress-bar');
    const progressDiv = document.getElementById('uploadProgress');
    const uploadStatus = document.getElementById('uploadStatus');

    // 拖拽事件处理
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('drag-over');
    }

    function unhighlight(e) {
        dropZone.classList.remove('drag-over');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileInput.files = files;
        handleUpload(files[0]);
    }

    fileInput.addEventListener('change', function(e) {
        if (this.files.length) {
            handleUpload(this.files[0]);
        }
    });

    function handleUpload(file) {
        // 检查文件类型
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!['csv', 'txt'].includes(fileExtension)) {
            showAlert('danger', '只支持 CSV 或 TXT 格式的文件');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        // 显示上传进度条
        progressDiv.classList.remove('d-none');
        progressBar.style.width = '0%';
        uploadStatus.innerHTML = '';

        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', function(e) {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                progressBar.style.width = percentComplete + '%';
                progressBar.setAttribute('aria-valuenow', percentComplete);
            }
        });

        xhr.onload = function() {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                if (response.status === 'success') {
                    const message = response.replaced 
                        ? `已清空文件柜并上传新文件 "${response.filename}"` 
                        : `文件 "${response.filename}" 上传成功！`;
                    showAlert('success', message, response.filename);
                    // 上传成功后禁用上传区域
                    disableUploadArea();
                } else {
                    showAlert('danger', response.message);
                }
            } else {
                const response = JSON.parse(xhr.responseText);
                showAlert('danger', response.message || '上传失败，请重试');
            }
            progressDiv.classList.add('d-none');
        };

        xhr.onerror = function() {
            showAlert('danger', '上传出错，请检查网络连接');
            progressDiv.classList.add('d-none');
        };

        xhr.open('POST', '/upload', true);
        xhr.send(formData);
    }

    // 修改禁用上传区域的函数
    function disableUploadArea() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const uploadButton = dropZone.querySelector('button');
        const uploadText = dropZone.querySelector('h5');
        
        // 更新SVG为错误图标
        const svg = dropZone.querySelector('.upload-icon');
        svg.innerHTML = `
            <circle class="icon-circle" cx="12" cy="12" r="10" />
            <path class="icon-x" d="M15 9l-6 6M9 9l6 6" stroke-linecap="round" stroke-width="2" />
        `;
        
        // 更改按钮样式和文本
        uploadButton.classList.remove('btn-modern');
        uploadButton.classList.add('btn-modern-danger');
        uploadButton.innerHTML = `
            <span class="btn-content">
                <i class="fas fa-trash-alt me-2"></i>
                清空文件柜
            </span>
        `;
        
        // 更改提示文本，使用更详细的说明
        uploadText.textContent = '文件柜已满，如需更换文件，请点击清空文件柜';
        
        // 添加已上传状态类
        dropZone.classList.add('has-file');
        
        // 移除拖拽相关的类和事件
        dropZone.classList.add('has-file');
        
        // 更改点击事件
        uploadButton.onclick = async function() {
            try {
                const response = await fetch('/clear-files', {
                    method: 'POST'
                });
                
                if (response.ok) {
                    // 重置上传区域状态
                    resetUploadArea();
                    // 隐藏文件链接区域
                    const fileUrlSection = document.getElementById('fileUrlSection');
                    fileUrlSection.style.display = 'none';
                    fileUrlSection.classList.remove('show');
                    // 显示成功消息
                    showAlert('success', '文件柜已清空，可以重新上传');
                } else {
                    showAlert('danger', '清空文件柜失败，请重试');
                }
            } catch (err) {
                showAlert('danger', '操作失败，请检查网络连接');
            }
        };
    }

    // 修改重置上传区域的函数
    function resetUploadArea() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const uploadButton = dropZone.querySelector('button');
        const uploadText = dropZone.querySelector('h5');
        
        // 重置为上传图标
        const svg = dropZone.querySelector('.upload-icon');
        svg.innerHTML = `
            <circle class="icon-circle" cx="12" cy="12" r="10" />
            <path class="upload-arrow" d="M12 16V8M8 12l4-4 4 4" stroke-linecap="round" />
        `;
        
        // 重置按钮样式和文本
        uploadButton.classList.remove('btn-modern-danger');
        uploadButton.classList.add('btn-modern');
        uploadButton.innerHTML = `
            <span class="btn-content">
                <i class="fas fa-arrow-up-from-bracket me-2"></i>
                选择文件
            </span>
        `;
        
        // 重置提示文本
        uploadText.textContent = '拖拽文件到这里或点击选择';
        
        // 重置文件输入框
        fileInput.value = '';
        
        // 移除has-file类
        dropZone.classList.remove('has-file');
        
        // 重置点击事件
        uploadButton.onclick = () => document.getElementById('fileInput').click();
    }

    function showAlert(type, message, filename = null) {
        const alertClass = `alert alert-${type} alert-dismissible fade show`;
        uploadStatus.innerHTML = `
            <div class="${alertClass}" role="alert">
                <div class="d-flex align-items-center">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
                    ${message}
                </div>
            </div>
        `;

        // 获取提示元素
        const alertElement = uploadStatus.querySelector('.alert');
        
        // 如果是成功提示，3秒后自动消失
        if (type === 'success') {
            setTimeout(() => {
                alertElement.classList.remove('show');
                // 等待淡出动画完成后移除元素
                setTimeout(() => {
                    alertElement.remove();
                }, 300);
            }, 3000);
        }

        // 如果上传成功，显示文件链接
        if (type === 'success' && filename) {
            const fileUrlSection = document.getElementById('fileUrlSection');
            const fileUrl = document.querySelector('.file-url');
            const copyBtn = document.querySelector('.copy-btn');
            const copyFeedback = document.querySelector('.copy-feedback');
            
            // 设置文件URL
            const fullUrl = `${window.location.origin}/uploads/${filename}`;
            fileUrl.value = fullUrl;
            
            // 显示链接区域
            fileUrlSection.style.display = 'block';
            setTimeout(() => fileUrlSection.classList.add('show'), 50);

            // 复制按钮功能
            copyBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(fullUrl);
                    copyFeedback.classList.add('show');
                    setTimeout(() => copyFeedback.classList.remove('show'), 2000);
                } catch (err) {
                    console.error('复制失败:', err);
                }
            });
        }
    }

    // 修改 API 密钥相关的功能
    const generateApiKeyBtn = document.getElementById('generateApiKey');
    const apiKeyContainer = document.getElementById('apiKeyContainer');
    const apiKeyInput = document.querySelector('.api-key');

    if (generateApiKeyBtn) {
        generateApiKeyBtn.addEventListener('click', async function() {
            try {
                const response = await fetch('/generate-api-key', {
                    method: 'POST'
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (apiKeyContainer && apiKeyInput) {
                        apiKeyInput.value = data.api_key;
                        apiKeyContainer.style.display = 'block';
                        
                        // 更新示例代码中的 API 密钥
                        const codeBlock = document.querySelector('.code-block code');
                        if (codeBlock) {
                            const codeText = codeBlock.textContent;
                            codeBlock.textContent = codeText.replace(
                                /api_key = ['"].*?['"]|headers = \{.*?\}/gs,
                                `api_key = '${data.api_key}'`
                            );
                        }
                        
                        // 显示成功消息
                        showAlert('success', 'API 密钥生成成功！');
                    }
                } else {
                    showAlert('danger', '生成 API 密钥失败，请重试');
                }
            } catch (err) {
                console.error('Error:', err);
                showAlert('danger', '操作失败，请检查网络连接');
            }
        });
    }

    // 为 API 密钥添加复制功能
    const apiKeyCopyBtn = document.querySelector('.api-key-section .copy-btn');
    if (apiKeyCopyBtn) {
        apiKeyCopyBtn.addEventListener('click', async function() {
            const apiKey = document.querySelector('.api-key').value;
            try {
                await navigator.clipboard.writeText(apiKey);
                const copyFeedback = this.closest('.url-container').querySelector('.copy-feedback');
                copyFeedback.classList.add('show');
                setTimeout(() => copyFeedback.classList.remove('show'), 2000);
            } catch (err) {
                console.error('复制失败:', err);
                showAlert('danger', '复制失败，请手动复制');
            }
        });
    }

    // 代码块复制功能
    const codeBlock = document.querySelector('.code-block code');
    const copyCodeBtn = document.querySelector('.copy-code-btn');

    if (copyCodeBtn && codeBlock) {
        copyCodeBtn.addEventListener('click', async function() {
            try {
                await navigator.clipboard.writeText(codeBlock.textContent);
                
                // 添加成功反馈
                this.classList.add('success');
                const originalIcon = this.innerHTML;
                this.innerHTML = '<i class="fas fa-check"></i>';
                
                // 2秒后恢复原始状态
                setTimeout(() => {
                    this.classList.remove('success');
                    this.innerHTML = originalIcon;
                }, 2000);
                
            } catch (err) {
                console.error('复制失败:', err);
                showAlert('danger', '复制失败，请手动复制');
            }
        });
    }
});
