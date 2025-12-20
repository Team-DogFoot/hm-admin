'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGetAlbums, useUpdateAlbum } from '@/query/query/album-purchase/albums';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import { useSnackbar } from '../../../_components/useSnackbar';

export default function EditAlbumPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = Number(params.id);
  const { data: albums, isLoading: isLoadingAlbums } = useGetAlbums();
  const updateMutation = useUpdateAlbum();
  const { showSnackbar, SnackbarComponent } = useSnackbar();

  const [formData, setFormData] = useState({
    isbn: '',
    title: '',
    artist: '',
    releaseDate: '',
    entertainmentAgency: '',
    albumDescription: '',
    memo: '',
    // Read-only fields
    salePrice: '',
    defaultPurchasePrice: '',
    currentStock: '',
    softPurchaseLimit: '',
    hardPurchaseLimit: '',
  });

  useEffect(() => {
    if (albums) {
      const album = albums.find((a: any) => a.id === id);
      if (album) {
        setFormData({
          isbn: album.isbn || '',
          title: album.title || '',
          artist: album.artist || '',
          releaseDate: album.releaseDate || '',
          entertainmentAgency: album.entertainmentAgency || '',
          albumDescription: album.albumDescription || '',
          memo: album.memo || '',
          salePrice: String(album.salePrice || 0),
          defaultPurchasePrice: String(album.defaultPurchasePrice || 0),
          currentStock: String(album.currentStock || 0),
          softPurchaseLimit: String(album.softPurchaseLimit || 0),
          hardPurchaseLimit: String(album.hardPurchaseLimit || 0),
        });
      }
    }
  }, [albums, id]);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateMutation.mutateAsync({
        id,
        isbn: formData.isbn,
        title: formData.title,
        artist: formData.artist,
        releaseDate: formData.releaseDate,
        entertainmentAgency: formData.entertainmentAgency,
        albumDescription: formData.albumDescription,
        memo: formData.memo,
      });
      showSnackbar('앨범 정보가 수정되었습니다.', 'success');
      setTimeout(() => router.push('/album-purchase/albums'), 1500);
    } catch (error: any) {
      showSnackbar(error?.message || '수정에 실패했습니다.', 'error');
    }
  };

  if (isLoadingAlbums) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (albums && !albums.find((a: any) => a.id === id)) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">앨범을 찾을 수 없습니다.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <SnackbarComponent />
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        앨범 수정
      </Typography>

      <form onSubmit={handleSubmit}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontSize: 18, fontWeight: 600 }}
          >
            앨범 기본 정보
          </Typography>
          <Stack spacing={2}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2,
              }}
            >
              <TextField
                fullWidth
                label="ISBN"
                required
                value={formData.isbn}
                onChange={(e) => handleChange('isbn', e.target.value)}
              />
              <TextField
                fullWidth
                label="앨범명"
                required
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
              />
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2,
              }}
            >
              <TextField
                fullWidth
                label="아티스트"
                required
                value={formData.artist}
                onChange={(e) => handleChange('artist', e.target.value)}
              />
              <TextField
                fullWidth
                label="발매일"
                type="date"
                required
                value={formData.releaseDate}
                onChange={(e) => handleChange('releaseDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2,
              }}
            >
              <TextField
                fullWidth
                label="소속사"
                value={formData.entertainmentAgency}
                onChange={(e) =>
                  handleChange('entertainmentAgency', e.target.value)
                }
              />
              {/* Sale Price is not updateable via API */}
              <TextField
                fullWidth
                label="판매가"
                type="number"
                disabled
                value={formData.salePrice}
                helperText="수정 불가 (API 미지원)"
              />
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2,
              }}
            >
              {/* Default Purchase Price is not updateable via API */}
              <TextField
                fullWidth
                label="기본 매입가"
                type="number"
                disabled
                value={formData.defaultPurchasePrice}
                helperText="수정 불가 (API 미지원)"
              />
              <TextField
                fullWidth
                label="현재 재고"
                type="number"
                disabled
                value={formData.currentStock}
                helperText="수정 불가 (재고 관리 메뉴 이용)"
              />
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2,
              }}
            >
              {/* Limits are not updateable via API */}
              <TextField
                fullWidth
                label="Soft Purchase Limit"
                type="number"
                disabled
                value={formData.softPurchaseLimit}
                helperText="수정 불가 (API 미지원)"
              />
              <TextField
                fullWidth
                label="Hard Purchase Limit"
                type="number"
                disabled
                value={formData.hardPurchaseLimit}
                helperText="수정 불가 (API 미지원)"
              />
            </Box>
            <TextField
              fullWidth
              label="앨범 설명"
              multiline
              rows={3}
              value={formData.albumDescription}
              onChange={(e) => handleChange('albumDescription', e.target.value)}
            />
            <TextField
              fullWidth
              label="메모"
              multiline
              rows={2}
              value={formData.memo}
              onChange={(e) => handleChange('memo', e.target.value)}
            />
          </Stack>
        </Paper>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={updateMutation.isPending}
            startIcon={
              updateMutation.isPending && (
                <CircularProgress size={20} color="inherit" />
              )
            }
            sx={{ background: '#4caf50', '&:hover': { background: '#45a049' } }}
          >
            {updateMutation.isPending ? '수정 중...' : '수정'}
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => router.back()}
            disabled={updateMutation.isPending}
          >
            취소
          </Button>
        </Box>
      </form>
    </Box>
  );
}
