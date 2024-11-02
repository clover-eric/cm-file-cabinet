import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Container, Paper, Typography, Button, 
  IconButton, Alert, CircularProgress, Divider,
  Snackbar
} from '@mui/material';
import { 
  CloudUpload, FileCopy, Code, 
  ContentCopy, Key, Article, ArrowBack
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import api from '../api/api';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const DropZone = styled(Box)(({ theme, isDragActive, hasFile }) => ({
  border: `2px dashed ${hasFile ? theme.palette.success.main : theme.palette.primary.main}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  backgroundColor: isDragActive 
    ? theme.palette.action.hover 
    : hasFile 
    ? theme.palette.success.light + '20'
    : theme.palette.background.default,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderColor: theme.palette.primary.dark,
  }
}));

const CodeBlock = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.grey[900],
  color: theme.palette.common.white,
  padding: theme.spacing(2),
  position: 'relative',
  fontFamily: 'monospace',
  fontSize: '0.875rem',
  overflow: 'auto',
  '& pre': {
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all'
  }
}));

function Upload() {
  const [file, setFile] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const navigate = useNavigate();

  useEffect(() => {
    checkCabinetStatus();
  }, []);

  const checkCabinetStatus = async () => {
    try {
      const response = await api.get('/file-info');
      if (response.data) {
        navigate('/cabinet');
      }
    } catch (error) {
      console.error('检查文件柜状态失败:', error);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelection(droppedFile);
  };

  const handleFileSelection = (selectedFile) => {
    if (selectedFile) {
      const validTypes = ['.csv', '.txt'];
      const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
      
      if (!validTypes.includes(fileExtension)) {
        setError('只支持 CSV 或 TXT 文件');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError('');
    }
  };

  const handleFileChange = (e) => {
    handleFileSelection(e.target.files[0]);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('请选择要上传的文件');
      return;
    }

    try {
      setUploading(true);
      setError('');
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        navigate('/cabinet');
      } else {
        setError('文件上传失败');
      }
    } catch (error) {
      console.error('上传错误:', error);
      setError(error.response?.data?.message || '文件上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const generateApiKey = async () => {
    try {
      setError('');
      const response = await api.post('/generate-api-key');
      setApiKey(response.data.apiKey);
    } catch (error) {
      console.error('生成 API 密钥失败:', error);
      setError('生成 API 密钥失败，请重试');
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/cabinet')}
          sx={{ mr: 2 }}
        >
          返回文件柜
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          上传文件
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gap: 3 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Article /> 手动上传
          </Typography>

          <DropZone
            onDragEnter={handleDragEnter}
            onDragOver={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            isDragActive={isDragActive}
            hasFile={!!file}
            sx={{ mt: 2 }}
          >
            <input
              type="file"
              onChange={handleFileChange}
              accept=".csv,.txt"
              style={{ display: 'none' }}
              id="file-input"
            />
            <label htmlFor="file-input">
              <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {file ? file.name : '点击或拖拽文件到此处'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                支持 CSV 或 TXT 文件
              </Typography>
            </label>
          </DropZone>

          <Button
            variant="contained"
            fullWidth
            size="large"
            disabled={!file || uploading}
            onClick={handleFileUpload}
            startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
            sx={{ mt: 2 }}
          >
            {uploading ? '上传中...' : '开始上传'}
          </Button>
        </Paper>

        {/* API 上传部分保持不变 */}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Container>
  );
}

export default Upload;