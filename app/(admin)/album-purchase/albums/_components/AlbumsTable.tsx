'use client';

import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useRouter } from 'next/navigation';
import { useGetAlbums, useDeleteAlbum } from '@/query/query/album-purchase/albums';
import SearchToolbar from './SearchToolbar';
import DeleteDialog from './DeleteDialog';
import StatsCards from './StatsCards';

interface AlbumsTableProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export default function AlbumsTable({ onSuccess, onError }: AlbumsTableProps) {
  const router = useRouter();
  const { data: albums = [], isLoading, refetch } = useGetAlbums();
  const deleteMutation = useDeleteAlbum();

  // Search & Filter State
  const [searchText, setSearchText] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');

  // Delete Dialog State
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    albumId: number | null;
    albumTitle: string;
  }>({ open: false, albumId: null, albumTitle: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter & Search Logic
  const filteredAlbums = useMemo(() => {
    return albums.filter((album: any) => {
      // Visibility Filter
      if (visibilityFilter === 'visible' && !album.isVisible) return false;
      if (visibilityFilter === 'hidden' && album.isVisible) return false;

      // Search Filter
      if (searchText) {
        const search = searchText.toLowerCase();
        return (
          album.title?.toLowerCase().includes(search) ||
          album.artist?.toLowerCase().includes(search) ||
          album.isbn?.toLowerCase().includes(search) ||
          album.entertainmentAgency?.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [albums, searchText, visibilityFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = albums.length;
    const visible = albums.filter((a: any) => a.isVisible).length;
    const hidden = total - visible;
    const totalStock = albums.reduce((sum: number, a: any) => sum + (a.currentStock || 0), 0);
    return { total, visible, hidden, totalStock };
  }, [albums]);

  // Handlers
  const handleEdit = (id: number) => {
    router.push(`/album-purchase/albums/${id}/edit`);
  };

  const handleDeleteClick = (id: number, title: string) => {
    setDeleteDialog({ open: true, albumId: id, albumTitle: title });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.albumId) return;
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(deleteDialog.albumId);
      onSuccess('앨범이 삭제되었습니다.');
      setDeleteDialog({ open: false, albumId: null, albumTitle: '' });
      refetch();
    } catch (error: any) {
      onError(error?.message || '삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClose = () => {
    if (!isDeleting) {
      setDeleteDialog({ open: false, albumId: null, albumTitle: '' });
    }
  };

  // Column Definitions
  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 70,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'thumbnailImageUrls',
      headerName: '',
      width: 60,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1,
            overflow: 'hidden',
            bgcolor: 'grey.100',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {params.value?.[0] ? (
            <img
              src={params.value[0]}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Typography variant="caption" color="text.disabled">
              N/A
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'title',
      headerName: '앨범명',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={500} noWrap>
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {params.row.artist}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'entertainmentAgency',
      headerName: '소속사',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'releaseDate',
      headerName: '발매일',
      width: 110,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'defaultPurchasePrice',
      headerName: '기본 매입가',
      width: 120,
      headerAlign: 'right',
      align: 'right',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={500}>
          {params.value?.toLocaleString() || 0}원
        </Typography>
      ),
    },
    {
      field: 'softPurchaseLimit',
      headerName: 'Soft',
      width: 80,
      headerAlign: 'center',
      align: 'center',
      renderHeader: () => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <span>Soft</span>
          <Tooltip title="즉시 매입 가능 수량" arrow>
            <HelpOutlineIcon sx={{ fontSize: 14, color: 'action.active' }} />
          </Tooltip>
        </Box>
      ),
      renderCell: (params) => (
        <Chip
          label={params.value || 0}
          size="small"
          sx={{ bgcolor: 'success.50', color: 'success.main', fontWeight: 500 }}
        />
      ),
    },
    {
      field: 'hardPurchaseLimit',
      headerName: 'Hard',
      width: 80,
      headerAlign: 'center',
      align: 'center',
      renderHeader: () => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <span>Hard</span>
          <Tooltip title="최대 매입 한도" arrow>
            <HelpOutlineIcon sx={{ fontSize: 14, color: 'action.active' }} />
          </Tooltip>
        </Box>
      ),
      renderCell: (params) => (
        <Chip
          label={params.value || 0}
          size="small"
          sx={{ bgcolor: 'warning.50', color: 'warning.main', fontWeight: 500 }}
        />
      ),
    },
    {
      field: 'currentStock',
      headerName: '재고',
      width: 80,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={500}>
          {params.value || 0}
        </Typography>
      ),
    },
    {
      field: 'isVisible',
      headerName: '상태',
      width: 90,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) =>
        params.value ? (
          <Chip
            icon={<VisibilityIcon sx={{ fontSize: 16 }} />}
            label="공개"
            size="small"
            color="success"
            variant="outlined"
          />
        ) : (
          <Chip
            icon={<VisibilityOffIcon sx={{ fontSize: 16 }} />}
            label="비공개"
            size="small"
            color="default"
            variant="outlined"
          />
        ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      filterable: false,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="수정">
            <IconButton
              size="small"
              onClick={() => handleEdit(params.row.id)}
              sx={{ color: 'primary.main' }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="삭제">
            <IconButton
              size="small"
              onClick={() => handleDeleteClick(params.row.id, params.row.title)}
              sx={{ color: 'error.main' }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const rows = filteredAlbums.map((album: any) => ({
    id: album.id,
    thumbnailImageUrls: album.thumbnailImageUrls,
    title: album.title,
    artist: album.artist,
    entertainmentAgency: album.entertainmentAgency,
    releaseDate: album.releaseDate,
    defaultPurchasePrice: album.defaultPurchasePrice,
    softPurchaseLimit: album.softPurchaseLimit,
    hardPurchaseLimit: album.hardPurchaseLimit,
    currentStock: album.currentStock,
    isVisible: album.isVisible,
  }));

  return (
    <>
      {/* Stats Cards */}
      <StatsCards
        totalAlbums={stats.total}
        visibleAlbums={stats.visible}
        hiddenAlbums={stats.hidden}
        totalStock={stats.totalStock}
        isLoading={isLoading}
      />

      {/* Table Container */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* Search Toolbar */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <SearchToolbar
            searchText={searchText}
            onSearchChange={setSearchText}
            visibilityFilter={visibilityFilter}
            onVisibilityFilterChange={setVisibilityFilter}
            onRefresh={() => refetch()}
          />
        </Box>

        {/* Data Grid */}
        <DataGrid
          rows={rows}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 20, 50]}
          initialState={{
            pagination: { paginationModel: { page: 0, pageSize: 20 } },
          }}
          disableRowSelectionOnClick
          rowHeight={60}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: 'grey.50',
              borderBottom: '1px solid',
              borderColor: 'divider',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 600,
              fontSize: 13,
            },
            '& .MuiDataGrid-cell': {
              borderColor: 'divider',
            },
            '& .MuiDataGrid-row:hover': {
              bgcolor: 'action.hover',
            },
          }}
          localeText={{
            noRowsLabel: '등록된 앨범이 없습니다',
          }}
        />
      </Paper>

      {/* Delete Dialog */}
      <DeleteDialog
        open={deleteDialog.open}
        albumTitle={deleteDialog.albumTitle}
        isDeleting={isDeleting}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
