'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import LockIcon from '@mui/icons-material/Lock';
import { useGetAlbums, useUpdateAlbum } from '@/query/query/album-purchase/albums';
import { useSnackbar } from '../../../_components/useSnackbar';
import ImageUploader from '@/components/ImageUploader';
import FormPageHeader from '../../_components/FormPageHeader';
import FormSection from '../../_components/FormSection';
import FormActions from '../../_components/FormActions';
import LimitTooltip from '../../_components/LimitTooltip';

const Row = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', '& > *': { flex: '1 1 calc(50% - 12px)', minWidth: 280 } }}>
    {children}
  </Box>
);

const Row3 = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', '& > *': { flex: '1 1 calc(33.33% - 16px)', minWidth: 200 } }}>
    {children}
  </Box>
);

function LoadingSkeleton() {
  return (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="text" width={200} height={32} sx={{ mb: 1 }} />
      <Skeleton variant="text" width={300} height={24} sx={{ mb: 4 }} />
      <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2, mb: 3 }} />
      <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
    </Box>
  );
}

function NotFound() {
  const router = useRouter();
  return (
    <Box sx={{ p: 3, textAlign: 'center', py: 10 }}>
      <Typography variant="h6" color="text.secondary" gutterBottom>앨범을 찾을 수 없습니다</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>요청하신 앨범이 존재하지 않거나 삭제되었을 수 있습니다.</Typography>
      <Box component="span" onClick={() => router.push('/album-purchase/albums')} sx={{ color: 'primary.main', cursor: 'pointer', textDecoration: 'underline' }}>
        앨범 목록으로 돌아가기
      </Box>
    </Box>
  );
}

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
    salePrice: '',
    defaultPurchasePrice: '',
    currentStock: '',
    softPurchaseLimit: '',
    hardPurchaseLimit: '',
  });

  const [thumbnailImages, setThumbnailImages] = useState<string[]>([]);
  const [originalTitle, setOriginalTitle] = useState('');

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
        setOriginalTitle(album.title || '');
        if (album.thumbnailImageUrls) setThumbnailImages(album.thumbnailImageUrls);
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
        thumbnailImageUrls: thumbnailImages,
      });
      showSnackbar('앨범 정보가 수정되었습니다.', 'success');
      setTimeout(() => router.push('/album-purchase/albums'), 1500);
    } catch (error: any) {
      showSnackbar(error?.message || '수정에 실패했습니다.', 'error');
    }
  };

  if (isLoadingAlbums) return <LoadingSkeleton />;
  if (albums && !albums.find((a: any) => a.id === id)) return <NotFound />;

  return (
    <Box sx={{ p: 3, bgcolor: 'grey.50', minHeight: 'calc(100vh - 72px)' }}>
      <SnackbarComponent />
      <FormPageHeader mode="edit" albumTitle={originalTitle} />

      <form onSubmit={handleSubmit}>
        <FormSection title="앨범 기본 정보" description="앨범의 기본적인 정보를 수정합니다">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Row>
              <TextField fullWidth label="ISBN" required value={formData.isbn} onChange={(e) => handleChange('isbn', e.target.value)} />
              <TextField fullWidth label="앨범명" required value={formData.title} onChange={(e) => handleChange('title', e.target.value)} />
            </Row>
            <Row>
              <TextField fullWidth label="아티스트" required value={formData.artist} onChange={(e) => handleChange('artist', e.target.value)} />
              <TextField fullWidth label="발매일" type="date" required value={formData.releaseDate} onChange={(e) => handleChange('releaseDate', e.target.value)} InputLabelProps={{ shrink: true }} />
            </Row>
            <Row>
              <TextField fullWidth label="소속사" value={formData.entertainmentAgency} onChange={(e) => handleChange('entertainmentAgency', e.target.value)} />
              <Box sx={{ flex: '1 1 calc(50% - 12px)', minWidth: 280 }} />
            </Row>
            <TextField fullWidth label="앨범 설명" multiline rows={3} value={formData.albumDescription} onChange={(e) => handleChange('albumDescription', e.target.value)} />
            <TextField fullWidth label="관리자 메모" multiline rows={2} value={formData.memo} onChange={(e) => handleChange('memo', e.target.value)} />
          </Box>
        </FormSection>

        <FormSection title="매입 설정" description="매입 관련 설정은 현재 수정이 불가능합니다">
          <Alert severity="warning" icon={<LockIcon fontSize="small" />} sx={{ mb: 3 }}>
            <Typography variant="body2">아래 항목들은 API 제한으로 수정할 수 없습니다. 변경이 필요한 경우 개발팀에 문의하세요.</Typography>
          </Alert>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Row>
              <TextField fullWidth label="판매가" type="number" disabled value={formData.salePrice} InputProps={{ endAdornment: <Typography color="text.secondary">원</Typography>, startAdornment: <LockIcon fontSize="small" color="disabled" sx={{ mr: 1 }} /> }} />
              <TextField fullWidth label="기본 매입가" type="number" disabled value={formData.defaultPurchasePrice} InputProps={{ endAdornment: <Typography color="text.secondary">원</Typography>, startAdornment: <LockIcon fontSize="small" color="disabled" sx={{ mr: 1 }} /> }} />
            </Row>
            <Row3>
              <TextField fullWidth label="현재 재고" type="number" disabled value={formData.currentStock} InputProps={{ endAdornment: <Typography color="text.secondary">개</Typography>, startAdornment: <LockIcon fontSize="small" color="disabled" sx={{ mr: 1 }} /> }} />
              <TextField fullWidth label="Soft Limit" type="number" disabled value={formData.softPurchaseLimit} InputProps={{ endAdornment: <LimitTooltip type="soft" />, startAdornment: <LockIcon fontSize="small" color="disabled" sx={{ mr: 1 }} /> }} />
              <TextField fullWidth label="Hard Limit" type="number" disabled value={formData.hardPurchaseLimit} InputProps={{ endAdornment: <LimitTooltip type="hard" />, startAdornment: <LockIcon fontSize="small" color="disabled" sx={{ mr: 1 }} /> }} />
            </Row3>
          </Box>
        </FormSection>

        <FormSection title="썸네일 이미지" description="앨범 대표 이미지를 수정합니다 (최대 5장)">
          <ImageUploader images={thumbnailImages} onImagesChange={setThumbnailImages} maxImages={5} purpose="thumbnail" />
        </FormSection>

        <FormActions mode="edit" isSubmitting={updateMutation.isPending} onCancel={() => router.back()} />
      </form>
    </Box>
  );
}
