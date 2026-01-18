'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import AlbumIcon from '@mui/icons-material/Album';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import InventoryIcon from '@mui/icons-material/Inventory';

interface StatsCardsProps {
  totalAlbums: number;
  visibleAlbums: number;
  hiddenAlbums: number;
  totalStock: number;
  isLoading: boolean;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  isLoading: boolean;
}

function StatCard({ title, value, icon, color, isLoading }: StatCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        flex: 1,
        minWidth: 200,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          bgcolor: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {title}
        </Typography>
        {isLoading ? (
          <Skeleton width={60} height={32} />
        ) : (
          <Typography variant="h5" fontWeight={600}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

export default function StatsCards({
  totalAlbums,
  visibleAlbums,
  hiddenAlbums,
  totalStock,
  isLoading,
}: StatsCardsProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        mb: 3,
        flexWrap: 'wrap',
      }}
    >
      <StatCard
        title="전체 앨범"
        value={totalAlbums}
        icon={<AlbumIcon />}
        color="#1976d2"
        isLoading={isLoading}
      />
      <StatCard
        title="공개 앨범"
        value={visibleAlbums}
        icon={<VisibilityIcon />}
        color="#2e7d32"
        isLoading={isLoading}
      />
      <StatCard
        title="비공개 앨범"
        value={hiddenAlbums}
        icon={<VisibilityOffIcon />}
        color="#ed6c02"
        isLoading={isLoading}
      />
      <StatCard
        title="총 재고"
        value={totalStock}
        icon={<InventoryIcon />}
        color="#9c27b0"
        isLoading={isLoading}
      />
    </Box>
  );
}
