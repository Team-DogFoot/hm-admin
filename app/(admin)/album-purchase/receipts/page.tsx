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
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import IconButton from '@mui/material/IconButton';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Link from 'next/link';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VideocamIcon from '@mui/icons-material/Videocam';
import StopIcon from '@mui/icons-material/Stop';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from 'axios';
import { createReceiptPresignedUrl, updateReceiptVideoUrl } from '@/query/api/album-purchase/receipts';
import {
  useQuickScanReceipt,
  useUpdateReceipt,
  useUpdateReceiptVideoUrl,
  useDeleteReceipt,
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
  UpdateReceiptRequest,
} from '@/types/albumPurchase';
import { useSnackbar } from '../_components/useSnackbar';
import {
  SHIPPING_COMPANIES,
  ShippingCompanyValue,
} from '@/constants/shippingCompanies';
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
  onEditReceipt,
  onDeleteReceipt,
}: {
  receipts: UnmatchedReceiptDetail[];
  isLoading: boolean;
  selectedUnmatchedId: number | null;
  onSelectUnmatched: (id: number | null) => void;
  onEditReceipt: (receipt: UnmatchedReceiptDetail) => void;
  onDeleteReceipt: (receipt: UnmatchedReceiptDetail) => void;
}) {
  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'select',
        headerName: '',
        width: 50,
        renderCell: (params) => (
          <Radio
            checked={selectedUnmatchedId === params.row.id}
            onChange={() => onSelectUnmatched(selectedUnmatchedId === params.row.id ? null : params.row.id)}
            size="small"
          />
        ),
      },
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
        width: 100,
        renderCell: (params) => (
          <Stack direction="row" spacing={0.5}>
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
    [onSelectUnmatched, selectedUnmatchedId, onEditReceipt, onDeleteReceipt]
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
  selectedUnmatchedId,
  onSelectUnmatched,
  onEditReceipt,
  onDeleteReceipt,
}: {
  receipts: UnmatchedReceiptDetail[];
  isLoading: boolean;
  selectedUnmatchedId: number | null;
  onSelectUnmatched: (id: number | null) => void;
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
            borderColor: selectedUnmatchedId === receipt.id ? 'primary.main' : 'divider',
            borderRadius: 2,
            bgcolor: selectedUnmatchedId === receipt.id ? 'primary.50' : 'background.paper',
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack spacing={1.5}>
              {/* 상단: 선택 + 송장번호 + 액션 */}
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Radio
                    checked={selectedUnmatchedId === receipt.id}
                    onChange={() => onSelectUnmatched(selectedUnmatchedId === receipt.id ? null : receipt.id)}
                    size="small"
                  />
                  <Typography variant="subtitle2" fontWeight={600}>
                    {receipt.trackingNumber}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5}>
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

