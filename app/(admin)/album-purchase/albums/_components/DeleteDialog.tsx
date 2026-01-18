'use client';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface DeleteDialogProps {
  open: boolean;
  albumTitle: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteDialog({
  open,
  albumTitle,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon color="warning" />
          앨범 삭제
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">
          다음 앨범을 삭제하시겠습니까?
        </Typography>
        <Typography fontWeight={600} sx={{ mt: 1, p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
          {albumTitle}
        </Typography>
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          이 작업은 되돌릴 수 없습니다.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isDeleting} color="inherit">
          취소
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={isDeleting}
          startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {isDeleting ? '삭제 중...' : '삭제'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
