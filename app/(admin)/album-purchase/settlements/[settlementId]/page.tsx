'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import Link from 'next/link';
import {
  useGetSettlementDetail,
  useCompleteSettlement,
  useUpdateSettlementStatus,
  useDeleteSettlement,
  useFindSimilarProducts,
  useTransferStock,
} from '@/query/query/album-purchase/settlements';
import { useGetRequestDetail } from '@/query/query/album-purchase/requests';
import { SimilarLogiProduct } from '@/query/api/album-purchase/settlements';
import { useSnackbar } from '../../_components/useSnackbar';
import type { SettlementStatus, SettlementItem } from '@/types/albumPurchase';

const settlementStatusLabel: Record<SettlementStatus, { label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'error' }> = {
  PENDING: { label: '대기', color: 'default' },
  IN_PROGRESS: { label: '진행중', color: 'primary' },
  COMPLETED: { label: '완료', color: 'success' },
  CANCELLED: { label: '취소', color: 'error' },
  HOLD: { label: '보류', color: 'warning' },
};

const allSettlementStatuses: SettlementStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'HOLD'];

export default function SettlementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const settlementId = Number(params.settlementId);
  const { showSnackbar, SnackbarComponent } = useSnackbar();

  const { data: settlement, isLoading } = useGetSettlementDetail(settlementId);
  const { data: requestDetail, isLoading: isLoadingRequest } = useGetRequestDetail(
    settlement?.purchaseRequestId
  );
  const completeMutation = useCompleteSettlement();
  const updateStatusMutation = useUpdateSettlementStatus();
  const deleteMutation = useDeleteSettlement();

  const [transferredAt, setTransferredAt] = useState(
    new Date().toISOString().slice(0, 16),
  );
  const [settlementNote, setSettlementNote] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<SettlementStatus | ''>('');
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(0);

  // 재고 이동 상태
  const [stockTransferDialogOpen, setStockTransferDialogOpen] = useState(false);
  const [selectedItemForTransfer, setSelectedItemForTransfer] = useState<SettlementItem | null>(null);
  const [selectedLogiProduct, setSelectedLogiProduct] = useState<SimilarLogiProduct | null>(null);
  const [transferQuantity, setTransferQuantity] = useState<number>(0);
  const [transferNote, setTransferNote] = useState('');

  const transferStockMutation = useTransferStock();
  const { data: similarProducts, isLoading: isLoadingSimilar } = useFindSimilarProducts(
    settlementId,
    selectedItemForTransfer?.id || 0,
    stockTransferDialogOpen && !!selectedItemForTransfer
  );

  // 다이얼로그가 열릴 때 수량 초기화
  useEffect(() => {
    if (selectedItemForTransfer) {
      setTransferQuantity(selectedItemForTransfer.quantity || 1);
    }
  }, [selectedItemForTransfer]);

  const handleComplete = async () => {
    if (confirm('정산을 완료 처리하시겠습니까?')) {
      try {
        await completeMutation.mutateAsync({
          settlementId,
          requestData: {
            transferredAt,
            settlementNote,
          },
        });
        showSnackbar('정산이 완료되었습니다.', 'success');
        setTimeout(() => router.push('/album-purchase/settlements'), 1500);
      } catch (error: any) {
        showSnackbar(error?.message || '정산 완료에 실패했습니다.', 'error');
      }
    }
  };

  const handleStatusChange = async () => {
    if (!selectedStatus) {
      showSnackbar('상태를 선택해주세요.', 'warning');
      return;
    }
    const requiresTransferredAt = selectedStatus === 'COMPLETED' && !settlement?.transferredAt;
    if (confirm(`정산 상태를 '${settlementStatusLabel[selectedStatus].label}'(으)로 변경하시겠습니까?${requiresTransferredAt ? '\n\n(입금일시가 현재 시간으로 설정됩니다)' : ''}`)) {
      try {
        await updateStatusMutation.mutateAsync({
          settlementId,
          requestData: {
            status: selectedStatus,
            ...(requiresTransferredAt && { transferredAt: new Date().toISOString() }),
          },
        });
        showSnackbar('상태가 변경되었습니다.', 'success');
        setSelectedStatus('');
      } catch (error: any) {
        showSnackbar(error?.message || '상태 변경에 실패했습니다.', 'error');
      }
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmStep === 0) {
      // 첫 번째 확인
      if (confirm('정말로 이 정산을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) {
        setDeleteConfirmStep(1);
        showSnackbar('삭제를 진행하려면 삭제 버튼을 한 번 더 클릭하세요.', 'warning');
      }
    } else {
      // 두 번째 확인
      if (confirm('최종 확인: 정산을 삭제합니다.\n\n정말로 삭제하시겠습니까?')) {
        try {
          await deleteMutation.mutateAsync(settlementId);
          // 삭제 성공 시 즉시 리스트 페이지로 이동 (재조회 방지)
          router.push('/album-purchase/settlements');
        } catch (error: any) {
          showSnackbar(error?.message || '삭제에 실패했습니다.', 'error');
          setDeleteConfirmStep(0);
        }
      } else {
        setDeleteConfirmStep(0);
      }
    }
  };

  // 재고 이동 다이얼로그 열기
  const handleOpenStockTransferDialog = (item: SettlementItem) => {
    setSelectedItemForTransfer(item);
    setSelectedLogiProduct(null);
    setTransferNote('');
    setStockTransferDialogOpen(true);
  };

  // 재고 이동 다이얼로그 닫기
  const handleCloseStockTransferDialog = () => {
    setStockTransferDialogOpen(false);
    setSelectedItemForTransfer(null);
    setSelectedLogiProduct(null);
    setTransferNote('');
  };

  // 재고 이동 실행
  const handleTransferStock = async () => {
    if (!selectedItemForTransfer || !selectedLogiProduct) {
      showSnackbar('이동할 상품을 선택해주세요.', 'warning');
      return;
    }

    if (transferQuantity <= 0) {
      showSnackbar('이동할 수량을 입력해주세요.', 'warning');
      return;
    }

    if (confirm(`'${selectedLogiProduct.title}'(으)로 ${transferQuantity}개를 이동하시겠습니까?`)) {
      try {
        const result = await transferStockMutation.mutateAsync({
          settlementId,
          itemId: selectedItemForTransfer.id,
          requestData: {
            logiProductId: selectedLogiProduct.id,
            quantity: transferQuantity,
            note: transferNote || undefined,
          },
        });
        showSnackbar(result.message || '재고가 이동되었습니다.', 'success');
        handleCloseStockTransferDialog();
      } catch (error: any) {
        showSnackbar(error?.message || '재고 이동에 실패했습니다.', 'error');
      }
    }
  };

  // 매치 타입 라벨
  const getMatchTypeLabel = (matchType: string) => {
    switch (matchType) {
      case 'EXACT_SKU':
        return { label: 'SKU 일치', color: 'success' as const };
      default:
        return { label: matchType, color: 'default' as const };
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!settlement) {
    return <div>정산을 찾을 수 없습니다.</div>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <SnackbarComponent />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          정산 상세
        </Typography>
        <Button
          variant="outlined"
          color="error"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          startIcon={deleteMutation.isPending && <CircularProgress size={16} color="inherit" />}
        >
          {deleteMutation.isPending
            ? '삭제 중...'
            : deleteConfirmStep === 1
              ? '삭제 확인 (한 번 더 클릭)'
              : '정산 삭제'}
        </Button>
      </Box>

      {/* 관리자 액션 */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: '#f5f5f5' }}>
        <Typography variant="h6" sx={{ mb: 2, fontSize: 18, fontWeight: 600 }}>
          상태 변경
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>상태 변경</InputLabel>
            <Select
              value={selectedStatus}
              label="상태 변경"
              onChange={(e) => setSelectedStatus(e.target.value as SettlementStatus)}
            >
              {allSettlementStatuses.map((status) => (
                <MenuItem key={status} value={status} disabled={status === settlement.status}>
                  {settlementStatusLabel[status].label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={handleStatusChange}
            disabled={!selectedStatus || updateStatusMutation.isPending}
            startIcon={updateStatusMutation.isPending && <CircularProgress size={16} color="inherit" />}
            sx={{ height: 40 }}
          >
            {updateStatusMutation.isPending ? '변경 중...' : '상태 변경'}
          </Button>
        </Box>
      </Paper>

      {/* 정산 기본 정보 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontSize: 18, fontWeight: 600 }}>
          정산 정보
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="body2" color="text.secondary">
              정산 ID
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {settlement.id}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              정산일
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {settlement.settlementDate}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              상태
            </Typography>
            <Chip
              label={settlementStatusLabel[settlement.status as SettlementStatus]?.label || settlement.status}
              color={settlementStatusLabel[settlement.status as SettlementStatus]?.color || 'default'}
              size="small"
            />
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              처리자
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {settlement.processedBy}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              원 금액
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              ₩{settlement.originalAmount.toLocaleString()}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              최종 금액
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#4caf50' }}>
              ₩{settlement.finalAmount.toLocaleString()}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* 수령자 정보 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontSize: 18, fontWeight: 600 }}>
          수령자 정보
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="body2" color="text.secondary">
              이름
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {settlement.userName}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              이메일
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {settlement.userEmail}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              연락처
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {settlement.phoneNumber}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              은행
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {settlement.bankName}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              계좌번호
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {settlement.accountNumber}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              예금주
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {settlement.accountHolder}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* 수령/검수 정보 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontSize: 18, fontWeight: 600 }}>
          수령/검수 정보
        </Typography>
        {isLoadingRequest ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : requestDetail?.shippings && requestDetail.shippings.length > 0 ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>송장번호</TableCell>
                <TableCell>택배사</TableCell>
                <TableCell>앨범명</TableCell>
                <TableCell>보낸사람</TableCell>
                <TableCell align="center">수량</TableCell>
                <TableCell align="center">파손</TableCell>
                <TableCell align="center">싸인앨범</TableCell>
                <TableCell align="center">미공포</TableCell>
                <TableCell align="center">포토카드</TableCell>
                <TableCell>수령자</TableCell>
                <TableCell align="center">영상</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requestDetail.shippings.map((shipping) => (
                <TableRow key={shipping.id}>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{shipping.trackingNumber}</TableCell>
                  <TableCell>{shipping.shippingCompany || '-'}</TableCell>
                  <TableCell>{shipping.albumTitle || '-'}</TableCell>
                  <TableCell>{shipping.senderName || '-'}</TableCell>
                  <TableCell align="center">{shipping.actualQuantity ?? '-'}</TableCell>
                  <TableCell align="center">
                    {shipping.damagedCount != null && shipping.damagedCount > 0 ? (
                      <Chip size="small" label={shipping.damagedCount} color="error" />
                    ) : (
                      shipping.damagedCount ?? '-'
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {shipping.hasSignedAlbum ? (
                      <CheckCircleIcon color="warning" sx={{ fontSize: 18 }} />
                    ) : '-'}
                  </TableCell>
                  <TableCell align="center">
                    {shipping.hasUnreleasedPhotocard ? (
                      <CheckCircleIcon color="info" sx={{ fontSize: 18 }} />
                    ) : '-'}
                  </TableCell>
                  <TableCell align="center">{shipping.photocardCount ?? '-'}</TableCell>
                  <TableCell>{shipping.receivedBy || '-'}</TableCell>
                  <TableCell align="center">
                    {shipping.videoUrl ? (
                      <IconButton
                        size="small"
                        component={Link}
                        href={shipping.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        color="primary"
                      >
                        <PlayCircleOutlineIcon fontSize="small" />
                      </IconButton>
                    ) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
            수령 정보가 없습니다.
          </Typography>
        )}
      </Paper>

      {/* 정산 아이템 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontSize: 18, fontWeight: 600 }}>
          정산 아이템
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>음반명</TableCell>
              <TableCell>아티스트</TableCell>
              <TableCell>소속사</TableCell>
              <TableCell>ISBN</TableCell>
              <TableCell align="right">수량</TableCell>
              <TableCell align="right">최종 가격</TableCell>
              {settlement.status === 'COMPLETED' && (
                <TableCell align="center">재고 이동</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {settlement.items && settlement.items.length > 0 ? (
              settlement.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.albumTitle}</TableCell>
                  <TableCell>{item.albumArtist}</TableCell>
                  <TableCell>{item.entertainmentAgency}</TableCell>
                  <TableCell>{item.albumIsbn}</TableCell>
                  <TableCell align="right">{item.quantity || 1}</TableCell>
                  <TableCell align="right">
                    ₩{item.finalPrice.toLocaleString()}
                  </TableCell>
                  {settlement.status === 'COMPLETED' && (
                    <TableCell align="center">
                      {item.transferredToLogiProductId ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                          <CheckCircleIcon color="success" sx={{ fontSize: 18 }} />
                          <Typography variant="caption" color="success.main">
                            이동 완료 ({item.transferredQuantity}개)
                          </Typography>
                        </Box>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<LocalShippingIcon />}
                          onClick={() => handleOpenStockTransferDialog(item)}
                        >
                          재고 이동
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={settlement.status === 'COMPLETED' ? 7 : 6} align="center">
                  <Typography variant="body2" color="text.secondary">
                    아이템이 없습니다.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* 정산 완료 처리 */}
      {settlement.status === 'PENDING' && (
        <Paper sx={{ p: 3 }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontSize: 18, fontWeight: 600 }}
          >
            정산 완료 처리
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="송금일시"
              type="datetime-local"
              value={transferredAt}
              onChange={(e) => setTransferredAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="정산 메모"
              multiline
              rows={3}
              value={settlementNote}
              onChange={(e) => setSettlementNote(e.target.value)}
              placeholder="정산 관련 메모를 입력하세요"
            />
            <Button
              variant="contained"
              onClick={handleComplete}
              disabled={completeMutation.isPending}
              startIcon={
                completeMutation.isPending && (
                  <CircularProgress size={16} color="inherit" />
                )
              }
              sx={{
                background: '#4caf50',
                '&:hover': { background: '#45a049' },
                alignSelf: 'flex-start',
              }}
            >
              {completeMutation.isPending ? '처리 중...' : '정산 완료'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* 송금 정보 (완료된 경우) */}
      {settlement.status === 'COMPLETED' && settlement.transferredAt && (
        <Paper sx={{ p: 3 }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontSize: 18, fontWeight: 600 }}
          >
            송금 정보
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="body2" color="text.secondary">
                송금일시
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {new Date(settlement.transferredAt).toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                정산 메모
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {settlement.settlementNote || '-'}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* 재고 이동 다이얼로그 */}
      <Dialog
        open={stockTransferDialogOpen}
        onClose={handleCloseStockTransferDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">재고 이동</Typography>
          <IconButton onClick={handleCloseStockTransferDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedItemForTransfer && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                이동할 아이템
              </Typography>
              <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="body1" fontWeight={500}>
                  {selectedItemForTransfer.albumTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedItemForTransfer.albumArtist} | {selectedItemForTransfer.entertainmentAgency}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ISBN: {selectedItemForTransfer.albumIsbn}
                </Typography>
                <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                  수량: {selectedItemForTransfer.quantity || 1}개
                </Typography>
              </Paper>
            </Box>
          )}

          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            이동할 상품 선택
          </Typography>

          {isLoadingSimilar ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : similarProducts && similarProducts.length > 0 ? (
            <Box sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox"></TableCell>
                    <TableCell>상품명</TableCell>
                    <TableCell>아티스트</TableCell>
                    <TableCell>ISBN</TableCell>
                    <TableCell align="right">현재 재고</TableCell>
                    <TableCell>매칭 타입</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {similarProducts.map((product) => {
                    const matchLabel = getMatchTypeLabel(product.matchType);
                    return (
                      <TableRow
                        key={product.id}
                        hover
                        selected={selectedLogiProduct?.id === product.id}
                        onClick={() => setSelectedLogiProduct(product)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <input
                            type="radio"
                            checked={selectedLogiProduct?.id === product.id}
                            onChange={() => setSelectedLogiProduct(product)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={selectedLogiProduct?.id === product.id ? 600 : 400}>
                            {product.title}
                          </Typography>
                        </TableCell>
                        <TableCell>{product.artist}</TableCell>
                        <TableCell>{product.barcode}</TableCell>
                        <TableCell align="right">{product.stock}</TableCell>
                        <TableCell>
                          <Chip
                            label={matchLabel.label}
                            color={matchLabel.color}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#fafafa', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                유사한 상품을 찾을 수 없습니다.
              </Typography>
            </Paper>
          )}

          {selectedLogiProduct && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                선택된 상품
              </Typography>
              <Paper sx={{ p: 2, bgcolor: '#e3f2fd', mb: 2 }}>
                <Typography variant="body1" fontWeight={500}>
                  {selectedLogiProduct.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedLogiProduct.artist} | 현재 재고: {selectedLogiProduct.stock}개
                </Typography>
              </Paper>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="이동 수량"
                  type="number"
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(Number(e.target.value))}
                  inputProps={{ min: 1, max: selectedItemForTransfer?.quantity || 1 }}
                  size="small"
                  sx={{ width: 120 }}
                />
                <TextField
                  label="메모 (선택)"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  size="small"
                  sx={{ flex: 1, minWidth: 200 }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStockTransferDialog}>취소</Button>
          <Button
            variant="contained"
            onClick={handleTransferStock}
            disabled={!selectedLogiProduct || transferStockMutation.isPending}
            startIcon={transferStockMutation.isPending && <CircularProgress size={16} color="inherit" />}
          >
            {transferStockMutation.isPending ? '처리 중...' : '재고 이동'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
