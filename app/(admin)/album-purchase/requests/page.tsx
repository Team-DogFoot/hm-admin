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
import Select from '@mui/material/Select';
import CircularProgress from '@mui/material/CircularProgress';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { useGetRequests, useUpdateRequestStatus } from '@/query/query/album-purchase/requests';
import type { PurchaseRequestStatus } from '@/types/albumPurchase';
import ListPageHeader from '../_components/ListPageHeader';
import StatCard from '../_components/StatCard';
import { dataGridStyles, dataGridLocaleText } from '../_components/dataGridStyles';
import { useSnackbar } from '../_components/useSnackbar';

const statusLabels: Record<PurchaseRequestStatus, string> = {
  DRAFT: '초안',
  NEED_NEGOTIATION: '가격조정필요',
  SUBMITTED: '접수완료',
  SHIPPED: '배송중',
  COMPLETE_TRACKING_NUMBER: '송장입력완료',
  RECEIVED_AND_MATCHED: '수령완료',
  REVIEWING: '검수중',
  FINAL_NEGOTIATION: '최종협상',
  FINISH_REVIEW: '검수완료',
  PENDING_SETTLEMENT: '정산대기',
  SETTLEMENT_COMPLETED: '정산완료',
};

const getStatusColor = (status: PurchaseRequestStatus) => {
  switch (status) {
    case 'NEED_NEGOTIATION':
    case 'FINAL_NEGOTIATION':
      return 'warning';
    case 'SETTLEMENT_COMPLETED':
      return 'success';
    case 'SUBMITTED':
    case 'SHIPPED':
    case 'COMPLETE_TRACKING_NUMBER':
      return 'info';
    case 'REVIEWING':
    case 'FINISH_REVIEW':
      return 'secondary';
    case 'PENDING_SETTLEMENT':
      return 'primary';
    default:
      return 'default';
  }
};

// 상태 전이 규칙 (백엔드와 동일하게 유지)
const getAllowedTransitions = (status: PurchaseRequestStatus): PurchaseRequestStatus[] => {
  switch (status) {
    case 'DRAFT':
      return ['SUBMITTED', 'NEED_NEGOTIATION'];
    case 'NEED_NEGOTIATION':
      return ['SUBMITTED', 'FINAL_NEGOTIATION'];
    case 'SUBMITTED':
      return ['SHIPPED'];
    case 'SHIPPED':
      return ['COMPLETE_TRACKING_NUMBER'];
    case 'COMPLETE_TRACKING_NUMBER':
      return ['RECEIVED_AND_MATCHED'];
    case 'RECEIVED_AND_MATCHED':
      return ['REVIEWING'];
    case 'REVIEWING':
      return ['FINISH_REVIEW', 'FINAL_NEGOTIATION'];
    case 'FINAL_NEGOTIATION':
      return ['SUBMITTED', 'FINISH_REVIEW'];
    case 'FINISH_REVIEW':
      return ['PENDING_SETTLEMENT'];
    case 'PENDING_SETTLEMENT':
      return ['SETTLEMENT_COMPLETED'];
    case 'SETTLEMENT_COMPLETED':
      return [];
    default:
      return [];
  }
};

