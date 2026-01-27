'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
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
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import {
  useGetSettlements,
  useGetEligibleRequests,
  useCreateSettlements,
} from '@/query/query/album-purchase/settlements';
import type { SettlementStatus } from '@/types/albumPurchase';
import { useSnackbar } from '../_components/useSnackbar';
import ListPageHeader from '../_components/ListPageHeader';
import StatCard from '../_components/StatCard';
import { dataGridStyles, dataGridLocaleText } from '../_components/dataGridStyles';

const statusLabels: Record<SettlementStatus, string> = {
  PENDING: '정산대기',
  IN_PROGRESS: '정산진행중',
  COMPLETED: '정산완료',
  CANCELLED: '정산취소',
  HOLD: '정산보류',
};

const getStatusColor = (status: SettlementStatus) => {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'IN_PROGRESS':
      return 'info';
    case 'PENDING':
      return 'warning';
    case 'CANCELLED':
      return 'error';
    case 'HOLD':
      return 'default';
    default:
      return 'default';
  }
};

function EligibleRequestsTable({
  selectedRequestIds,
  onSelectionChange,
}: {
  selectedRequestIds: number[];
  onSelectionChange: (ids: number[]) => void;
}) {
  const { data: eligibleRequests, isLoading } = useGetEligibleRequests();

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
      field: 'totalEvaluatedPrice',
      headerName: '평가 금액',
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
      field: 'finishReviewAt',
      headerName: '검수 완료일',
      width: 110,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value ? new Date(params.value).toLocaleDateString() : '-'}
        </Typography>
      ),
    },
    { field: 'bankName', headerName: '은행', width: 100 },
    { field: 'bankAccountNumber', headerName: '계좌번호', width: 150 },
  ];

  const rows = (eligibleRequests || []).map((request: any) => ({
    id: request.requestId,
    requestId: request.requestId,
    userName: request.userName,
    userEmail: request.userEmail,
    totalEvaluatedPrice: request.totalEvaluatedPrice,
    finishReviewAt: request.finishReviewAt,
    bankName: request.bankName,
    bankAccountNumber: request.bankAccountNumber,
  }));

  const selectionModel = useMemo(() => ({
    type: 'include' as const,
    ids: new Set(selectedRequestIds.map(id => id as any)),
  }), [selectedRequestIds]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      pageSizeOptions={[10, 20, 50]}
      initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
      checkboxSelection
      rowSelectionModel={selectionModel}
      onRowSelectionModelChange={(newSelection) => {
        if (newSelection.type === 'include') {
          onSelectionChange(Array.from(newSelection.ids) as number[]);
        }
      }}
      disableRowSelectionOnClick
      rowHeight={60}
      sx={dataGridStyles}
      localeText={{ ...dataGridLocaleText, noRowsLabel: '정산 대상이 없습니다' }}
    />
  );
}