// 모바일용 매입 신청 검색 리스트
function MobileSearchRequestsList({
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

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!searchResults?.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
        검색 결과가 없습니다.
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      {searchResults.map((request: any) => (
        <Card
          key={request.requestId}
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: selectedRequestId === request.requestId ? 'primary.main' : 'divider',
            borderRadius: 1,
            cursor: 'pointer',
          }}
          onClick={() => onSelectRequest(selectedRequestId === request.requestId ? null : request.requestId)}
        >
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Radio
                checked={selectedRequestId === request.requestId}
                size="small"
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  #{request.requestId} {request.userName}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {request.userEmail}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
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
                {unmatchedReceipt.shippingCompany && (
                  <Chip variant="outlined" label={`택배사 ${unmatchedReceipt.shippingCompany}`} size="small" />
                )}
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
                    {requestDetail.userEmail} · {requestDetail.recipientPhone || '연락처 없음'}
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
  const [tabValue, setTabValue] = useState<'matched' | 'unmatched'>('unmatched');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedUnmatchedId, setSelectedUnmatchedId] = useState<number | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
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
  const [showMatchPanel, setShowMatchPanel] = useState(false); // 모바일용 매칭 패널 표시 여부

  const trackingInputRef = useRef<HTMLInputElement>(null);

  const receiptsQuery = useGetReceipts({ isReceived: true });
  const unmatchedQuery = useGetUnmatchedReceipts({ isMatched: false });
  const { data: selectedRequestDetail, isFetching: isRequestDetailLoading, refetch: refetchRequestDetail } = useGetRequestDetail(
    selectedRequestId ?? undefined
  );
  const selectedUnmatchedReceipt = useMemo(
    () => unmatchedQuery.data?.find((receipt) => receipt.id === selectedUnmatchedId),
    [selectedUnmatchedId, unmatchedQuery.data]
  );

  const quickScanMutation = useQuickScanReceipt();
  const updateMutation = useUpdateReceipt();
  const updateVideoMutation = useUpdateReceiptVideoUrl();
  const deleteMutation = useDeleteReceipt();
  const matchMutation = useMatchUnmatchedReceipt();
  const unmatchMutation = useUnmatchReceipt();

  // Stats
  const stats = useMemo(() => {
    const matched = receiptsQuery.data?.length || 0;
    const unmatched = unmatchedQuery.data?.length || 0;
    return { matched, unmatched, total: matched + unmatched };
  }, [receiptsQuery.data, unmatchedQuery.data]);

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

  // 매칭
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
          matchedBy: 'admin',
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
        requestData: { unmatchedBy: 'admin', reason: unmatchDialog.reason || undefined },
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
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Tab label={`미매칭 수령 건 (${stats.unmatched})`} value="unmatched" />
          <Tab label={`매칭된 수령 건 (${stats.matched})`} value="matched" />
        </Tabs>

        {/* 미매칭 수령 건 + 매칭 기능 */}
        {tabValue === 'unmatched' && (
          <Box sx={{ p: 2 }}>
            {/* 모바일 뷰 */}
            {isMobile ? (
              <Stack spacing={2}>
                {/* 수령 건 목록 */}
                {!showMatchPanel && (
                  <>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="subtitle2" fontWeight={600}>
                        미매칭 수령 건
                      </Typography>
                      {selectedUnmatchedId && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => setShowMatchPanel(true)}
                          startIcon={<LinkIcon />}
                        >
                          매칭하기
                        </Button>
                      )}
                    </Stack>
                    <MobileUnmatchedReceiptsList
                      receipts={unmatchedQuery.data || []}
                      isLoading={unmatchedQuery.isLoading}
                      selectedUnmatchedId={selectedUnmatchedId}
                      onSelectUnmatched={setSelectedUnmatchedId}
                      onEditReceipt={handleEditReceipt}
                      onDeleteReceipt={handleDeleteReceipt}
                    />
                  </>
                )}

                {/* 매칭 패널 (모바일) */}
                {showMatchPanel && (
                  <>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="subtitle2" fontWeight={600}>
                        매칭할 신청 선택
                      </Typography>
                      <Button size="small" onClick={() => setShowMatchPanel(false)}>
                        뒤로가기
                      </Button>
                    </Stack>

                    {selectedUnmatchedReceipt && (
                      <Alert severity="info" sx={{ py: 0.5 }}>
                        선택된 송장: <strong>{selectedUnmatchedReceipt.trackingNumber}</strong>
                      </Alert>
                    )}

                    <TextField
                      fullWidth
                      placeholder="신청자 이름, 이메일, 연락처로 검색"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <MobileSearchRequestsList
                      searchKeyword={searchKeyword}
                      selectedRequestId={selectedRequestId}
                      onSelectRequest={setSelectedRequestId}
                    />

                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => {
                        handleMatch();
                        setShowMatchPanel(false);
                      }}
                      disabled={disableMatchButton || matchMutation.isPending}
                      startIcon={matchMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <LinkIcon />}
                      sx={{ mt: 2 }}
                    >
                      {matchMutation.isPending ? '매칭 중...' : '매칭하기'}
                    </Button>
                  </>
                )}
              </Stack>
            ) : (
              /* 데스크톱 뷰 */
              <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="stretch">
                <Box flex={{ xs: 1, lg: 1.4 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    미매칭 수령 건
                  </Typography>
                  <UnmatchedReceiptsTable
                    receipts={unmatchedQuery.data || []}
                    isLoading={unmatchedQuery.isLoading}
                    selectedUnmatchedId={selectedUnmatchedId}
                    onSelectUnmatched={setSelectedUnmatchedId}
                    onEditReceipt={handleEditReceipt}
                    onDeleteReceipt={handleDeleteReceipt}
                  />
                </Box>
                <Box flex={{ xs: 1, lg: 0.6 }}>
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
            )}
          </Box>
        )}

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
