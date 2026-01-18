'use client';

import { Suspense } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import PageHeader from './_components/PageHeader';
import AlbumsTable from './_components/AlbumsTable';
import { useSnackbar } from '../_components/useSnackbar';

function LoadingFallback() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 400,
      }}
    >
      <CircularProgress />
    </Box>
  );
}

export default function AlbumsPage() {
  const { showSnackbar, SnackbarComponent } = useSnackbar();

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: 'grey.50',
        minHeight: 'calc(100vh - 72px)',
      }}
    >
      <SnackbarComponent />

      {/* Page Header */}
      <PageHeader />

      {/* Main Content */}
      <Suspense fallback={<LoadingFallback />}>
        <AlbumsTable
          onSuccess={(msg) => showSnackbar(msg, 'success')}
          onError={(msg) => showSnackbar(msg, 'error')}
        />
      </Suspense>
    </Box>
  );
}
