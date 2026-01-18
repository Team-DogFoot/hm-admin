'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import HomeIcon from '@mui/icons-material/Home';
import AlbumIcon from '@mui/icons-material/Album';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

interface FormPageHeaderProps {
  mode: 'create' | 'edit';
  albumTitle?: string;
}

export default function FormPageHeader({ mode, albumTitle }: FormPageHeaderProps) {
  const isCreate = mode === 'create';

  return (
    <Box sx={{ mb: 4 }}>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          underline="hover"
          color="inherit"
          href="/album-purchase"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <HomeIcon sx={{ fontSize: 18 }} />
          앨범 매입
        </Link>
        <Link
          underline="hover"
          color="inherit"
          href="/album-purchase/albums"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <AlbumIcon sx={{ fontSize: 18 }} />
          앨범 관리
        </Link>
        <Typography color="text.primary">
          {isCreate ? '새 앨범 등록' : '앨범 수정'}
        </Typography>
      </Breadcrumbs>

      {/* Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: isCreate ? 'primary.main' : 'warning.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          {isCreate ? <AddIcon /> : <EditIcon />}
        </Box>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h5" fontWeight={600}>
              {isCreate ? '새 앨범 등록' : '앨범 수정'}
            </Typography>
            {!isCreate && albumTitle && (
              <Chip label={albumTitle} size="small" variant="outlined" />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {isCreate
              ? '새로운 앨범과 기본 행사 정보를 등록합니다'
              : '앨범의 기본 정보를 수정합니다'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
