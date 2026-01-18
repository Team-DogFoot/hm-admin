'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Radio from '@mui/material/Radio';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Link from 'next/link';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';
import SearchIcon from '@mui/icons-material/Search';
import {
  useScanReceipt,
  useGetReceipts,
  useGetUnmatchedReceipts,
  useMatchUnmatchedReceipt,
  useSearchRequests,
  useUnmatchReceipt,
} from '@/query/query/album-purchase/receipts';
import { useGetRequestDetail } from '@/query/query/album-purchase/requests';
import type {
  ScanReceiptResponse,
  ShippingInfo,
  UnmatchedReceiptDetail,
  AlbumPurchaseRequestDetail,
  TrackingNumberInfo,
} from '@/types/albumPurchase';
import { useSnackbar } from '../_components/useSnackbar';
import {
  SHIPPING_COMPANIES,
  ShippingCompanyValue,
} from '@/constants/shippingCompanies';
import ListPageHeader from '../_components/ListPageHeader';
import StatCard from '../_components/StatCard';
import { dataGridStyles, dataGridLocaleText } from '../_components/dataGridStyles';

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : '-';
}

function MatchedReceiptsTable({
  receipts,
  isLoading,
  onUnmatchRequest,
}: {
  receipts: ShippingInfo[];
  isLoading: boolean;
  onUnmatchRequest: (receipt: ShippingInfo) => void;
}) {
  const columns = useMemo<GridColDef[]>(
    () => [
      { field: 'shippingId', headerName: 'ID', width: 70, headerAlign: 'center', align: 'center' },
      { field: 'trackingNumber', headerName: '송장번호', flex: 1, minWidth: 150 },
      { field: 'shippingCompany', headerName: '택배사', width: 100 },
      { field: 'actualQuantity', headerName: '수량', width: 70, headerAlign: 'center', align: 'center' },
      { field: 'requestId', headerName: '신청 ID', width: 90, headerAlign: 'center', align: 'center' },
      {
        field: 'receivedAt',
        headerName: '수령일',
        width: 160,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary">
            {formatDateTime(params.value)}
          </Typography>
        ),
      },
      { field: 'receivedBy', headerName: '수령자', width: 100 },
      {
        field: 'requestDetail',
        headerName: '신청 상세',
        width: 100,
        renderCell: (params) => (
          <Button
            component={Link}
            href={params.row.requestId ? `/album-purchase/requests/${params.row.requestId}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            variant="text"
            disabled={!params.row.requestId}
          >
            상세보기
          </Button>
        ),
      },
      {
        field: 'actions',
        headerName: '',
        width: 100,
        renderCell: (params) => {
          const disabled = !params.row.matchedReceiptId;
          return (
            <Tooltip title={disabled ? '미매칭 수령 건과 연결되지 않은 송장입니다.' : '매칭 해제'}>
              <span>
                <Button variant="outlined" size="small" disabled={disabled} onClick={() => onUnmatchRequest(params.row)}>
                  매칭 해제
                </Button>
              </span>
            </Tooltip>
          );
        },
      },
    ],
    [onUnmatchRequest]
  );

  return (
    <DataGrid
      rows={(receipts || []).map((receipt) => ({ id: receipt.shippingId || receipt.requestId, ...receipt }))}
      columns={columns}
      pageSizeOptions={[10, 20, 50]}
      initialState={{ pagination: { paginationModel: { page: 0, pageSize: 20 } } }}
      loading={isLoading}
      disableRowSelectionOnClick
      rowHeight={52}
      sx={dataGridStyles}
      localeText={{ ...dataGridLocaleText, noRowsLabel: '매칭된 수령 건이 없습니다' }}
    />
  );
}

function UnmatchedReceiptsTable({
  receipts,
  isLoading,
  selectedUnmatchedId,
  onSelectUnmatched,
}: {
  receipts: UnmatchedReceiptDetail[];
  isLoading: boolean;
  selectedUnmatchedId: number | null;
  onSelectUnmatched: (id: number | null) => void;
}) {
  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'select',
        headerName: '',
        width: 60,
        renderCell: (params) => (
          <Radio
            checked={selectedUnmatchedId === params.row.id}
            onChange={() => onSelectUnmatched(selectedUnmatchedId === params.row.id ? null : params.row.id)}
          />
        ),
      },
      { field: 'id', headerName: 'ID', width: 70, headerAlign: 'center', align: 'center' },
      { field: 'trackingNumber', headerName: '송장번호', flex: 1, minWidth: 150 },
      { field: 'shippingCompany', headerName: '택배사', width: 100 },
      {
        field: 'receivedAt',
        headerName: '수령일',
        width: 160,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary">
            {formatDateTime(params.value)}
          </Typography>
        ),
      },
      { field: 'receivedBy', headerName: '수령자', width: 100 },
      { field: 'memo', headerName: '메모', flex: 0.8, minWidth: 120 },
    ],
    [onSelectUnmatched, selectedUnmatchedId]
  );

  return (
    <DataGrid
      rows={(receipts || []).map((receipt) => ({
        id: receipt.id,
        trackingNumber: receipt.trackingNumber,
        shippingCompany: receipt.shippingCompany,
        receivedAt: receipt.receivedAt,
        receivedBy: receipt.receivedBy,
        memo: receipt.memo,
      }))}
      columns={columns}
      pageSizeOptions={[10, 20, 50]}
      initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
      loading={isLoading}
      disableRowSelectionOnClick
      rowHeight={52}
      sx={dataGridStyles}
      localeText={{ ...dataGridLocaleText, noRowsLabel: '미매칭 수령 건이 없습니다' }}
    />
  );
}

function SearchRequestsTable({
  searchKeyword,
  selectedRequestId,
  onSelectRequest,
}: {
  searchKeyword: string;
  selectedRequestId: number | null;
  onSelectRequest: (id: number | null) => void;
}) {
  const debouncedKeyword = useDebouncedValue(searchKeyword.trim(), 400);
  const { data: searchResults, isLoading } = useSearchRequests(debouncedKeyword);

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'select',
        headerName: '',
        width: 60,
        renderCell: (params) => (
          <Radio
            checked={selectedRequestId === params.row.requestId}
            onChange={() => onSelectRequest(selectedRequestId === params.row.requestId ? null : params.row.requestId)}
          />
        ),
      },
      { field: 'requestId', headerName: '신청 ID', width: 80, headerAlign: 'center', align: 'center' },
      { field: 'userName', headerName: '신청자', width: 90 },
      { field: 'userEmail', headerName: '이메일', flex: 1, minWidth: 160 },
      { field: 'phoneNumber', headerName: '연락처', width: 120 },
      { field: 'eventTitle', headerName: '행사명', flex: 0.8, minWidth: 130 },
    ],
    [onSelectRequest, selectedRequestId]
  );

  return (
    <DataGrid
      rows={(searchResults || []).map((request: any) => ({
        id: request.requestId,
        requestId: request.requestId,
        userName: request.userName,
        userEmail: request.userEmail,
        phoneNumber: request.phoneNumber,
        eventTitle: request.eventTitle,
      }))}
      columns={columns}
      pageSizeOptions={[5, 10, 20]}
      initialState={{ pagination: { paginationModel: { page: 0, pageSize: 5 } } }}
      loading={isLoading}
      disableRowSelectionOnClick
      rowHeight={48}
      sx={dataGridStyles}
      localeText={{ ...dataGridLocaleText, noRowsLabel: '검색 결과가 없습니다' }}
    />
  );
}

function TrackingNumbersList({
  trackingNumbers,
  highlightTrackingNumber,
}: {
  trackingNumbers?: TrackingNumberInfo[];
  highlightTrackingNumber?: string;
}) {
  if (!trackingNumbers?.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        등록된 송장 정보가 없습니다.
      </Typography>
    );
  }

  return (
    <Stack direction="row" flexWrap="wrap" gap={1}>
      {trackingNumbers.map((tracking) => {
        const isHighlight = highlightTrackingNumber === tracking.trackingNumber;
        return (
          <Chip
            key={tracking.trackingNumberId}
            size="small"
            label={`${tracking.trackingNumber} · ${tracking.shippingCompany}`}
            color={isHighlight ? 'secondary' : tracking.isMatched ? 'default' : 'warning'}
            variant={tracking.isMatched ? 'outlined' : 'filled'}
            sx={{ fontWeight: isHighlight ? 600 : undefined }}
          />
        );
      })}
    </Stack>
  );
}

function MatchContextPanel({
  unmatchedReceipt,
  requestDetail,
  requestLoading,
  onClearRequest,
}: {
  unmatchedReceipt: UnmatchedReceiptDetail | undefined;
  requestDetail: AlbumPurchaseRequestDetail | undefined;
  requestLoading: boolean;
  onClearRequest: () => void;
}) {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2 }}>
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              선택된 미매칭 송장
            </Typography>
            {unmatchedReceipt ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-start">
                <Chip color="primary" label={`송장번호 ${unmatchedReceipt.trackingNumber}`} size="small" />
                <Chip variant="outlined" label={`택배사 ${unmatchedReceipt.shippingCompany}`} size="small" />
                <Chip variant="outlined" label={`수령일 ${formatDateTime(unmatchedReceipt.receivedAt)}`} size="small" />
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                미매칭 송장을 선택하면 상세 정보가 표시됩니다.
              </Typography>
            )}
          </Box>

          <Divider />

          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                매칭할 매입 신청
              </Typography>
              {requestDetail && (
                <Stack direction="row" spacing={1}>
                  <Button
                    component={Link}
                    href={`/album-purchase/requests/${requestDetail.requestId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                  >
                    상세 보기
                  </Button>
                  <Button size="small" onClick={onClearRequest}>
                    선택 해제
                  </Button>
                </Stack>
              )}
            </Stack>

            {requestLoading && <LinearProgress sx={{ my: 1 }} />}

            {!requestDetail && !requestLoading && (
              <Typography variant="body2" color="text.secondary">
                신청을 선택하면 등록된 송장 정보를 바로 확인할 수 있습니다.
              </Typography>
            )}

            {requestDetail && (
              <Stack spacing={1}>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    #{requestDetail.requestId} · {requestDetail.userName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {requestDetail.userEmail} · {requestDetail.phoneNumber || '연락처 없음'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    등록된 송장번호
                  </Typography>
                  <TrackingNumbersList
                    trackingNumbers={requestDetail.trackingNumbers}
                    highlightTrackingNumber={unmatchedReceipt?.trackingNumber}
                  />
                </Box>
              </Stack>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function ReceiptsPage() {
  const { showSnackbar, SnackbarComponent } = useSnackbar();
  const [tabValue, setTabValue] = useState<'matched' | 'unmatched'>('matched');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingCompany, setShippingCompany] = useState<ShippingCompanyValue | ''>('');
  const [receivedBy, setReceivedBy] = useState('admin');
  const [scanMemo, setScanMemo] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedUnmatchedId, setSelectedUnmatchedId] = useState<number | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [unmatchDialog, setUnmatchDialog] = useState<{ open: boolean; receipt: ShippingInfo | null; reason: string }>({
    open: false,
    receipt: null,
    reason: '',
  });

  const receiptsQuery = useGetReceipts({ isReceived: true });
  const unmatchedQuery = useGetUnmatchedReceipts({ isMatched: false });
  const { data: selectedRequestDetail, isFetching: isRequestDetailLoading, refetch: refetchRequestDetail } = useGetRequestDetail(
    selectedRequestId ?? undefined
  );
  const selectedUnmatchedReceipt = useMemo(
    () => unmatchedQuery.data?.find((receipt) => receipt.id === selectedUnmatchedId),
    [selectedUnmatchedId, unmatchedQuery.data]
  );

  const scanMutation = useScanReceipt();
  const matchMutation = useMatchUnmatchedReceipt();
  const unmatchMutation = useUnmatchReceipt();
  const operatorName = receivedBy || 'admin';

  // Stats
  const stats = useMemo(() => {
    const matched = receiptsQuery.data?.length || 0;
    const unmatched = unmatchedQuery.data?.length || 0;
    return { matched, unmatched, total: matched + unmatched };
  }, [receiptsQuery.data, unmatchedQuery.data]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber || !shippingCompany) {
      showSnackbar('송장번호와 택배사를 입력해주세요.', 'warning');
      return;
    }

    try {
      const result: ScanReceiptResponse = await scanMutation.mutateAsync({
        trackingNumber,
        shippingCompany,
        receivedBy: operatorName,
        memo: scanMemo || undefined,
      });

      if (result.matched) {
        showSnackbar(`매칭 성공! 매입 신청 ID: ${result.requestId}`, 'success');
      } else {
        showSnackbar('미매칭 수령 건으로 등록되었습니다.', 'info');
        setTabValue('unmatched');
      }

      setTrackingNumber('');
      setScanMemo('');
      receiptsQuery.refetch();
      unmatchedQuery.refetch();
    } catch (error: any) {
      showSnackbar(error?.message || '스캔에 실패했습니다.', 'error');
    }
  };

  const handleMatch = async () => {
    if (!selectedUnmatchedId || !selectedRequestId) {
      showSnackbar('미매칭 수령 건과 매입 신청을 선택해주세요.', 'warning');
      return;
    }

    try {
      await matchMutation.mutateAsync({
        unmatchedReceiptId: selectedUnmatchedId,
        requestData: {
          requestId: selectedRequestId,
          matchedBy: operatorName,
          trackingNumber: selectedUnmatchedReceipt?.trackingNumber,
        },
      });
      showSnackbar('매칭 완료!', 'success');
      setSelectedUnmatchedId(null);
      receiptsQuery.refetch();
      unmatchedQuery.refetch();
      if (selectedRequestId) refetchRequestDetail();
    } catch (error: any) {
      showSnackbar(error?.message || '매칭에 실패했습니다.', 'error');
    }
  };

  const handleRequestUnmatch = useCallback((receipt: ShippingInfo) => {
    setUnmatchDialog({ open: true, receipt, reason: '' });
  }, []);

  const handleConfirmUnmatch = async () => {
    if (!unmatchDialog.receipt?.matchedReceiptId) {
      setUnmatchDialog({ open: false, receipt: null, reason: '' });
      return;
    }

    try {
      await unmatchMutation.mutateAsync({
        unmatchedReceiptId: unmatchDialog.receipt.matchedReceiptId,
        requestData: { unmatchedBy: operatorName, reason: unmatchDialog.reason || undefined },
      });
      showSnackbar('매칭을 해제했습니다.', 'success');
      setUnmatchDialog({ open: false, receipt: null, reason: '' });
      receiptsQuery.refetch();
      unmatchedQuery.refetch();
      if (unmatchDialog.receipt?.requestId && unmatchDialog.receipt.requestId === selectedRequestId) {
        refetchRequestDetail();
      }
    } catch (error: any) {
      showSnackbar(error?.message || '매칭 해제에 실패했습니다.', 'error');
    }
  };

  const disableMatchButton = !selectedUnmatchedId || !selectedRequestId;

  return (
    <Box sx={{ p: 3, bgcolor: 'grey.50', minHeight: 'calc(100vh - 72px)' }}>
      <SnackbarComponent />
      <ListPageHeader
        icon={<InventoryIcon sx={{ fontSize: 18 }} />}
        title="수령 처리"
        description="송장을 스캔하고 매입 신청과 매칭합니다"
      />

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <StatCard title="전체 수령" value={stats.total} icon={<InventoryIcon />} color="#1976d2" isLoading={receiptsQuery.isLoading} />
        <StatCard title="매칭 완료" value={stats.matched} icon={<LinkIcon />} color="#2e7d32" isLoading={receiptsQuery.isLoading} />
        <StatCard title="미매칭" value={stats.unmatched} icon={<LinkOffIcon />} color="#ed6c02" isLoading={unmatchedQuery.isLoading} />
      </Box>

      {/* 송장 스캔 */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <QrCodeScannerIcon /> 송장 스캔
        </Typography>
        <Stack component="form" direction={{ xs: 'column', md: 'row' }} spacing={2} onSubmit={handleScan}>
          <TextField
            placeholder="송장번호"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            size="small"
            sx={{ flex: 1.5 }}
          />
          <TextField
            select
            placeholder="택배사"
            value={shippingCompany}
            onChange={(e) => setShippingCompany(e.target.value as ShippingCompanyValue | '')}
            size="small"
            sx={{ flex: 1 }}
          >
            <MenuItem value="">택배사 선택</MenuItem>
            {SHIPPING_COMPANIES.map((company) => (
              <MenuItem key={company.value} value={company.value}>
                {company.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField placeholder="수령자" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} size="small" sx={{ flex: 0.8 }} />
          <TextField placeholder="메모" value={scanMemo} onChange={(e) => setScanMemo(e.target.value)} size="small" sx={{ flex: 1 }} />
          <Button
            type="submit"
            variant="contained"
            disabled={scanMutation.isPending}
            startIcon={scanMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <QrCodeScannerIcon />}
            sx={{ minWidth: 120, height: 40 }}
          >
            {scanMutation.isPending ? '처리 중...' : '스캔'}
          </Button>
        </Stack>
      </Paper>

      {/* 탭 */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Tab label={`매칭된 수령 건 (${stats.matched})`} value="matched" />
          <Tab label={`미매칭 수령 건 (${stats.unmatched})`} value="unmatched" />
        </Tabs>

        {/* 매칭된 수령 건 */}
        {tabValue === 'matched' && (
          <Box sx={{ p: 2 }}>
            <MatchedReceiptsTable
              receipts={receiptsQuery.data || []}
              isLoading={receiptsQuery.isLoading}
              onUnmatchRequest={handleRequestUnmatch}
            />
          </Box>
        )}

        {/* 미매칭 수령 건 + 매칭 기능 */}
        {tabValue === 'unmatched' && (
          <Box sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="stretch">
              <Box flex={{ xs: 1, lg: 1.2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  미매칭 수령 건
                </Typography>
                <UnmatchedReceiptsTable
                  receipts={unmatchedQuery.data || []}
                  isLoading={unmatchedQuery.isLoading}
                  selectedUnmatchedId={selectedUnmatchedId}
                  onSelectUnmatched={setSelectedUnmatchedId}
                />
              </Box>
              <Box flex={{ xs: 1, lg: 0.8 }}>
                <MatchContextPanel
                  unmatchedReceipt={selectedUnmatchedReceipt}
                  requestDetail={selectedRequestDetail}
                  requestLoading={isRequestDetailLoading}
                  onClearRequest={() => setSelectedRequestId(null)}
                />

                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  매칭할 매입 신청
                </Typography>
                {!selectedUnmatchedId && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    미매칭 송장을 먼저 선택하면 신청 선택 후 매칭할 수 있습니다.
                  </Alert>
                )}
                <TextField
                  fullWidth
                  placeholder="신청자 이름, 이메일, 연락처로 검색"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  size="small"
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                <Box sx={{ mb: 2 }}>
                  <SearchRequestsTable searchKeyword={searchKeyword} selectedRequestId={selectedRequestId} onSelectRequest={setSelectedRequestId} />
                </Box>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleMatch}
                  disabled={disableMatchButton || matchMutation.isPending}
                  startIcon={matchMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <LinkIcon />}
                >
                  {matchMutation.isPending ? '매칭 중...' : '매칭하기'}
                </Button>
              </Box>
            </Stack>
          </Box>
        )}
      </Paper>

      {/* 매칭 해제 다이얼로그 */}
      <Dialog
        open={unmatchDialog.open}
        onClose={() => setUnmatchDialog({ open: false, receipt: null, reason: '' })}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>매칭 해제</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            선택한 송장의 매칭을 해제하고 다시 미매칭 목록으로 돌려놓습니다.
          </Typography>
          <TextField
            label="해제 사유"
            multiline
            minRows={2}
            value={unmatchDialog.reason}
            onChange={(e) => setUnmatchDialog((prev) => ({ ...prev, reason: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUnmatchDialog({ open: false, receipt: null, reason: '' })} disabled={unmatchMutation.isPending}>
            취소
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmUnmatch}
            disabled={unmatchMutation.isPending}
            startIcon={unmatchMutation.isPending && <CircularProgress size={16} color="inherit" />}
          >
            {unmatchMutation.isPending ? '해제 중...' : '해제하기'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
