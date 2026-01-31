'use client';
import { useDeleteShipping } from '@/query/query/shippings';
import React from 'react';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

export default function DeleteShippingButton({ info }: any) {
  const { mutate: deleteShippingItem, isPending } = useDeleteShipping();

  const handleDelete = async () => {
    if (confirm('이미 삭제된 발송은 복구되지 않습니다.')) {
      deleteShippingItem(info.row.original.id);
    }
  };

  if (info.row.original.shippingStatus === '결제완료') return null;

  return (
    <Button
      color="error"
      variant="outlined"
      size="small"
      sx={{ mr: 1, minWidth: 80, fontWeight: 600 }}
      onClick={handleDelete}
      disabled={isPending}
      startIcon={
        isPending ? <CircularProgress size={16} color="inherit" /> : null
      }
    >
      삭제
    </Button>
  );
}