export default function SettlementsPage() {
  const router = useRouter();
  const { showSnackbar, SnackbarComponent } = useSnackbar();
  const [statusFilter, setStatusFilter] = useState<SettlementStatus | undefined>();
  const [searchText, setSearchText] = useState('');
  const [selectedRequestIds, setSelectedRequestIds] = useState<number[]>([]);

  const { data: eligibleRequests = [], refetch: refetchEligible } = useGetEligibleRequests();
  const { data: settlements = [], isLoading, refetch } = useGetSettlements({ status: statusFilter });
  const createMutation = useCreateSettlements();

  // Filter settlements by search
  const filteredSettlements = useMemo(() => {
    if (!searchText) return settlements;
    const search = searchText.toLowerCase();
    return settlements.filter((settlement: any) =>
      settlement.userName?.toLowerCase().includes(search) ||
      settlement.userEmail?.toLowerCase().includes(search)
    );
  }, [settlements, searchText]);

  // Stats
  const stats = useMemo(() => {
    const total = settlements.length;
    const pending = settlements.filter((s: any) => s.status === 'PENDING').length;
    const completed = settlements.filter((s: any) => s.status === 'COMPLETED').length;
    const eligible = eligibleRequests.length;
    return { total, pending, completed, eligible };
  }, [settlements, eligibleRequests]);

  // Excel 다운로드
  const handleDownloadExcel = useCallback(() => {
    if (filteredSettlements.length === 0) {
      return;
    }

    const data = [
      ['정산ID', '신청자', '이메일', '정산금액', '정산일', '상태', '은행', '계좌번호'],
      ...filteredSettlements.map((s: any) => [
        s.id,
        s.userName,
        s.userEmail,
        s.finalAmount,
        s.settlementDate,
        statusLabels[s.status as SettlementStatus] || s.status,
        s.bankName || '',
        s.accountNumber || '',
      ]),
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // 컬럼 너비 설정
    worksheet['!cols'] = [
      { wch: 10 }, // 정산ID
      { wch: 15 }, // 신청자
      { wch: 25 }, // 이메일
      { wch: 15 }, // 정산금액
      { wch: 12 }, // 정산일
      { wch: 12 }, // 상태
      { wch: 15 }, // 은행
      { wch: 20 }, // 계좌번호
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, '정산목록');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const excelFile = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });

    const fileName = `정산목록_${statusFilter ? statusLabels[statusFilter] : '전체'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    saveAs(excelFile, fileName);
  }, [filteredSettlements, statusFilter]);

  const handleCreateSettlements = async () => {
    if (selectedRequestIds.length === 0) {
      showSnackbar('정산할 신청을 선택해주세요.', 'warning');
      return;
    }

    if (confirm(`${selectedRequestIds.length}건의 정산을 생성하시겠습니까?`)) {
      try {
        await createMutation.mutateAsync({
          requestIds: selectedRequestIds,
          processedBy: 'admin',
        });
        showSnackbar('정산이 생성되었습니다.', 'success');
        setSelectedRequestIds([]);
        refetchEligible();
        refetch();
      } catch (error: any) {
        showSnackbar(error?.message || '정산 생성에 실패했습니다.', 'error');
      }
    }
  };

  const settlementColumns: GridColDef[] = [
    { field: 'id', headerName: '정산 ID', width: 90, headerAlign: 'center', align: 'center' },
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
      field: 'finalAmount',
      headerName: '정산 금액',
      width: 130,
      headerAlign: 'right',
      align: 'right',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} color="primary.main">
          {params.value?.toLocaleString() || 0}원
        </Typography>
      ),
    },
    {
      field: 'bankName',
      headerName: '은행',
      width: 100,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'accountNumber',
      headerName: '계좌번호',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'settlementDate',
      headerName: '정산일',
      width: 110,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: '상태',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => {
        const status = params.value as SettlementStatus;
        return <Chip label={statusLabels[status] || status} color={getStatusColor(status)} size="small" />;
      },
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
          <IconButton size="small" onClick={() => router.push(`/album-purchase/settlements/${params.row.id}`)} sx={{ color: 'primary.main' }}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const settlementRows = filteredSettlements.map((settlement: any) => ({
    id: settlement.id,
    userName: settlement.userName,
    userEmail: settlement.userEmail,
    finalAmount: settlement.finalAmount,
    bankName: settlement.bankName,
    accountNumber: settlement.accountNumber,
    settlementDate: settlement.settlementDate,
    status: settlement.status,
  }));

  return (
    <Box sx={{ p: 3, bgcolor: 'grey.50', minHeight: 'calc(100vh - 72px)' }}>
      <SnackbarComponent />
      <ListPageHeader
        icon={<AccountBalanceWalletIcon sx={{ fontSize: 18 }} />}
        title="정산 관리"
        description="매입 신청의 정산을 생성하고 관리합니다"
      />

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <StatCard title="정산 대기" value={stats.eligible} icon={<HourglassEmptyIcon />} color="#ed6c02" isLoading={isLoading} />
        <StatCard title="전체 정산" value={stats.total} icon={<AccountBalanceWalletIcon />} color="#1976d2" isLoading={isLoading} />
        <StatCard title="대기중" value={stats.pending} icon={<PendingActionsIcon />} color="#9c27b0" isLoading={isLoading} />
        <StatCard title="정산 완료" value={stats.completed} icon={<CheckCircleIcon />} color="#2e7d32" isLoading={isLoading} />
      </Box>

      {/* 정산 대상 */}
      {eligibleRequests.length > 0 && (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', mb: 3 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'warning.50' }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={600} color="warning.dark">
                정산 대상 ({eligibleRequests.length}건)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                검수가 완료되어 정산 대기 중인 신청입니다
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={handleCreateSettlements}
              disabled={selectedRequestIds.length === 0 || createMutation.isPending}
              startIcon={createMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
            >
              {createMutation.isPending ? '생성 중...' : `정산 생성 (${selectedRequestIds.length}건)`}
            </Button>
          </Box>
          <Box sx={{ p: 2 }}>
            <EligibleRequestsTable selectedRequestIds={selectedRequestIds} onSelectionChange={setSelectedRequestIds} />
          </Box>
        </Paper>
      )}

      {/* 정산 목록 */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        {/* Search Toolbar */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={600}>
            정산 목록
          </Typography>
          <Box sx={{ flex: 1 }} />
          <TextField
            placeholder="신청자, 이메일 검색"
            size="small"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ minWidth: 220 }}
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
            onChange={(e) => setStatusFilter(e.target.value ? (e.target.value as SettlementStatus) : undefined)}
            size="small"
            sx={{ minWidth: 130 }}
          >
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="PENDING">정산대기</MenuItem>
            <MenuItem value="IN_PROGRESS">정산진행중</MenuItem>
            <MenuItem value="COMPLETED">정산완료</MenuItem>
            <MenuItem value="CANCELLED">정산취소</MenuItem>
            <MenuItem value="HOLD">정산보류</MenuItem>
          </TextField>
          <Tooltip title="새로고침">
            <IconButton onClick={() => refetch()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadExcel}
            disabled={filteredSettlements.length === 0}
            sx={{ fontWeight: 600, borderRadius: 2 }}
          >
            엑셀 다운로드
          </Button>
        </Box>

        {/* Data Grid */}
        <DataGrid
          rows={settlementRows}
          columns={settlementColumns}
          loading={isLoading}
          pageSizeOptions={[10, 20, 50]}
          initialState={{ pagination: { paginationModel: { page: 0, pageSize: 20 } } }}
          disableRowSelectionOnClick
          rowHeight={60}
          sx={dataGridStyles}
          localeText={{ ...dataGridLocaleText, noRowsLabel: '정산 내역이 없습니다' }}
        />
      </Paper>
    </Box>
  );
}
