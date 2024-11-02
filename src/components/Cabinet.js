import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Container, Paper, Typography, Button, 
  IconButton, Alert, Divider, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Fade
} from '@mui/material';
import { 
  Logout, Delete, ContentCopy, 
  OpenInNew, Description, InsertDriveFile,
  CloudUpload, Error, RestartAlt
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import { styled } from '@mui/material/styles';

const StyledFileIcon = styled(Box)(({ theme }) => ({
  width: 60,
  height: 60,
  backgroundColor: theme.palette.primary.main,
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.common.white,
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.05)',
  }
}));

const PreviewLink = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.grey[50],
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  '& .MuiTypography-root': {
    fontFamily: 'monospace',
    fontSize: '0.875rem',
  }
}));

function Cabinet() {
  const [fileInfo, setFileInfo] = useState(null);
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [resetDialog, setResetDialog] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFileInfo();
  }, []);

  const fetchFileInfo = async () => {
    try {
      const response = await api.get('/file-info');
      setFileInfo(response.data);
      
      // 如果文件柜为空，自动跳转到上传页面
      if (!response.data) {
        navigate('/upload');
      }
    } catch (error) {
      console.error('获取文件信息失败:', error);
      setError('获取文件信息失败，请刷新页面重试');
    }
  };

  const handleClear = async () => {
    try {
      await api.delete('/file');
      setFileInfo(null);
      setDeleteDialog(false);
      setSnackbar({ open: true, message: '文件已删除' });
      setTimeout(() => navigate('/upload'), 1500);
    } catch (error) {
      console.error('删除文件失败:', error);
      setError('删除文件失败，请重试');
      setDeleteDialog(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fileInfo.previewUrl);
    setSnackbar({ open: true, message: '链接已复制到剪贴板' });
  };

  const handleReset = async () => {
    try {
      await api.post('/reset-system');
      setResetDialog(false);
      setSnackbar({ open: true, message: '系统已重置' });
      logout();
    } catch (error) {
      console.error('重置系统失败:', error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || '重置系统失败，请重试' 
      });
      setResetDialog(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 } }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Typography variant="h4" component="h1" sx={{ 
          fontWeight: 'bold', 
          color: 'primary.main',
          textAlign: { xs: 'center', sm: 'left' }
        }}>
          文件管理
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<RestartAlt />}
            onClick={() => setResetDialog(true)}
          >
            重置系统
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Logout />}
            onClick={logout}
          >
            退出登录
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => setError('')}>
              关闭
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Fade in={true} timeout={500}>
        <Box>
          {fileInfo ? (
            <Paper elevation={3} sx={{ p: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: 2, 
                mb: 3,
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'center', sm: 'flex-start' }
              }}>
                <StyledFileIcon>
                  {fileInfo.name.endsWith('.csv') ? 
                    <Description sx={{ fontSize: 32 }} /> : 
                    <InsertDriveFile sx={{ fontSize: 32 }} />
                  }
                </StyledFileIcon>
                <Box sx={{ 
                  flex: 1,
                  textAlign: { xs: 'center', sm: 'left' },
                  width: { xs: '100%', sm: 'auto' }
                }}>
                  <Typography variant="h6" gutterBottom>
                    {fileInfo.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatFileSize(fileInfo.size)} • {new Date(fileInfo.uploadTime).toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  预览链接
                </Typography>
                <PreviewLink variant="outlined">
                  <Typography sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {fileInfo.previewUrl}
                  </Typography>
                  <Tooltip title="复制链接">
                    <IconButton size="small" onClick={handleCopyLink}>
                      <ContentCopy />
                    </IconButton>
                  </Tooltip>
                </PreviewLink>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                gap: 2,
                flexDirection: { xs: 'column', sm: 'row' }
              }}>
                <Button
                  variant="contained"
                  startIcon={<OpenInNew />}
                  onClick={() => window.open(fileInfo.previewUrl, '_blank')}
                  fullWidth
                >
                  查看文件
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => setDeleteDialog(true)}
                  fullWidth
                >
                  删除文件
                </Button>
              </Box>
            </Paper>
          ) : (
            <Paper 
              elevation={3} 
              sx={{ 
                p: 6, 
                textAlign: 'center',
                bgcolor: 'background.default' 
              }}
            >
              <StyledFileIcon sx={{ margin: '0 auto', mb: 3 }}>
                <InsertDriveFile sx={{ fontSize: 32 }} />
              </StyledFileIcon>
              <Typography variant="h5" gutterBottom>
                文件柜为空
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                还没有上传任何文件
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<CloudUpload />}
                onClick={() => navigate('/upload')}
              >
                上传文件
              </Button>
            </Paper>
          )}
        </Box>
      </Fade>

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Error color="error" />
            <Typography variant="h6">确认删除</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除这个文件吗？此操作无法撤销。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>
            取消
          </Button>
          <Button onClick={handleClear} color="error" variant="contained">
            删除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 重置确认对话框 */}
      <Dialog
        open={resetDialog}
        onClose={() => setResetDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Error color="error" />
            <Typography variant="h6">确认重置系统</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography color="error.main" sx={{ mb: 2 }}>
            警告：此操作将清除所有数据！
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            重置系统将：
          </Typography>
          <Box component="ul" sx={{ mt: 0, mb: 2 }}>
            <li>删除所有已上传的文件</li>
            <li>清除所有用户账号</li>
            <li>重置 API 密钥</li>
            <li>恢复系统至初始状态</li>
          </Box>
          <Typography color="error.main">
            此操作无法撤销，是否继续？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialog(false)}>
            取消
          </Button>
          <Button onClick={handleReset} color="error" variant="contained">
            确认重置
          </Button>
        </DialogActions>
      </Dialog>

      {/* 提示消息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Container>
  );
}

export default Cabinet;