export default function RequestsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<PurchaseRequestStatus | undefined>();
  const [searchText, setSearchText] = useState('');
  const [hasNeedNegotiation, setHasNeedNegotiation] = useState(false);
  const [updatingRequestId, setUpdatingRequestId] = useState<number | null>(null);
  const { showSnackbar, SnackbarComponent } = useSnackbar();

  const { data: requests = [], isLoading, refetch } = useGetRequests({
    status: statusFilter,
    hasNeedNegotiation: hasNeedNegotiation || undefined,
  });

  const updateStatusMutation = useUpdateRequestStatus();

  const handleStatusChange = async (requestId: number, newStatus: PurchaseRequestStatus) => {
    if (!confirm(`상태를 '${statusLabels[newStatus]}'(으)로 변경하시겠습니까?`)) {
      return;
    }

    setUpdatingRequestId(requestId);
    try {
      await updateStatusMutation.mutateAsync({
        requestId,
        requestData: { status: newStatus },
      });
      showSnackbar(`상태가 '${statusLabels[newStatus]}'(으)로 변경되었습니다.`, 'success');
    } catch (error: any) {
      showSnackbar(error?.message || '상태 변경에 실패했습니다.', 'error');
    } finally {
      setUpdatingRequestId(null);
    }
  };

  // Filter by search
  const filteredRequests = useMemo(() => {
    if (!searchText) return requests;
    const search = searchText.toLowerCase();
    return requests.filter((request: any) =>
      request.userName?.toLowerCase().includes(search) ||
      request.userEmail?.toLowerCase().includes(search) ||
      request.phoneNumber?.includes(search) ||
      request.eventTitle?.toLowerCase().includes(search) ||
      request.albumTitle?.toLowerCase().includes(search)
    );
  }, [requests, searchText]);

  // Stats
  const stats = useMemo(() => {
    const total = requests.length;
    const needsAction = requests.filter((r: any) => r.status === 'NEED_NEGOTIATION' || r.status === 'FINAL_NEGOTIATION').length;
    const inProgress = requests.filter((r: any) => ['SUBMITTED', 'SHIPPED', 'COMPLETE_TRACKING_NUMBER', 'RECEIVED_AND_MATCHED', 'REVIEWING'].includes(r.status)).length;
    const completed = requests.filter((r: any) => r.status === 'SETTLEMENT_COMPLETED').length;
    return { total, needsAction, inProgress, completed };
  }, [requests]);

  const columns: GridColDef[] = [
    { field: 'requestId', headerName: '신청 ID', width: 90, headerAlign: 'center', align: 'center' },
    {
      field: 'userName',
      headerName: '신청자',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 1 }}>
          <Typography variant="body2" fontWeight={500}>
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {params.row.userEmail}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'phoneNumber',
      headerName: '연락처',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'eventTitle',
      headerName: '행사/앨범',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 1 }}>
          <Typography variant="body2" fontWeight={500} noWrap>
            {params.value || '-'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {params.row.albumTitle || '-'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'itemCount',
      headerName: '수량',
      width: 80,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Chip label={`${params.value || 0}개`} size="small" variant="outlined" />
      ),
    },
    {
      field: 'totalEvaluatedPrice',
      headerName: '총 금액',
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
      field: 'status',
      headerName: '상태',
      width: 160,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => {
        const status = params.value as PurchaseRequestStatus;
        const requestId = params.row.requestId;
        const allowedTransitions = getAllowedTransitions(status);
        const isUpdating = updatingRequestId === requestId;

        if (allowedTransitions.length === 0) {
          return <Chip label={statusLabels[status] || status} color={getStatusColor(status)} size="small" />;
        }

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isUpdating ? (
              <CircularProgress size={20} />
            ) : (
              <Select
                value={status}
                size="small"
                onChange={(e) => handleStatusChange(requestId, e.target.value as PurchaseRequestStatus)}
                sx={{
                  minWidth: 130,
                  height: 32,
                  '& .MuiSelect-select': {
                    py: 0.5,
                    fontSize: '0.8125rem',
                  },
                }}
                renderValue={(value) => (
                  <Chip
                    label={statusLabels[value] || value}
                    color={getStatusColor(value)}
                    size="small"
                    sx={{ height: 24 }}
                  />
                )}
              >
                <MenuItem value={status} disabled>
                  {statusLabels[status]} (현재)
                </MenuItem>
                {allowedTransitions.map((nextStatus) => (
                  <MenuItem key={nextStatus} value={nextStatus}>
                    → {statusLabels[nextStatus]}
                  </MenuItem>
                ))}
              </Select>
            )}
          </Box>
        );
      },
    },
    {
      field: 'createdAt',
      headerName: '신청일',
      width: 110,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value ? new Date(params.value).toLocaleDateString() : '-'}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 80,
      sortable: false,
      filterable: false,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Tooltip title="상세보기">
          <IconButton size="small" onClick={() => router.push(`/album-purchase/requests/${params.row.requestId}`)} sx={{ color: 'primary.main' }}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const rows = filteredRequests.map((request: any) => ({
    id: request.requestId,
    requestId: request.requestId,
    userName: request.userName,
    userEmail: request.userEmail,
    phoneNumber: request.phoneNumber,
    eventTitle: request.eventTitle,
    albumTitle: request.albumTitle,
    itemCount: request.itemCount,
    totalEvaluatedPrice: request.totalEvaluatedPrice,
    status: request.status,
    createdAt: request.createdAt,
  }));

  return (
    <Box sx={{ p: 3, bgcolor: 'grey.50', minHeight: 'calc(100vh - 72px)' }}>
      <SnackbarComponent />
      <ListPageHeader
        icon={<AssignmentIcon sx={{ fontSize: 18 }} />}
        title="매입 신청 관리"
        description="매입 신청 목록을 조회하고 관리합니다"
      />

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <StatCard title="전체 신청" value={stats.total} icon={<AssignmentIcon />} color="#1976d2" isLoading={isLoading} />
        <StatCard title="조치 필요" value={stats.needsAction} icon={<WarningIcon />} color="#ed6c02" isLoading={isLoading} />
        <StatCard title="처리중" value={stats.inProgress} icon={<LocalShippingIcon />} color="#0288d1" isLoading={isLoading} />
        <StatCard title="정산 완료" value={stats.completed} icon={<CheckCircleIcon />} color="#2e7d32" isLoading={isLoading} />
      </Box>

      {/* Table Container */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        {/* Search Toolbar */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="신청자, 이메일, 연락처, 행사명 검색"
            size="small"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ minWidth: 300 }}
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
            label="상태"
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value ? (e.target.value as PurchaseRequestStatus) : undefined)}
            size="small"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="NEED_NEGOTIATION">가격조정필요</MenuItem>
            <MenuItem value="SUBMITTED">접수완료</MenuItem>
            <MenuItem value="SHIPPED">배송중</MenuItem>
            <MenuItem value="RECEIVED_AND_MATCHED">수령완료</MenuItem>
            <MenuItem value="REVIEWING">검수중</MenuItem>
            <MenuItem value="FINISH_REVIEW">검수완료</MenuItem>
            <MenuItem value="PENDING_SETTLEMENT">정산대기</MenuItem>
            <MenuItem value="SETTLEMENT_COMPLETED">정산완료</MenuItem>
          </TextField>
          <FormControlLabel
            control={
              <Switch
                checked={hasNeedNegotiation}
                onChange={(e) => setHasNeedNegotiation(e.target.checked)}
                color="warning"
              />
            }
            label="조정필요 아이템 포함"
            sx={{ ml: 1 }}
          />
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
          localeText={{ ...dataGridLocaleText, noRowsLabel: '매입 신청이 없습니다' }}
        />
      </Paper>
    </Box>
  );
}
