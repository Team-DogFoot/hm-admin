'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import IconButton from '@mui/material/IconButton';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Link from 'next/link';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import InventoryIcon from '@mui/icons-material/Inventory';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VideocamIcon from '@mui/icons-material/Videocam';
import StopIcon from '@mui/icons-material/Stop';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import axios from 'axios';
import { createReceiptPresignedUrl, updateReceiptVideoUrl } from '@/query/api/album-purchase/receipts';
import {
  useQuickScanReceipt,
  useUpdateReceipt,
  useUpdateReceiptVideoUrl,
  useDeleteReceipt,
  useGetReceipts,
  useGetUnmatchedReceipts,
  useMatchUnmatchedReceipt,
  useSearchRequests,
  useUnmatchReceipt,
} from '@/query/query/album-purchase/receipts';
import { useGetRequestDetail } from '@/query/query/album-purchase/requests';
import type {
  ShippingInfo,
  UnmatchedReceiptDetail,
  TrackingNumberInfo,
  UpdateReceiptRequest,
} from '@/types/albumPurchase';
import { useSnackbar } from '../_components/useSnackbar';
import { SHIPPING_COMPANIES } from '@/constants/shippingCompanies';
import ListPageHeader from '../_components/ListPageHeader';
import StatCard from '../_components/StatCard';
import { dataGridStyles, dataGridLocaleText } from '../_components/dataGridStyles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '@/hooks/useAuth';

// 모바일 감지 훅
function useIsMobile() {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('md'));
}

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
  showUnmatchButton = true,
  noRowsLabel = '매칭된 수령 건이 없습니다',
}: {
  receipts: ShippingInfo[];
  isLoading: boolean;
  onUnmatchRequest?: (receipt: ShippingInfo) => void;
  showUnmatchButton?: boolean;
  noRowsLabel?: string;
}) {
  const columns = useMemo<GridColDef[]>(
    () => [
      { field: 'id', headerName: 'ID', width: 70, headerAlign: 'center', align: 'center' },
      { field: 'trackingNumber', headerName: '송장번호', width: 140 },
      { field: 'shippingCompany', headerName: '택배사', width: 90 },
      { field: 'albumTitle', headerName: '앨범명', width: 150 },
      { field: 'senderName', headerName: '보낸사람', width: 90 },
      { field: 'actualQuantity', headerName: '수량', width: 60, headerAlign: 'center', align: 'center' },
      {
        field: 'damagedCount',
        headerName: '파손',
        width: 60,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) =>
          params.value != null && params.value > 0 ? (
            <Chip size="small" label={params.value} color="error" />
          ) : (
            params.value ?? '-'
          ),
      },
      {
        field: 'hasSignedAlbum',
        headerName: '싸인',
        width: 60,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) =>
          params.value ? <CheckCircleIcon color="success" fontSize="small" /> : '-',
      },
      {
        field: 'videoUrl',
        headerName: '영상',
        width: 60,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) =>
          params.value ? (
            <IconButton
              size="small"
              href={params.value}
              target="_blank"
              rel="noopener noreferrer"
              color="primary"
            >
              <PlayCircleOutlineIcon fontSize="small" />
            </IconButton>
          ) : (
            '-'
          ),
      },
      { field: 'requestId', headerName: '신청 ID', width: 80, headerAlign: 'center', align: 'center' },
      {
        field: 'receivedAt',
        headerName: '수령일',
        width: 140,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary">
            {formatDateTime(params.value)}
          </Typography>
        ),
      },
      { field: 'receivedBy', headerName: '수령자', width: 90 },
      {
        field: 'requestDetail',
        headerName: '신청 상세',
        width: 90,
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
      ...(showUnmatchButton
        ? [
            {
              field: 'actions',
              headerName: '',
              width: 100,
              renderCell: (params: any) => {
                const disabled = !params.row.matchedReceiptId;
                return (
                  <Tooltip title={disabled ? '미매칭 수령 건과 연결되지 않은 송장입니다.' : '매칭 해제'}>
                    <span>
                      <Button variant="outlined" size="small" disabled={disabled} onClick={() => onUnmatchRequest?.(params.row)}>
                        매칭 해제
                      </Button>
                    </span>
                  </Tooltip>
                );
              },
            },
          ]
        : []),
    ],
    [onUnmatchRequest, showUnmatchButton]
  );

  return (
    <DataGrid
      rows={(receipts || []).map((receipt) => ({ ...receipt }))}
      columns={columns}
      pageSizeOptions={[10, 20, 50]}
      initialState={{ pagination: { paginationModel: { page: 0, pageSize: 20 } } }}
      loading={isLoading}
      disableRowSelectionOnClick
      rowHeight={52}
      sx={dataGridStyles}
      localeText={{ ...dataGridLocaleText, noRowsLabel }}
    />
  );
}

