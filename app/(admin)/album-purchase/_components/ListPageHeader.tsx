'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import AddIcon from '@mui/icons-material/Add';
import HomeIcon from '@mui/icons-material/Home';
import { useRouter } from 'next/navigation';

interface ListPageHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  createButtonLabel?: string;
  createButtonHref?: string;
}

export default function ListPageHeader({
  icon,
  title,
  description,
  createButtonLabel,
  createButtonHref,
}: ListPageHeaderProps) {
  const router = useRouter();

  return (
    <Box sx={{ mb: 3 }}>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link
          underline="hover"
          color="inherit"
          href="/album-purchase"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <HomeIcon sx={{ fontSize: 18 }} />
          앨범 매입
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {icon}
          {title}
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" fontWeight={600} color="text.primary">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        </Box>
        {createButtonLabel && createButtonHref && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push(createButtonHref)}
            sx={{
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'primary.dark' },
              px: 3,
              py: 1,
            }}
          >
            {createButtonLabel}
          </Button>
        )}
      </Box>
    </Box>
  );
}
