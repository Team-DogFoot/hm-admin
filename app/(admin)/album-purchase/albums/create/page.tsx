'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import { useCreateAlbum } from '@/query/query/album-purchase/albums';
import { useSnackbar } from '../../_components/useSnackbar';
import ImageUploader from '@/components/ImageUploader';
import FormPageHeader from '../_components/FormPageHeader';
import FormSection from '../_components/FormSection';
import FormActions from '../_components/FormActions';
import LimitTooltip from '../_components/LimitTooltip';

const Row = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', '& > *': { flex: '1 1 calc(50% - 12px)', minWidth: 280 } }}>
    {children}
  </Box>
);

const Row4 = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', '& > *': { flex: '1 1 calc(25% - 18px)', minWidth: 180 } }}>
    {children}
  </Box>
);

export default function CreateAlbumPage() {
  const router = useRouter();
  const createMutation = useCreateAlbum();
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
    currentStock: '0',
    softPurchaseLimit: '',
    hardPurchaseLimit: '',
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
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'title') updated.albumTitle = value;
      if (field === 'artist') updated.albumArtist = value;
      if (field === 'releaseDate') updated.albumReleaseDate = value;
      if (field === 'entertainmentAgency') updated.albumEntertainmentAgency = value;
      if (field === 'isbn') updated.eventIsbn = value;
      return updated;
    });
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
        purchaseAlbumAndPhotocardPrice: Number(formData.purchaseAlbumAndPhotocardPrice),
        etcPrice: Number(formData.etcPrice),
        limitPeriodDate: formData.limitPeriodDate ? Number(formData.limitPeriodDate) : undefined,
        thumbnailImageUrls: thumbnailImages,
      });
      showSnackbar('앨범과 디폴트 행사가 등록되었습니다.', 'success');
      setTimeout(() => router.push('/album-purchase/albums'), 1500);
    } catch (error: any) {
      showSnackbar(error?.message || '앨범 등록에 실패했습니다.', 'error');
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: 'grey.50', minHeight: 'calc(100vh - 72px)' }}>
      <SnackbarComponent />
      <FormPageHeader mode="create" />

      <form onSubmit={handleSubmit}>
        <FormSection title="앨범 기본 정보" description="앨범의 기본적인 정보를 입력합니다">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Row>
              <TextField fullWidth label="ISBN" required value={formData.isbn} onChange={(e) => handleChange('isbn', e.target.value)} placeholder="예: 8809704419468" />
              <TextField fullWidth label="앨범명" required value={formData.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="예: ROMANCE : UNTOLD" />
            </Row>
            <Row>
              <TextField fullWidth label="아티스트" required value={formData.artist} onChange={(e) => handleChange('artist', e.target.value)} placeholder="예: ENHYPEN" />
              <TextField fullWidth label="발매일" type="date" required value={formData.releaseDate} onChange={(e) => handleChange('releaseDate', e.target.value)} InputLabelProps={{ shrink: true }} />
            </Row>
            <Row>
              <TextField fullWidth label="소속사" value={formData.entertainmentAgency} onChange={(e) => handleChange('entertainmentAgency', e.target.value)} placeholder="예: HYBE" />
              <TextField fullWidth label="판매가" type="number" required value={formData.salePrice} onChange={(e) => handleChange('salePrice', e.target.value)} InputProps={{ endAdornment: <Typography color="text.secondary">원</Typography> }} />
            </Row>
            <TextField fullWidth label="앨범 설명" multiline rows={3} value={formData.albumDescription} onChange={(e) => handleChange('albumDescription', e.target.value)} placeholder="앨범에 대한 추가 설명을 입력하세요" />
            <TextField fullWidth label="관리자 메모" multiline rows={2} value={formData.memo} onChange={(e) => handleChange('memo', e.target.value)} placeholder="내부 관리용 메모" />
          </Box>
        </FormSection>

        <FormSection title="매입 설정" description="기본 매입가와 매입 한도를 설정합니다">
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Soft Limit:</strong> 즉시 매입 가능한 수량 | <strong>Hard Limit:</strong> 최대 매입 가능 수량
            </Typography>
          </Alert>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Row>
              <TextField fullWidth label="기본 매입가" type="number" required value={formData.defaultPurchasePrice} onChange={(e) => handleChange('defaultPurchasePrice', e.target.value)} InputProps={{ endAdornment: <Typography color="text.secondary">원</Typography> }} />
              <TextField fullWidth label="현재 재고" type="number" value={formData.currentStock} onChange={(e) => handleChange('currentStock', e.target.value)} InputProps={{ endAdornment: <Typography color="text.secondary">개</Typography> }} />
            </Row>
            <Row>
              <TextField fullWidth label="Soft Limit (즉시 매입 수량)" type="number" required value={formData.softPurchaseLimit} onChange={(e) => handleChange('softPurchaseLimit', e.target.value)} helperText="이 수량까지는 협의 없이 즉시 매입" InputProps={{ endAdornment: <LimitTooltip type="soft" /> }} />
              <TextField fullWidth label="Hard Limit (최대 매입 수량)" type="number" required value={formData.hardPurchaseLimit} onChange={(e) => handleChange('hardPurchaseLimit', e.target.value)} helperText="이 수량 초과 시 매입 불가" InputProps={{ endAdornment: <LimitTooltip type="hard" /> }} />
            </Row>
          </Box>
        </FormSection>

        <FormSection title="썸네일 이미지" description="앨범 대표 이미지를 등록합니다 (최대 5장)">
          <ImageUploader images={thumbnailImages} onImagesChange={setThumbnailImages} maxImages={5} purpose="thumbnail" />
        </FormSection>

        <FormSection title="기본 행사 정보" description="앨범 등록 시 자동으로 생성되는 기본 행사입니다">
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <Chip label="자동 생성" color="primary" size="small" />
            <Typography variant="body2" color="text.secondary">앨범 정보가 자동으로 반영됩니다</Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Row>
              <TextField fullWidth label="행사일" type="date" required value={formData.eventDate} onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })} InputLabelProps={{ shrink: true }} />
              <TextField fullWidth label="도착 마감일" type="date" required value={formData.deadlineForArrivalDate} onChange={(e) => setFormData({ ...formData, deadlineForArrivalDate: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Row>
            <Row>
              <TextField fullWidth select label="행사 상태" value={formData.eventStatus} onChange={(e) => setFormData({ ...formData, eventStatus: e.target.value })}>
                <MenuItem value="AVAILABLE_FOR_PURCHASE">매입 가능</MenuItem>
                <MenuItem value="DISCONTINUED">매입 중단</MenuItem>
              </TextField>
              <TextField fullWidth select label="매입 타입" value={formData.eventPurchaseType} onChange={(e) => setFormData({ ...formData, eventPurchaseType: e.target.value })}>
                <MenuItem value="ONLY_ALBUM">앨범만</MenuItem>
                <MenuItem value="ONLY_PHOTOCARD">포토카드만</MenuItem>
                <MenuItem value="ALBUM_AND_PHOTOCARD">앨범 + 포토카드</MenuItem>
                <MenuItem value="ETC">기타</MenuItem>
              </TextField>
            </Row>
            <Row4>
              <TextField fullWidth label="앨범 매입가" type="number" required value={formData.purchaseAlbumPrice} onChange={(e) => setFormData({ ...formData, purchaseAlbumPrice: e.target.value })} InputProps={{ endAdornment: <Typography color="text.secondary">원</Typography> }} />
              <TextField fullWidth label="포토카드 매입가" type="number" required value={formData.photocardPrice} onChange={(e) => setFormData({ ...formData, photocardPrice: e.target.value })} InputProps={{ endAdornment: <Typography color="text.secondary">원</Typography> }} />
              <TextField fullWidth label="앨범+포토카드" type="number" required value={formData.purchaseAlbumAndPhotocardPrice} onChange={(e) => setFormData({ ...formData, purchaseAlbumAndPhotocardPrice: e.target.value })} InputProps={{ endAdornment: <Typography color="text.secondary">원</Typography> }} />
              <TextField fullWidth label="기타 매입가" type="number" value={formData.etcPrice} onChange={(e) => setFormData({ ...formData, etcPrice: e.target.value })} InputProps={{ endAdornment: <Typography color="text.secondary">원</Typography> }} />
            </Row4>
            <TextField fullWidth label="행사 설명" multiline rows={2} value={formData.eventDescription} onChange={(e) => setFormData({ ...formData, eventDescription: e.target.value })} placeholder="행사에 대한 추가 설명" />
          </Box>
        </FormSection>

        <FormActions mode="create" isSubmitting={createMutation.isPending} onCancel={() => router.back()} />
      </form>
    </Box>
  );
}