function UnmatchedReceiptsTable({
  receipts,
  isLoading,
  onMatchReceipt,
  onEditReceipt,
  onDeleteReceipt,
}: {
  receipts: UnmatchedReceiptDetail[];
  isLoading: boolean;
  onMatchReceipt: (receipt: UnmatchedReceiptDetail) => void;
  onEditReceipt: (receipt: UnmatchedReceiptDetail) => void;
  onDeleteReceipt: (receipt: UnmatchedReceiptDetail) => void;
}) {
  const columns = useMemo<GridColDef[]>(
    () => [
      { field: 'id', headerName: 'ID', width: 60, headerAlign: 'center', align: 'center' },
      { field: 'trackingNumber', headerName: '송장번호', width: 140 },
      {
        field: 'shippingCompany',
        headerName: '택배사',
        width: 90,
        renderCell: (params) => params.value || <Chip size="small" label="미입력" color="warning" variant="outlined" />,
      },
      { field: 'senderName', headerName: '보낸사람', width: 90 },
      { field: 'deliveryDestination', headerName: '배송처', width: 100 },
      { field: 'albumTitle', headerName: '앨범명', width: 150 },
      {
        field: 'arrivedQuantity',
        headerName: '도착수량',
        width: 80,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => params.value ?? '-',
      },
      {
        field: 'normalPurchaseCount',
        headerName: '정상',
        width: 60,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => params.value ?? '-',
      },
      {
        field: 'damagedCount',
        headerName: '파손',
        width: 60,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) =>
          params.value != null && params.value > 0 ? (
            <Chip size="small" label={params.value} color="error" />
          ) : (
            params.value ?? '-'
          ),
      },
      {
        field: 'hasSignedAlbum',
        headerName: '싸인',
        width: 60,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) =>
          params.value ? <CheckCircleIcon color="success" fontSize="small" /> : '-',
      },
      {
        field: 'hasUnreleasedPhotocard',
        headerName: '미공포',
        width: 60,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) =>
          params.value ? <CheckCircleIcon color="success" fontSize="small" /> : '-',
      },
      {
        field: 'videoUrl',
        headerName: '영상',
        width: 60,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) =>
          params.value ? (
            <Tooltip title="영상 보기">
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(params.value, '_blank');
                }}
              >
                <VideocamIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            '-'
          ),
      },
      {
        field: 'receivedAt',
        headerName: '수령일',
        width: 140,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary" fontSize={12}>
            {formatDateTime(params.value)}
          </Typography>
        ),
      },
      {
        field: 'actions',
        headerName: '',
        width: 140,
        renderCell: (params) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="매칭">
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onMatchReceipt(params.row);
                }}
              >
                <LinkIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="수정">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditReceipt(params.row);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="삭제">
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteReceipt(params.row);
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [onMatchReceipt, onEditReceipt, onDeleteReceipt]
  );

  return (
    <DataGrid
      rows={receipts || []}
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

// 모바일용 미매칭 수령 건 카드 리스트
function MobileUnmatchedReceiptsList({
  receipts,
  isLoading,
  onMatchReceipt,
  onEditReceipt,
  onDeleteReceipt,
}: {
  receipts: UnmatchedReceiptDetail[];
  isLoading: boolean;
  onMatchReceipt: (receipt: UnmatchedReceiptDetail) => void;
  onEditReceipt: (receipt: UnmatchedReceiptDetail) => void;
  onDeleteReceipt: (receipt: UnmatchedReceiptDetail) => void;
}) {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!receipts?.length) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        미매칭 수령 건이 없습니다.
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      {receipts.map((receipt) => (
        <Card
          key={receipt.id}
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack spacing={1.5}>
              {/* 상단: 송장번호 + 액션 */}
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle2" fontWeight={600}>
                  {receipt.trackingNumber}
                </Typography>
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="매칭">
                    <IconButton size="small" color="primary" onClick={() => onMatchReceipt(receipt)}>
                      <LinkIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <IconButton size="small" onClick={() => onEditReceipt(receipt)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => onDeleteReceipt(receipt)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>

              {/* 택배사 + 보낸사람 */}
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {receipt.shippingCompany ? (
                  <Chip size="small" label={receipt.shippingCompany} />
                ) : (
                  <Chip size="small" label="택배사 미입력" color="warning" variant="outlined" />
                )}
                {receipt.senderName && <Chip size="small" label={receipt.senderName} variant="outlined" />}
                {receipt.deliveryDestination && <Chip size="small" label={receipt.deliveryDestination} variant="outlined" />}
                {receipt.albumTitle && <Chip size="small" label={receipt.albumTitle} color="info" variant="outlined" />}
              </Stack>

              {/* 수량 정보 */}
              <Stack direction="row" spacing={2} sx={{ fontSize: 12, color: 'text.secondary' }}>
                {receipt.arrivedQuantity != null && (
                  <Box>도착수량: <strong>{receipt.arrivedQuantity}</strong></Box>
                )}
                {receipt.normalPurchaseCount != null && (
                  <Box>정상: <strong>{receipt.normalPurchaseCount}</strong></Box>
                )}
                {receipt.damagedCount != null && receipt.damagedCount > 0 && (
                  <Box sx={{ color: 'error.main' }}>파손: <strong>{receipt.damagedCount}</strong></Box>
                )}
              </Stack>

              {/* 체크 정보 */}
              <Stack direction="row" spacing={2}>
                {receipt.hasSignedAlbum && (
                  <Chip size="small" icon={<CheckCircleIcon />} label="싸인" color="success" variant="outlined" />
                )}
                {receipt.hasUnreleasedPhotocard && (
                  <Chip size="small" icon={<CheckCircleIcon />} label="미공포" color="success" variant="outlined" />
                )}
                {receipt.videoUrl && (
                  <Chip
                    size="small"
                    icon={<VideocamIcon />}
                    label="영상"
                    color="primary"
                    variant="outlined"
                    onClick={() => window.open(receipt.videoUrl, '_blank')}
                  />
                )}
              </Stack>

              {/* 수령일 */}
              <Typography variant="caption" color="text.secondary">
                수령일: {formatDateTime(receipt.receivedAt)}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
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

// 매칭 다이얼로그
function MatchDialog({
  open,
  receipt,
  onClose,
  onMatchSuccess,
}: {
  open: boolean;
  receipt: UnmatchedReceiptDetail | null;
  onClose: () => void;
  onMatchSuccess: () => void;
}) {
  const { userEmail } = useAuth();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const debouncedKeyword = useDebouncedValue(searchKeyword.trim(), 400);
  const { data: searchResults, isLoading: isSearching } = useSearchRequests(debouncedKeyword || undefined);
  const { data: requestDetail, isFetching: isRequestDetailLoading } = useGetRequestDetail(
    selectedRequestId ?? undefined
  );
  const matchMutation = useMatchUnmatchedReceipt();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSearchKeyword('');
      setSelectedRequestId(null);
      setErrorMessage(null);
    }
  }, [open]);

  const handleMatch = async () => {
    if (!receipt || !selectedRequestId) return;

    setErrorMessage(null);
    try {
      await matchMutation.mutateAsync({
        unmatchedReceiptId: receipt.id,
        requestData: {
          requestId: selectedRequestId,
          matchedBy: userEmail || 'admin',
          trackingNumber: receipt.trackingNumber,
        },
      });
      onMatchSuccess();
    } catch (error: any) {
      setErrorMessage(error?.message || '매칭에 실패했습니다.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>수령 건 매칭</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Receipt summary */}
          {receipt && (
            <>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip size="small" color="primary" label={receipt.trackingNumber} />
                {receipt.shippingCompany && <Chip size="small" variant="outlined" label={receipt.shippingCompany} />}
                {receipt.senderName && <Chip size="small" variant="outlined" label={receipt.senderName} />}
                {receipt.albumTitle && <Chip size="small" color="info" variant="outlined" label={receipt.albumTitle} />}
                <Chip size="small" variant="outlined" label={`수령일 ${formatDateTime(receipt.receivedAt)}`} />
              </Stack>
              <Divider />
            </>
          )}

          {/* Search field */}
          <TextField
            fullWidth
            placeholder="신청자 이름, 이메일, 연락처로 검색"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            size="small"
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          {/* Search results */}
          {!debouncedKeyword && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1, textAlign: 'center' }}>
              신청자 이름이나 이메일을 입력해주세요.
            </Typography>
          )}

          {debouncedKeyword && isSearching && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {debouncedKeyword && !isSearching && searchResults && searchResults.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1, textAlign: 'center' }}>
              검색 결과가 없습니다.
            </Typography>
          )}

          {debouncedKeyword && !isSearching && searchResults && searchResults.length > 0 && (
            <Stack spacing={1} sx={{ maxHeight: 300, overflowY: 'auto' }}>
              {searchResults.map((request: any) => (
                <Paper
                  key={request.requestId}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    borderColor: selectedRequestId === request.requestId ? 'primary.main' : 'divider',
                    bgcolor: selectedRequestId === request.requestId ? 'action.selected' : 'background.paper',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => setSelectedRequestId(selectedRequestId === request.requestId ? null : request.requestId)}
                >
                  <Typography variant="body2" fontWeight={600}>
                    #{request.requestId} {request.userName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {request.userEmail}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          )}

          {/* Selected request detail */}
          {selectedRequestId && (
            <>
              <Divider />
              {isRequestDetailLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                  <CircularProgress size={20} />
                </Box>
              )}
              {requestDetail && (
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle2" fontWeight={600}>
                      선택된 신청: #{requestDetail.requestId} {requestDetail.userName}
                    </Typography>
                    <Button
                      component={Link}
                      href={`/album-purchase/requests/${requestDetail.requestId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                    >
                      상세보기
                    </Button>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {requestDetail.userEmail} · {requestDetail.recipientPhone || '연락처 없음'}
                  </Typography>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      등록된 송장번호
                    </Typography>
                    <TrackingNumbersList
                      trackingNumbers={requestDetail.trackingNumbers}
                      highlightTrackingNumber={receipt?.trackingNumber}
                    />
                  </Box>
                </Stack>
              )}
            </>
          )}

          {/* Error message */}
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={matchMutation.isPending}>
          취소
        </Button>
        <Button
          variant="contained"
          onClick={handleMatch}
          disabled={!selectedRequestId || matchMutation.isPending}
          startIcon={matchMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <LinkIcon />}
        >
          {matchMutation.isPending ? '매칭 중...' : '매칭하기'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// 수령 건 수정 다이얼로그
function EditReceiptDialog({
  open,
  receipt,
  onClose,
  onSave,
  isLoading,
}: {
  open: boolean;
  receipt: UnmatchedReceiptDetail | null;
  onClose: () => void;
  onSave: (data: UpdateReceiptRequest) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<UpdateReceiptRequest>({});

  useEffect(() => {
    if (receipt) {
      setFormData({
        trackingNumber: receipt.trackingNumber || undefined,
        shippingCompany: receipt.shippingCompany || undefined,
        receivedBy: receipt.receivedBy || undefined,
        senderName: receipt.senderName || undefined,
        deliveryDestination: receipt.deliveryDestination || undefined,
        albumTitle: receipt.albumTitle || undefined,
        arrivedQuantity: receipt.arrivedQuantity ?? undefined,
        normalPurchaseCount: receipt.normalPurchaseCount ?? undefined,
        damagedCount: receipt.damagedCount ?? undefined,
        hasSignedAlbum: receipt.hasSignedAlbum ?? false,
        hasUnreleasedPhotocard: receipt.hasUnreleasedPhotocard ?? false,
        photocardCount: receipt.photocardCount ?? undefined,
        memo: receipt.memo || undefined,
      });
    }
  }, [receipt]);

  const handleChange = (field: keyof UpdateReceiptRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>수령 건 상세 정보 수정</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="송장번호"
            value={formData.trackingNumber || ''}
            onChange={(e) => handleChange('trackingNumber', e.target.value || undefined)}
            fullWidth
            size="small"
          />

          <TextField
            select
            label="택배사"
            value={formData.shippingCompany || ''}
            onChange={(e) => handleChange('shippingCompany', e.target.value || undefined)}
            fullWidth
            size="small"
          >
            <MenuItem value="">선택 안함</MenuItem>
            {SHIPPING_COMPANIES.map((company) => (
              <MenuItem key={company.value} value={company.value}>
                {company.label}
              </MenuItem>
            ))}
          </TextField>

          <Stack direction="row" spacing={2}>
            <TextField
              label="보낸사람"
              value={formData.senderName || ''}
              onChange={(e) => handleChange('senderName', e.target.value || undefined)}
              fullWidth
              size="small"
            />
            <TextField
              label="배송처"
              value={formData.deliveryDestination || ''}
              onChange={(e) => handleChange('deliveryDestination', e.target.value || undefined)}
              fullWidth
              size="small"
            />
          </Stack>

          <TextField
            label="앨범명"
            value={formData.albumTitle || ''}
            onChange={(e) => handleChange('albumTitle', e.target.value || undefined)}
            fullWidth
            size="small"
            placeholder="예: 뉴진스 2집"
          />

          <TextField
            label="수령자"
            value={formData.receivedBy || ''}
            onChange={(e) => handleChange('receivedBy', e.target.value || undefined)}
            fullWidth
            size="small"
          />

          <Divider />

          <Stack direction="row" spacing={2}>
            <TextField
              label="도착수량"
              type="number"
              value={formData.arrivedQuantity ?? ''}
              onChange={(e) => handleChange('arrivedQuantity', e.target.value ? parseInt(e.target.value) : undefined)}
              fullWidth
              size="small"
            />
            <TextField
              label="정상매입갯수"
              type="number"
              value={formData.normalPurchaseCount ?? ''}
              onChange={(e) => handleChange('normalPurchaseCount', e.target.value ? parseInt(e.target.value) : undefined)}
              fullWidth
              size="small"
            />
            <TextField
              label="파손갯수"
              type="number"
              value={formData.damagedCount ?? ''}
              onChange={(e) => handleChange('damagedCount', e.target.value ? parseInt(e.target.value) : undefined)}
              fullWidth
              size="small"
            />
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={formData.hasSignedAlbum ?? false}
                  onChange={(e) => handleChange('hasSignedAlbum', e.target.checked)}
                />
              }
              label="싸인앨범"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.hasUnreleasedPhotocard ?? false}
                  onChange={(e) => handleChange('hasUnreleasedPhotocard', e.target.checked)}
                />
              }
              label="미공개 포토카드"
            />
            <TextField
              label="포토카드 수량"
              type="number"
              value={formData.photocardCount ?? ''}
              onChange={(e) => handleChange('photocardCount', e.target.value ? parseInt(e.target.value) : undefined)}
              size="small"
              sx={{ width: 140 }}
            />
          </Stack>

          <TextField
            label="메모"
            value={formData.memo || ''}
            onChange={(e) => handleChange('memo', e.target.value || undefined)}
            fullWidth
            size="small"
            multiline
            rows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isLoading}>
          취소
        </Button>
        <Button
          variant="contained"
          onClick={() => onSave(formData)}
          disabled={isLoading}
          startIcon={isLoading && <CircularProgress size={16} color="inherit" />}
        >
          {isLoading ? '저장 중...' : '저장'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// 영상 녹화 다이얼로그 (웹캠 녹화 + URL 직접 입력)
function VideoRecordDialog({
  open,
  receiptId,
  trackingNumber,
  onClose,
  onComplete,
}: {
  open: boolean;
  receiptId: number | null;
  trackingNumber?: string;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [mode, setMode] = useState<'select' | 'webcam' | 'url'>('select');
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // 다이얼로그 닫을 때 정리
  useEffect(() => {
    if (!open) {
      stopCamera();
      setMode('select');
      setVideoUrl('');
      setVideoBlob(null);
      setIsRecording(false);
      setIsLoading(false);
    }
  }, [open]);

  const getSupportedMimeType = (): string => {
    const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return 'video/webm';
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const startWebcam = async () => {
    setMode('webcam');
    try {
      // 카메라 해제 대기
      await new Promise((resolve) => setTimeout(resolve, 300));

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Webcam error:', err);
      alert('카메라에 접근할 수 없습니다.');
      setMode('select');
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const mimeType = getSupportedMimeType();
    const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setVideoBlob(blob);
      setIsRecording(false);
    };

    mediaRecorder.start(1000);
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const uploadVideo = async () => {
    if (!videoBlob || !receiptId) return;

    setIsLoading(true);
    try {
      const fileName = `receipt_${receiptId}_${Date.now()}.webm`;
      const fileType = videoBlob.type || 'video/webm';
      const presignedData = await createReceiptPresignedUrl(receiptId, fileName, fileType);

      await axios.put(presignedData.presignedUrl, videoBlob, {
        headers: { 'Content-Type': fileType },
      });

      await updateReceiptVideoUrl(receiptId, { videoUrl: presignedData.uploadFileUrl });
      stopCamera();
      onComplete();
    } catch (err: any) {
      console.error('Upload error:', err);
      alert(err?.message || '업로드 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveVideoUrl = async () => {
    if (!videoUrl.trim() || !receiptId) return;

    setIsLoading(true);
    try {
      await updateReceiptVideoUrl(receiptId, { videoUrl: videoUrl.trim() });
      onComplete();
    } catch (err: any) {
      console.error('Save URL error:', err);
      alert(err?.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    stopCamera();
    onComplete();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        개봉 영상 촬영
        {trackingNumber && (
          <Typography variant="body2" color="text.secondary">
            송장번호: {trackingNumber}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        {/* 선택 화면 */}
        {mode === 'select' && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              택배 개봉 영상을 촬영하시겠습니까?
            </Alert>
            <Button
              variant="outlined"
              size="large"
              startIcon={<VideocamIcon />}
              onClick={startWebcam}
              sx={{ py: 2 }}
            >
              웹캠으로 촬영
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => setMode('url')}
              sx={{ py: 2 }}
            >
              URL 직접 입력
            </Button>
          </Stack>
        )}

        {/* 웹캠 녹화 화면 */}
        {mode === 'webcam' && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box
              sx={{
                width: '100%',
                height: 300,
                bgcolor: '#000',
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <video
                ref={videoRef}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                muted
                playsInline
              />
            </Box>
            {isRecording && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: 'error.main' }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: 'error.main',
                    animation: 'pulse 1s infinite',
                    '@keyframes pulse': { '0%': { opacity: 1 }, '50%': { opacity: 0.5 }, '100%': { opacity: 1 } },
                  }}
                />
                <Typography fontWeight="bold">녹화 중...</Typography>
              </Box>
            )}
            {videoBlob && !isRecording && (
              <Alert severity="success">
                녹화 완료! ({(videoBlob.size / (1024 * 1024)).toFixed(2)}MB)
              </Alert>
            )}
            <Stack direction="row" spacing={2}>
              {!isRecording && !videoBlob && (
                <Button variant="contained" color="error" fullWidth onClick={startRecording} startIcon={<VideocamIcon />}>
                  녹화 시작
                </Button>
              )}
              {isRecording && (
                <Button variant="contained" color="error" fullWidth onClick={stopRecording} startIcon={<StopIcon />}>
                  녹화 중지
                </Button>
              )}
              {videoBlob && !isRecording && (
                <>
                  <Button variant="outlined" fullWidth onClick={() => setVideoBlob(null)}>
                    다시 촬영
                  </Button>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={uploadVideo}
                    disabled={isLoading}
                    startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                  >
                    {isLoading ? '업로드 중...' : '업로드'}
                  </Button>
                </>
              )}
            </Stack>
            <Button variant="text" onClick={() => { stopCamera(); setMode('select'); }}>
              뒤로
            </Button>
          </Stack>
        )}

        {/* URL 직접 입력 화면 */}
        {mode === 'url' && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="영상 URL"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              fullWidth
              size="small"
              placeholder="https://..."
            />
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" fullWidth onClick={() => setMode('select')}>
                뒤로
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={saveVideoUrl}
                disabled={isLoading || !videoUrl.trim()}
                startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
              >
                {isLoading ? '저장 중...' : '저장'}
              </Button>
            </Stack>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleSkip} disabled={isLoading || isRecording}>
          건너뛰기
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ReceiptsPage() {
  const isMobile = useIsMobile();
  const { showSnackbar, SnackbarComponent } = useSnackbar();
  const { userEmail } = useAuth();
  const [tabValue, setTabValue] = useState<'matched' | 'unmatched' | 'settled'>('unmatched');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [receiptSearchKeyword, setReceiptSearchKeyword] = useState('');
  const [unmatchDialog, setUnmatchDialog] = useState<{ open: boolean; receipt: ShippingInfo | null; reason: string }>({
    open: false,
    receipt: null,
    reason: '',
  });
  const [editDialog, setEditDialog] = useState<{ open: boolean; receipt: UnmatchedReceiptDetail | null }>({
    open: false,
    receipt: null,
  });
  const [videoDialog, setVideoDialog] = useState<{ open: boolean; receiptId: number | null; trackingNumber: string }>({
    open: false,
    receiptId: null,
    trackingNumber: '',
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; receipt: UnmatchedReceiptDetail | null }>({
    open: false,
    receipt: null,
  });
  const [matchDialog, setMatchDialog] = useState<{ open: boolean; receipt: UnmatchedReceiptDetail | null }>({
    open: false,
    receipt: null,
  });

  const trackingInputRef = useRef<HTMLInputElement>(null);

  const receiptsQuery = useGetReceipts({ isReceived: true, isSettled: false });
  const settledReceiptsQuery = useGetReceipts({ isReceived: true, isSettled: true });
  const unmatchedQuery = useGetUnmatchedReceipts({ isMatched: false });

  const quickScanMutation = useQuickScanReceipt();
  const updateMutation = useUpdateReceipt();
  const updateVideoMutation = useUpdateReceiptVideoUrl();
  const deleteMutation = useDeleteReceipt();
  const unmatchMutation = useUnmatchReceipt();

  // Filtered data based on search keyword
  const debouncedReceiptSearch = useDebouncedValue(receiptSearchKeyword.trim().toLowerCase(), 300);

  const filteredMatchedReceipts = useMemo(() => {
    if (!receiptsQuery.data) return [];
    if (!debouncedReceiptSearch) return receiptsQuery.data;
    return receiptsQuery.data.filter(
      (r) =>
        r.trackingNumber?.toLowerCase().includes(debouncedReceiptSearch) ||
        r.senderName?.toLowerCase().includes(debouncedReceiptSearch) ||
        r.albumTitle?.toLowerCase().includes(debouncedReceiptSearch)
    );
  }, [receiptsQuery.data, debouncedReceiptSearch]);

  const filteredSettledReceipts = useMemo(() => {
    if (!settledReceiptsQuery.data) return [];
    if (!debouncedReceiptSearch) return settledReceiptsQuery.data;
    return settledReceiptsQuery.data.filter(
      (r) =>
        r.trackingNumber?.toLowerCase().includes(debouncedReceiptSearch) ||
        r.senderName?.toLowerCase().includes(debouncedReceiptSearch) ||
        r.albumTitle?.toLowerCase().includes(debouncedReceiptSearch)
    );
  }, [settledReceiptsQuery.data, debouncedReceiptSearch]);

  const filteredUnmatchedReceipts = useMemo(() => {
    if (!unmatchedQuery.data) return [];
    if (!debouncedReceiptSearch) return unmatchedQuery.data;
    return unmatchedQuery.data.filter(
      (r) =>
        r.trackingNumber?.toLowerCase().includes(debouncedReceiptSearch) ||
        r.senderName?.toLowerCase().includes(debouncedReceiptSearch) ||
        r.albumTitle?.toLowerCase().includes(debouncedReceiptSearch)
    );
  }, [unmatchedQuery.data, debouncedReceiptSearch]);

  // Stats
  const stats = useMemo(() => {
    const matched = receiptsQuery.data?.length || 0;
    const settled = settledReceiptsQuery.data?.length || 0;
    const unmatched = unmatchedQuery.data?.length || 0;
    return { matched, settled, unmatched, total: matched + settled + unmatched };
  }, [receiptsQuery.data, settledReceiptsQuery.data, unmatchedQuery.data]);

  // 퀵스캔 핸들러
  const handleQuickScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      showSnackbar('송장번호를 입력해주세요.', 'warning');
      return;
    }

    const scannedTrackingNumber = trackingNumber.trim();

    try {
      const result = await quickScanMutation.mutateAsync({
        trackingNumber: scannedTrackingNumber,
        receivedBy: userEmail || undefined,
      });

      showSnackbar(`수령 건이 생성되었습니다. (ID: ${result.receiptId})`, 'success');
      setTrackingNumber('');

      // 영상 녹화 다이얼로그 열기
      setVideoDialog({ open: true, receiptId: result.receiptId, trackingNumber: scannedTrackingNumber });

      unmatchedQuery.refetch();
      trackingInputRef.current?.focus();
    } catch (error: any) {
      showSnackbar(error?.message || '스캔에 실패했습니다.', 'error');
    }
  };

  // 영상 다이얼로그 완료 후 내용물 입력 다이얼로그로 이동
  const handleVideoComplete = () => {
    const receiptId = videoDialog.receiptId;
    const trackingNum = videoDialog.trackingNumber;
    setVideoDialog({ open: false, receiptId: null, trackingNumber: '' });
    unmatchedQuery.refetch();

    // 내용물 입력 다이얼로그 열기
    if (receiptId) {
      setEditDialog({
        open: true,
        receipt: {
          id: receiptId,
          trackingNumber: trackingNum,
          isMatched: false,
          createdAt: new Date().toISOString(),
        } as UnmatchedReceiptDetail,
      });
    }
  };

  // 수령 건 수정
  const handleEditReceipt = useCallback((receipt: UnmatchedReceiptDetail) => {
    setEditDialog({ open: true, receipt });
  }, []);

  const handleSaveReceipt = async (data: UpdateReceiptRequest) => {
    if (!editDialog.receipt) return;

    try {
      await updateMutation.mutateAsync({
        receiptId: editDialog.receipt.id,
        requestData: data,
      });
      showSnackbar('수령 건이 수정되었습니다.', 'success');
      setEditDialog({ open: false, receipt: null });
      unmatchedQuery.refetch();
      receiptsQuery.refetch();
    } catch (error: any) {
      showSnackbar(error?.message || '수정에 실패했습니다.', 'error');
    }
  };

  // 수령 건 삭제
  const handleDeleteReceipt = useCallback((receipt: UnmatchedReceiptDetail) => {
    setDeleteDialog({ open: true, receipt });
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteDialog.receipt) return;

    try {
      await deleteMutation.mutateAsync(deleteDialog.receipt.id);
      showSnackbar('수령 건이 삭제되었습니다.', 'success');
      setDeleteDialog({ open: false, receipt: null });
      unmatchedQuery.refetch();
    } catch (error: any) {
      showSnackbar(error?.message || '삭제에 실패했습니다.', 'error');
    }
  };

  // 매칭 다이얼로그
  const handleOpenMatchDialog = useCallback((receipt: UnmatchedReceiptDetail) => {
    setMatchDialog({ open: true, receipt });
  }, []);

  const handleMatchSuccess = () => {
    showSnackbar('매칭 완료!', 'success');
    setMatchDialog({ open: false, receipt: null });
    receiptsQuery.refetch();
    unmatchedQuery.refetch();
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
        requestData: { unmatchedBy: 'admin', reason: unmatchDialog.reason || undefined },
      });
      showSnackbar('매칭을 해제했습니다.', 'success');
      setUnmatchDialog({ open: false, receipt: null, reason: '' });
      receiptsQuery.refetch();
      unmatchedQuery.refetch();
    } catch (error: any) {
      showSnackbar(error?.message || '매칭 해제에 실패했습니다.', 'error');
    }
  };

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

      {/* 퀵스캔 */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <QrCodeScannerIcon /> 퀵스캔
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          송장번호만 입력하면 수령 건이 생성됩니다. 상세 정보는 목록에서 수정할 수 있습니다.
        </Alert>
        <Stack component="form" direction={{ xs: 'column', sm: 'row' }} spacing={2} onSubmit={handleQuickScan}>
          <TextField
            inputRef={trackingInputRef}
            placeholder="송장번호를 스캔하거나 입력하세요"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            autoFocus
          />
          <Button
            type="submit"
            variant="contained"
            disabled={quickScanMutation.isPending}
            startIcon={quickScanMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <QrCodeScannerIcon />}
            sx={{ minWidth: 140, height: 40 }}
          >
            {quickScanMutation.isPending ? '처리 중...' : '퀵스캔'}
          </Button>
        </Stack>
      </Paper>

      {/* 탭 */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50', flexWrap: 'wrap', gap: 1 }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label={`미매칭 수령 건 (${stats.unmatched})`} value="unmatched" />
            <Tab label={`매칭된 수령 건 (${stats.matched})`} value="matched" />
            <Tab label={`정산완료 수령 건 (${stats.settled})`} value="settled" />
          </Tabs>
          <TextField
            placeholder="이름 / 송장번호 / 앨범명 검색"
            value={receiptSearchKeyword}
            onChange={(e) => setReceiptSearchKeyword(e.target.value)}
            size="small"
            sx={{ width: { xs: '100%', sm: 220 }, mr: { xs: 1, sm: 2 }, ml: { xs: 1, sm: 0 }, mb: { xs: 1, sm: 0 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* 미매칭 수령 건 */}
        {tabValue === 'unmatched' && (
          <Box sx={{ p: 2 }}>
            {isMobile ? (
              <MobileUnmatchedReceiptsList
                receipts={filteredUnmatchedReceipts}
                isLoading={unmatchedQuery.isLoading}
                onMatchReceipt={handleOpenMatchDialog}
                onEditReceipt={handleEditReceipt}
                onDeleteReceipt={handleDeleteReceipt}
              />
            ) : (
              <UnmatchedReceiptsTable
                receipts={filteredUnmatchedReceipts}
                isLoading={unmatchedQuery.isLoading}
                onMatchReceipt={handleOpenMatchDialog}
                onEditReceipt={handleEditReceipt}
                onDeleteReceipt={handleDeleteReceipt}
              />
            )}
          </Box>
        )}

        {/* 매칭된 수령 건 */}
        {tabValue === 'matched' && (
          <Box sx={{ p: 2 }}>
            <MatchedReceiptsTable
              receipts={filteredMatchedReceipts}
              isLoading={receiptsQuery.isLoading}
              onUnmatchRequest={handleRequestUnmatch}
            />
          </Box>
        )}

        {/* 정산완료 수령 건 */}
        {tabValue === 'settled' && (
          <Box sx={{ p: 2 }}>
            <MatchedReceiptsTable
              receipts={filteredSettledReceipts}
              isLoading={settledReceiptsQuery.isLoading}
              showUnmatchButton={false}
              noRowsLabel="정산 완료된 수령 건이 없습니다"
            />
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

      {/* 수령 건 수정 다이얼로그 */}
      <EditReceiptDialog
        open={editDialog.open}
        receipt={editDialog.receipt}
        onClose={() => setEditDialog({ open: false, receipt: null })}
        onSave={handleSaveReceipt}
        isLoading={updateMutation.isPending}
      />

      {/* 영상 녹화 다이얼로그 */}
      <VideoRecordDialog
        open={videoDialog.open}
        receiptId={videoDialog.receiptId}
        trackingNumber={videoDialog.trackingNumber}
        onClose={() => setVideoDialog({ open: false, receiptId: null, trackingNumber: '' })}
        onComplete={handleVideoComplete}
      />

      {/* 매칭 다이얼로그 */}
      <MatchDialog
        open={matchDialog.open}
        receipt={matchDialog.receipt}
        onClose={() => setMatchDialog({ open: false, receipt: null })}
        onMatchSuccess={handleMatchSuccess}
      />

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, receipt: null })}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>수령 건 삭제</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            송장번호 <strong>{deleteDialog.receipt?.trackingNumber}</strong> 수령 건을 삭제하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialog({ open: false, receipt: null })} disabled={deleteMutation.isPending}>
            취소
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleteMutation.isPending}
            startIcon={deleteMutation.isPending && <CircularProgress size={16} color="inherit" />}
          >
            {deleteMutation.isPending ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
