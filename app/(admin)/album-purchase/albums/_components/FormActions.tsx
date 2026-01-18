'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface FormActionsProps {
  mode: 'create' | 'edit';
  isSubmitting: boolean;
  onCancel: () => void;
}

export default function FormActions({ mode, isSubmitting, onCancel }: FormActionsProps) {
  const isCreate = mode === 'create';

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'sticky',
        bottom: 0,
        p: 2,
        mt: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 2,
        zIndex: 10,
      }}
    >
      <Button
        variant="outlined"
        color="inherit"
        size="large"
        startIcon={<ArrowBackIcon />}
        onClick={onCancel}
        disabled={isSubmitting}
      >
        취소
      </Button>
      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={isSubmitting}
        startIcon={
          isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />
        }
        sx={{ minWidth: 140 }}
      >
        {isSubmitting
          ? isCreate
            ? '등록 중...'
            : '저장 중...'
          : isCreate
          ? '앨범 등록'
          : '변경사항 저장'}
      </Button>
    </Paper>
  );
}
