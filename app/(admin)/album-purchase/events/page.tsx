'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EventIcon from '@mui/icons-material/Event';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useGetEvents, useDeleteEvent } from '@/query/query/album-purchase/events';
import { useSnackbar } from '../_components/useSnackbar';
import ListPageHeader from '../_components/ListPageHeader';
import StatCard from '../_components/StatCard';
import { dataGridStyles, dataGridLocaleText } from '../_components/dataGridStyles';

export default function EventsPage() {
  const router = useRouter();
  const { showSnackbar, SnackbarComponent } = useSnackbar();
  const [filters, setFilters] = useState<{
    isVisible?: boolean;
    isFinished?: boolean;
  }>({});
  const [searchText, setSearchText] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    eventId: number | null;
    eventTitle: string;
  }>({ open: false, eventId: null, eventTitle: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: events = [], isLoading, refetch } = useGetEvents(filters);
  const deleteEventMutation = useDeleteEvent();

  // Filter by search
  const filteredEvents = useMemo(() => {
    if (!searchText) return events;
    const search = searchText.toLowerCase();
    return events.filter((event: any) =>
      event.title?.toLowerCase().includes(search) ||
      event.albumTitle?.toLowerCase().includes(search) ||
      event.albumArtist?.toLowerCase().includes(search)
    );
  }, [events, searchText]);

  // Stats
  const stats = useMemo(() => {
    const total = events.length;
    const visible = events.filter((e: any) => e.isVisible).length;
    const ongoing = events.filter((e: any) => !e.isFinished).length;
    const finished = events.filter((e: any) => e.isFinished).length;
    return { total, visible, ongoing, finished };
  }, [events]);

  const handleDeleteClick = (id: number, title: string) => {
    setDeleteDialog({ open: true, eventId: id, eventTitle: title });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.eventId) return;
    setIsDeleting(true);
    try {
      await deleteEventMutation.mutateAsync(deleteDialog.eventId);
      showSnackbar('행사가 삭제되었습니다.', 'success');
      setDeleteDialog({ open: false, eventId: null, eventTitle: '' });
      refetch();
    } catch (error: any) {
      showSnackbar(error?.message || '삭제에 실패했습니다.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70, headerAlign: 'center', align: 'center' },
    {
      field: 'title',
      headerName: '행사명',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 1 }}>
          <Typography variant="body2" fontWeight={500} noWrap>
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {params.row.albumTitle}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'albumArtist',
      headerName: '아티스트',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'purchaseAlbumPrice',
      headerName: '매입가',
      width: 110,
      headerAlign: 'right',
      align: 'right',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={500}>
          {params.value?.toLocaleString() || 0}원
        </Typography>
      ),
    },
    { field: 'eventDate', headerName: '행사일', width: 110, headerAlign: 'center', align: 'center' },
    { field: 'deadlineForArrivalDate', headerName: '마감일', width: 110, headerAlign: 'center', align: 'center' },
    {
      field: 'isVisible',
      headerName: '공개',
      width: 90,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) =>
        params.value ? (
          <Chip icon={<VisibilityIcon sx={{ fontSize: 16 }} />} label="공개" size="small" color="success" variant="outlined" />
        ) : (
          <Chip icon={<VisibilityOffIcon sx={{ fontSize: 16 }} />} label="비공개" size="small" color="default" variant="outlined" />
        ),
    },
    {
      field: 'isFinished',
      headerName: '상태',
      width: 100,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) =>
        params.value ? (
          <Chip label="종료" size="small" color="default" />
        ) : (
          <Chip label="진행중" size="small" color="primary" />
        ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 120,
      sortable: false,
      filterable: false,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="상세">
            <IconButton size="small" onClick={() => router.push(`/album-purchase/events/${params.row.id}`)} sx={{ color: 'info.main' }}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="수정">
            <IconButton size="small" onClick={() => router.push(`/album-purchase/events/${params.row.id}/edit`)} sx={{ color: 'primary.main' }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="삭제">
            <IconButton size="small" onClick={() => handleDeleteClick(params.row.id, params.row.title)} sx={{ color: 'error.main' }}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const rows = filteredEvents.map((event: any) => ({
    id: event.id,
    title: event.title,
    albumTitle: event.albumTitle,
    albumArtist: event.albumArtist,
    purchaseAlbumPrice: event.purchaseAlbumPrice,
    eventDate: event.eventDate,
    deadlineForArrivalDate: event.deadlineForArrivalDate,
    isVisible: event.isVisible,
    isFinished: event.isFinished,
  }));

  return (
    <Box sx={{ p: 3, bgcolor: 'grey.50', minHeight: 'calc(100vh - 72px)' }}>
      <SnackbarComponent />
      <ListPageHeader
        icon={<EventIcon sx={{ fontSize: 18 }} />}
        title="행사 관리"
        description="등록된 행사 목록을 관리합니다"
        createButtonLabel="행사 등록"
        createButtonHref="/album-purchase/events/create"
      />

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <StatCard title="전체 행사" value={stats.total} icon={<EventIcon />} color="#1976d2" isLoading={isLoading} />
        <StatCard title="공개 행사" value={stats.visible} icon={<VisibilityIcon />} color="#2e7d32" isLoading={isLoading} />
        <StatCard title="진행중" value={stats.ongoing} icon={<PlayCircleIcon />} color="#0288d1" isLoading={isLoading} />
        <StatCard title="종료됨" value={stats.finished} icon={<StopCircleIcon />} color="#757575" isLoading={isLoading} />
      </Box>

      {/* Table Container */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        {/* Search Toolbar */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="행사명, 앨범명, 아티스트 검색"
            size="small"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ minWidth: 280 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            label="공개 여부"
            value={filters.isVisible?.toString() || ''}
            onChange={(e) => setFilters({ ...filters, isVisible: e.target.value === '' ? undefined : e.target.value === 'true' })}
            size="small"
            sx={{ minWidth: 130 }}
          >
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="true">공개</MenuItem>
            <MenuItem value="false">비공개</MenuItem>
          </TextField>
          <TextField
            select
            label="진행 상태"
            value={filters.isFinished?.toString() || ''}
            onChange={(e) => setFilters({ ...filters, isFinished: e.target.value === '' ? undefined : e.target.value === 'true' })}
            size="small"
            sx={{ minWidth: 130 }}
          >
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="false">진행중</MenuItem>
            <MenuItem value="true">종료됨</MenuItem>
          </TextField>
          <Box sx={{ flex: 1 }} />
          <Tooltip title="새로고침">
            <IconButton onClick={() => refetch()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Data Grid */}
        <DataGrid
          rows={rows}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 20, 50]}
          initialState={{ pagination: { paginationModel: { page: 0, pageSize: 20 } } }}
          disableRowSelectionOnClick
          rowHeight={60}
          sx={dataGridStyles}
          localeText={{ ...dataGridLocaleText, noRowsLabel: '등록된 행사가 없습니다' }}
        />
      </Paper>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => !isDeleting && setDeleteDialog({ open: false, eventId: null, eventTitle: '' })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon color="warning" />
          행사 삭제
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            <strong>&quot;{deleteDialog.eventTitle}&quot;</strong> 행사를 삭제하시겠습니까?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialog({ open: false, eventId: null, eventTitle: '' })} disabled={isDeleting}>
            취소
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
