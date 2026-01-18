'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateAlbum } from '@/query/query/album-purchase/albums';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import { useSnackbar } from '../../_components/useSnackbar';
import ImageUploader from '@/components/ImageUploader';

export default function CreateAlbumPage() {
  const router = useRouter();
  const createMutation = useCreateAlbum();
  const { showSnackbar, SnackbarComponent } = useSnackbar();

  const [formData, setFormData] = useState({
    // 앨범 기본 정보
    isbn: '',
    title: '',
    artist: '',
    releaseDate: '',
    entertainmentAgency: '',
    albumDescription: '',
    memo: '',
    salePrice: '',
    defaultPurchasePrice: '',
    currentStock: '0',
    softPurchaseLimit: '',
    hardPurchaseLimit: '',
    // 디폴트 이벤트 정보
    albumTitle: '',
    albumArtist: '',
    albumReleaseDate: '',
    albumEntertainmentAgency: '',
    eventIsbn: '',
    eventDescription: '',
    eventMemo: '',
    purchaseAlbumPrice: '',
    photocardPrice: '',
    purchaseAlbumAndPhotocardPrice: '',
    etcPrice: '0',
    etcDescription: '',
    eventDate: '',
    limitPeriodDate: '7',
    deadlineForArrivalDate: '',
    eventStatus: 'AVAILABLE_FOR_PURCHASE',
    eventPurchaseType: 'ONLY_ALBUM',
  });

  const [thumbnailImages, setThumbnailImages] = useState<string[]>([]);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });

    // 앨범 정보를 이벤트 정보에 자동 복사
    if (field === 'title') {
      setFormData((prev) => ({ ...prev, title: value, albumTitle: value }));
    } else if (field === 'artist') {
      setFormData((prev) => ({ ...prev, artist: value, albumArtist: value }));
    } else if (field === 'releaseDate') {
      setFormData((prev) => ({
        ...prev,
        releaseDate: value,
        albumReleaseDate: value,
      }));
    } else if (field === 'entertainmentAgency') {
      setFormData((prev) => ({
        ...prev,
        entertainmentAgency: value,
        albumEntertainmentAgency: value,
      }));
    } else if (field === 'isbn') {
      setFormData((prev) => ({ ...prev, isbn: value, eventIsbn: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createMutation.mutateAsync({
        ...formData,
        salePrice: Number(formData.salePrice),
        defaultPurchasePrice: Number(formData.defaultPurchasePrice),
        currentStock: Number(formData.currentStock),
        softPurchaseLimit: Number(formData.softPurchaseLimit),
        hardPurchaseLimit: Number(formData.hardPurchaseLimit),
        purchaseAlbumPrice: Number(formData.purchaseAlbumPrice),
        photocardPrice: Number(formData.photocardPrice),
        purchaseAlbumAndPhotocardPrice: Number(
          formData.purchaseAlbumAndPhotocardPrice,
        ),
        etcPrice: Number(formData.etcPrice),
        limitPeriodDate: formData.limitPeriodDate
          ? Number(formData.limitPeriodDate)
          : undefined,
        thumbnailImageUrls: thumbnailImages,
      });
      showSnackbar('앨범과 디폴트 행사가 등록되었습니다.', 'success');
      setTimeout(() => router.push('/album-purchase/albums'), 1500);
    } catch (error: any) {
      showSnackbar(error?.message || '앨범 등록에 실패했습니다.', 'error');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <SnackbarComponent />
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        앨범 등록 (디폴트 행사 자동 생성)
      </Typography>

      <form onSubmit={handleSubmit}>
        {/* 앨범 기본 정보 */}
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
              <TextField
                fullWidth
                label="판매가"
                type="number"
                required
                value={formData.salePrice}
                onChange={(e) => handleChange('salePrice', e.target.value)}
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
                label="기본 매입가"
                type="number"
                required
                value={formData.defaultPurchasePrice}
                onChange={(e) =>
                  handleChange('defaultPurchasePrice', e.target.value)
                }
              />
              <TextField
                fullWidth
                label="현재 재고"
                type="number"
                value={formData.currentStock}
                onChange={(e) => handleChange('currentStock', e.target.value)}
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
                label="Soft Purchase Limit"
                type="number"
                required
                value={formData.softPurchaseLimit}
                onChange={(e) =>
                  handleChange('softPurchaseLimit', e.target.value)
                }
              />
              <TextField
                fullWidth
                label="Hard Purchase Limit"
                type="number"
                required
                value={formData.hardPurchaseLimit}
                onChange={(e) =>
                  handleChange('hardPurchaseLimit', e.target.value)
                }
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

            {/* 썸네일 이미지 업로드 */}
            <ImageUploader
              images={thumbnailImages}
              onImagesChange={setThumbnailImages}
              maxImages={5}
              purpose="thumbnail"
            />
          </Stack>
        </Paper>

        {/* 디폴트 행사 정보 */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontSize: 18, fontWeight: 600 }}
          >
            디폴트 행사 정보
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
                label="행사일"
                type="date"
                required
                value={formData.eventDate}
                onChange={(e) =>
                  setFormData({ ...formData, eventDate: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="도착 마감일"
                type="date"
                required
                value={formData.deadlineForArrivalDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deadlineForArrivalDate: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
                gap: 2,
              }}
            >
              <TextField
                fullWidth
                label="앨범 매입가"
                type="number"
                required
                value={formData.purchaseAlbumPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    purchaseAlbumPrice: e.target.value,
                  })
                }
              />
              <TextField
                fullWidth
                label="포토카드 매입가"
                type="number"
                required
                value={formData.photocardPrice}
                onChange={(e) =>
                  setFormData({ ...formData, photocardPrice: e.target.value })
                }
              />
              <TextField
                fullWidth
                label="앨범+포토카드 매입가"
                type="number"
                required
                value={formData.purchaseAlbumAndPhotocardPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    purchaseAlbumAndPhotocardPrice: e.target.value,
                  })
                }
              />
              <TextField
                fullWidth
                label="기타 매입가"
                type="number"
                value={formData.etcPrice}
                onChange={(e) =>
                  setFormData({ ...formData, etcPrice: e.target.value })
                }
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
                select
                label="행사 상태"
                value={formData.eventStatus}
                onChange={(e) =>
                  setFormData({ ...formData, eventStatus: e.target.value })
                }
              >
                <MenuItem value="AVAILABLE_FOR_PURCHASE">매입 가능</MenuItem>
                <MenuItem value="DISCONTINUED">매입 중단</MenuItem>
              </TextField>
              <TextField
                fullWidth
                select
                label="매입 타입"
                value={formData.eventPurchaseType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    eventPurchaseType: e.target.value,
                  })
                }
              >
                <MenuItem value="ONLY_ALBUM">앨범만</MenuItem>
                <MenuItem value="ONLY_PHOTOCARD">포토카드만</MenuItem>
                <MenuItem value="ALBUM_AND_PHOTOCARD">앨범 + 포토카드</MenuItem>
                <MenuItem value="ETC">기타</MenuItem>
              </TextField>
            </Box>
            <TextField
              fullWidth
              label="행사 설명"
              multiline
              rows={2}
              value={formData.eventDescription}
              onChange={(e) =>
                setFormData({ ...formData, eventDescription: e.target.value })
              }
            />
          </Stack>
        </Paper>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={createMutation.isPending}
            startIcon={
              createMutation.isPending && (
                <CircularProgress size={20} color="inherit" />
              )
            }
            sx={{ background: '#4caf50', '&:hover': { background: '#45a049' } }}
          >
            {createMutation.isPending ? '등록 중...' : '등록'}
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => router.back()}
            disabled={createMutation.isPending}
          >
            취소
          </Button>
        </Box>
      </form>
    </Box>
  );
}
