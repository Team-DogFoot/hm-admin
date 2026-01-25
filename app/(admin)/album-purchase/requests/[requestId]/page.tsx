'use client';

import { useState, useMemo } from 'react';
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
import TablePagination from '@mui/material/TablePagination';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import {
  useGetRequestDetail,
  useAcceptRequest,
  useRejectRequest,
  useProposePrice,
  useDeleteRequest,
  useUpdateRequestItem,
  useForceUpdateRequestStatus,
  useFinishReviewAndCreateSettlement,
} from '@/query/query/album-purchase/requests';
import { useSnackbar } from '../../_components/useSnackbar';
import type { RequestItem, PurchaseAvailableType, EventPurchaseType, PurchaseRequestStatus } from '@/types/albumPurchase';

const purchaseAvailableTypeLabel: Record<string, { label: string; color: 'success' | 'warning' | 'error' }> = {
  AVAILABLE: { label: '매입가능', color: 'success' },
  NEED_NEGOTIATION: { label: '조정필요', color: 'warning' },
  UNAVAILABLE: { label: '매입불가', color: 'error' },
};

const eventPurchaseTypeLabel: Record<string, string> = {
  ONLY_PHOTOCARD: '포토카드만',
  ONLY_ALBUM: '앨범만',
  ALBUM_AND_PHOTOCARD: '앨범+포토카드',
  ETC: '기타',
};

const purchaseRequestStatusLabel: Record<PurchaseRequestStatus, string> = {
  DRAFT: '임시저장',
  NEED_NEGOTIATION: '가격조정필요',
  SUBMITTED: '제출됨',
  SHIPPED: '발송완료',
  COMPLETE_TRACKING_NUMBER: '송장등록완료',
  RECEIVED_AND_MATCHED: '입고및매칭완료',
  REVIEWING: '검수중',
  FINAL_NEGOTIATION: '최종협상',
  FINISH_REVIEW: '검수완료',
  PENDING_SETTLEMENT: '정산대기',
  SETTLEMENT_COMPLETED: '정산완료',
};

const allPurchaseRequestStatuses: PurchaseRequestStatus[] = [
  'DRAFT',
  'NEED_NEGOTIATION',
  'SUBMITTED',
  'SHIPPED',
  'COMPLETE_TRACKING_NUMBER',
  'RECEIVED_AND_MATCHED',
  'REVIEWING',
  'FINAL_NEGOTIATION',
  'FINISH_REVIEW',
  'PENDING_SETTLEMENT',
  'SETTLEMENT_COMPLETED',
];

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = Number(params.requestId);
  const { showSnackbar, SnackbarComponent } = useSnackbar();

  const { data: request, isLoading } = useGetRequestDetail(requestId);
  const acceptMutation = useAcceptRequest();
  const rejectMutation = useRejectRequest();
  const proposeMutation = useProposePrice();
  const deleteMutation = useDeleteRequest();
  const updateItemMutation = useUpdateRequestItem();
  const forceStatusMutation = useForceUpdateRequestStatus();
  const finishReviewMutation = useFinishReviewAndCreateSettlement();

  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<PurchaseRequestStatus | ''>('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [proposalNote, setProposalNote] = useState('');

  // 아이템 목록 페이지네이션
  const [itemsPage, setItemsPage] = useState(0);
  const [itemsRowsPerPage, setItemsRowsPerPage] = useState(10);

  // 아이템 수정 다이얼로그
  const [editingItem, setEditingItem] = useState<RequestItem | null>(null);
  const [editFormData, setEditFormData] = useState<{
    purchaseAvailableType?: PurchaseAvailableType;
    evaluatedPrice?: number;
    quantity?: number;
    note?: string;
  }>({});

  const handleAccept = async () => {
    if (confirm('이 매입 신청을 수락하시겠습니까?')) {
      try {
        await acceptMutation.mutateAsync({
          requestId,
          requestData: { reviewerNote: '수락됨' },
        });
        showSnackbar('수락되었습니다.', 'success');
        setTimeout(() => router.refresh(), 1000);
      } catch (error: any) {
        showSnackbar(error?.message || '수락에 실패했습니다.', 'error');
      }
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showSnackbar('거절 사유를 입력해주세요.', 'warning');
      return;
    }
    if (confirm('이 매입 신청을 거절하시겠습니까?')) {
      try {
        await rejectMutation.mutateAsync({
          requestId,
          requestData: { rejectionReason },
        });
        showSnackbar('거절되었습니다.', 'success');
        setTimeout(() => router.refresh(), 1000);
      } catch (error: any) {
        showSnackbar(error?.message || '거절에 실패했습니다.', 'error');
      }
    }
  };

  const handlePropose = async () => {
    if (!proposedPrice.trim()) {
      showSnackbar('제안 가격을 입력해주세요.', 'warning');
      return;
    }
    if (confirm('가격을 제안하시겠습니까?')) {
      try {
        await proposeMutation.mutateAsync({
          requestId,
          requestData: {
            proposedPrice: Number(proposedPrice),
            proposalNote,
            proposedBy: 'admin',
          },
        });
        showSnackbar('가격이 제안되었습니다.', 'success');
        setTimeout(() => router.refresh(), 1000);
      } catch (error: any) {
        showSnackbar(error?.message || '가격 제안에 실패했습니다.', 'error');
      }
    }
  };

  const handleDelete = async () => {
    if (confirm('이 매입 신청을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        await deleteMutation.mutateAsync(requestId);
        showSnackbar('삭제되었습니다.', 'success');
        setTimeout(() => router.push('/album-purchase/requests'), 1000);
      } catch (error: any) {
        showSnackbar(error?.message || '삭제에 실패했습니다.', 'error');
      }
    }
  };

  const handleEditItem = (item: RequestItem) => {
    setEditingItem(item);
    setEditFormData({
      purchaseAvailableType: item.purchaseAvailableType,
      evaluatedPrice: item.evaluatedPrice,
      quantity: item.quantity,
      note: item.note || '',
    });
  };

  const handleCloseEditDialog = () => {
    setEditingItem(null);
    setEditFormData({});
  };

  const handleSaveItem = async () => {
    if (!editingItem) return;
    try {
      await updateItemMutation.mutateAsync({
        requestId,
        itemId: editingItem.requestItemId,
        requestData: editFormData,
      });
      showSnackbar('아이템이 수정되었습니다.', 'success');
      handleCloseEditDialog();
    } catch (error: any) {
      showSnackbar(error?.message || '수정에 실패했습니다.', 'error');
    }
  };

  const canDelete = request && (request.status === 'DRAFT' || request.status === 'NEED_NEGOTIATION');

  const handleForceStatusChange = async () => {
    if (!selectedStatus) {
      showSnackbar('상태를 선택해주세요.', 'warning');
      return;
    }
    if (confirm(`상태를 '${purchaseRequestStatusLabel[selectedStatus]}'(으)로 변경하시겠습니까?`)) {
      try {
        await forceStatusMutation.mutateAsync({
          requestId,
          requestData: { status: selectedStatus },
        });
        showSnackbar('상태가 변경되었습니다.', 'success');
        setSelectedStatus('');
      } catch (error: any) {
        showSnackbar(error?.message || '상태 변경에 실패했습니다.', 'error');
      }
    }
  };

  const handleFinishReview = async () => {
    if (confirm('검수를 완료하고 정산 건을 생성하시겠습니까?\n\n이 작업 후에는 매입 신청 목록에서 보이지 않게 됩니다.')) {
      try {
        await finishReviewMutation.mutateAsync({
          requestId,
          processedBy: 'admin',
        });
        showSnackbar('검수완료 및 정산 건이 생성되었습니다.', 'success');
        setTimeout(() => router.push('/album-purchase/requests'), 1000);
      } catch (error: any) {
        showSnackbar(error?.message || '검수완료 처리에 실패했습니다.', 'error');
      }
    }
  };

  // 페이지네이션된 아이템
  const paginatedItems = useMemo(() => {
    if (!request?.items) return [];
    const start = itemsPage * itemsRowsPerPage;
    return request.items.slice(start, start + itemsRowsPerPage);
  }, [request?.items, itemsPage, itemsRowsPerPage]);

  // 전체 합계 계산
  const totalSummary = useMemo(() => {
    if (!request?.items) return { quantity: 0, price: 0 };
    return {
      quantity: request.items.reduce((sum, item) => sum + (item.quantity ?? 1), 0),
      price: request.items.reduce((sum, item) => sum + (item.finalPrice ?? 0), 0),
    };
  }, [request?.items]);

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

  if (!request) {
    return <div>요청을 찾을 수 없습니다.</div>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <SnackbarComponent />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          매입 신청 상세
        </Typography>
        {canDelete && (
          <Button
            variant="outlined"
            color="error"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            startIcon={deleteMutation.isPending && <CircularProgress size={16} color="inherit" />}
          >
            {deleteMutation.isPending ? '삭제 중...' : '신청 삭제'}
          </Button>
        )}
      </Box>

      {/* 관리자 액션 */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: '#f5f5f5' }}>
        <Typography variant="h6" sx={{ mb: 2, fontSize: 18, fontWeight: 600 }}>
          관리자 액션
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* 상태 강제 변경 */}
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>상태 변경</InputLabel>
            <Select
              value={selectedStatus}
              label="상태 변경"
              onChange={(e) => setSelectedStatus(e.target.value as PurchaseRequestStatus)}
            >
              {allPurchaseRequestStatuses.map((status) => (
                <MenuItem key={status} value={status} disabled={status === request.status}>
                  {purchaseRequestStatusLabel[status]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={handleForceStatusChange}
            disabled={!selectedStatus || forceStatusMutation.isPending}
            startIcon={forceStatusMutation.isPending && <CircularProgress size={16} color="inherit" />}
            sx={{ height: 40 }}
          >
            {forceStatusMutation.isPending ? '변경 중...' : '상태 변경'}
          </Button>

          {/* 검수완료 버튼 - REVIEWING 상태일 때만 표시 */}
          {request.status === 'REVIEWING' && (
            <Button
              variant="contained"
              color="success"
              onClick={handleFinishReview}
              disabled={finishReviewMutation.isPending}
              startIcon={finishReviewMutation.isPending && <CircularProgress size={16} color="inherit" />}
              sx={{ height: 40, ml: 'auto' }}
            >
              {finishReviewMutation.isPending ? '처리 중...' : '검수완료 (정산 생성)'}
            </Button>
          )}
        </Box>
      </Paper>

      {/* 신청 정보 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontSize: 18, fontWeight: 600 }}>
          신청 정보
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
              신청 ID
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {request.requestId}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              상태
            </Typography>
            <Chip
              label={purchaseRequestStatusLabel[request.status as PurchaseRequestStatus] || request.status}
              size="small"
              color="primary"
            />
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              총 평가 금액
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              ₩{request.totalEvaluatedPrice?.toLocaleString() ?? 0}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              총 수량
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {request.totalEvaluatedStock ?? 0}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              행사
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {request.eventTitle || '-'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              신청일시
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {request.createdAt ? new Date(request.createdAt).toLocaleString() : '-'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* 신청자 정보 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontSize: 18, fontWeight: 600 }}>
          신청자 정보
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
              {request.userName || '-'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              이메일
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {request.userEmail || '-'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* 배송지 정보 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontSize: 18, fontWeight: 600 }}>
          배송지 정보
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
              수령인
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {request.recipientName || '-'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              연락처
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {request.recipientPhone || '-'}
            </Typography>
          </Box>
          <Box sx={{ gridColumn: { md: 'span 2' } }}>
            <Typography variant="body2" color="text.secondary">
              주소
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {request.address} {request.addressDetail} {request.zipcode && `(${request.zipcode})`}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* 정산 정보 */}
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
              은행
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {request.bankName || '-'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              계좌번호
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {request.bankAccountNumber || '-'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              예금주
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {request.bankAccountHolderName || '-'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* 아이템 목록 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 600 }}>
            아이템 목록 ({request.items?.length ?? 0}건)
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip
              label={`총 수량: ${totalSummary.quantity.toLocaleString()}`}
              variant="outlined"
              size="small"
            />
            <Chip
              label={`총 금액: ₩${totalSummary.price.toLocaleString()}`}
              color="primary"
              size="small"
            />
          </Box>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>순서</TableCell>
                <TableCell>이미지</TableCell>
                <TableCell>음반명</TableCell>
                <TableCell>아티스트</TableCell>
                <TableCell>ISBN</TableCell>
                <TableCell>매입유형</TableCell>
                <TableCell>매입상태</TableCell>
                <TableCell align="right">단가</TableCell>
                <TableCell align="right">수량</TableCell>
                <TableCell align="right">합계</TableCell>
                <TableCell>비고</TableCell>
                <TableCell align="center">수정</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedItems.map((item) => {
                const availableType = purchaseAvailableTypeLabel[item.purchaseAvailableType] || { label: item.purchaseAvailableType, color: 'default' as const };
                return (
                  <TableRow key={item.requestItemId}>
                    <TableCell>{item.itemOrder}</TableCell>
                    <TableCell>
                      {item.albumThumbnailUrl ? (
                        <Box
                          component="img"
                          src={item.albumThumbnailUrl}
                          alt={item.albumTitle}
                          sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1 }}
                        />
                      ) : (
                        <Box sx={{ width: 40, height: 40, bgcolor: '#f0f0f0', borderRadius: 1 }} />
                      )}
                    </TableCell>
                    <TableCell>{item.albumTitle || '-'}</TableCell>
                    <TableCell>{item.albumArtist || '-'}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{item.albumIsbn || '-'}</TableCell>
                    <TableCell>
                      {item.eventPurchaseType ? eventPurchaseTypeLabel[item.eventPurchaseType] || item.eventPurchaseType : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={availableType.label}
                        color={availableType.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      ₩{(item.evaluatedPrice ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">{item.quantity ?? 1}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      ₩{(item.finalPrice ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 150, fontSize: 12 }}>
                      {item.note || '-'}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleEditItem(item)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginatedItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    아이템이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
        {(request.items?.length ?? 0) > 10 && (
          <TablePagination
            component="div"
            count={request.items?.length ?? 0}
            page={itemsPage}
            onPageChange={(_, newPage) => setItemsPage(newPage)}
            rowsPerPage={itemsRowsPerPage}
            onRowsPerPageChange={(e) => {
              setItemsRowsPerPage(parseInt(e.target.value, 10));
              setItemsPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="페이지당 항목"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
          />
        )}
      </Paper>

      {/* 사용자 등록 송장 목록 */}
      {request.trackingNumbers && request.trackingNumbers.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontSize: 18, fontWeight: 600 }}>
            사용자 등록 송장
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>송장번호</TableCell>
                <TableCell>택배사</TableCell>
                <TableCell>매칭 여부</TableCell>
                <TableCell>등록일</TableCell>
                <TableCell>매칭일</TableCell>
                <TableCell>메모</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {request.trackingNumbers.map((tn) => (
                <TableRow key={tn.trackingNumberId}>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{tn.trackingNumber}</TableCell>
                  <TableCell>{tn.shippingCompany || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={tn.isMatched ? '매칭완료' : '대기'}
                      color={tn.isMatched ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {tn.createdAt ? new Date(tn.createdAt).toLocaleString() : '-'}
                  </TableCell>
                  <TableCell>
                    {tn.matchedAt ? new Date(tn.matchedAt).toLocaleString() : '-'}
                  </TableCell>
                  <TableCell>{tn.memo || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* 배송 정보 */}
      {request.shippings && request.shippings.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontSize: 18, fontWeight: 600 }}
          >
            입고 정보
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>송장번호</TableCell>
                <TableCell>택배사</TableCell>
                <TableCell>수량</TableCell>
                <TableCell>포토카드</TableCell>
                <TableCell>싸인앨범</TableCell>
                <TableCell>수령 여부</TableCell>
                <TableCell>수령일</TableCell>
                <TableCell>수령자</TableCell>
                <TableCell>영상</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {request.shippings.map((shipping) => (
                <TableRow key={shipping.shippingId}>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{shipping.trackingNumber}</TableCell>
                  <TableCell>{shipping.shippingCompany || '-'}</TableCell>
                  <TableCell>{shipping.actualQuantity ?? '-'}</TableCell>
                  <TableCell>{shipping.photocardCount ?? '-'}</TableCell>
                  <TableCell>
                    {shipping.hasSignedAlbum !== undefined ? (
                      <Chip
                        label={shipping.hasSignedAlbum ? '있음' : '없음'}
                        color={shipping.hasSignedAlbum ? 'warning' : 'default'}
                        size="small"
                      />
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={shipping.isReceived ? '완료' : '대기'}
                      color={shipping.isReceived ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {shipping.receivedAt
                      ? new Date(shipping.receivedAt).toLocaleString()
                      : '-'}
                  </TableCell>
                  <TableCell>{shipping.receivedBy || '-'}</TableCell>
                  <TableCell>
                    {shipping.videoUrl ? (
                      <Button
                        size="small"
                        variant="outlined"
                        href={shipping.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        영상
                      </Button>
                    ) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* 거부/메모 정보 */}
      {(request.rejectionReason || request.reviewerNote) && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontSize: 18, fontWeight: 600 }}>
            관리자 메모
          </Typography>
          <Box sx={{ display: 'grid', gap: 2 }}>
            {request.rejectionReason && (
              <Box>
                <Typography variant="body2" color="error">
                  거절 사유
                </Typography>
                <Typography variant="body1">{request.rejectionReason}</Typography>
              </Box>
            )}
            {request.reviewerNote && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  검토자 메모
                </Typography>
                <Typography variant="body1">{request.reviewerNote}</Typography>
              </Box>
            )}
          </Box>
        </Paper>
      )}

      {/* 가격조정 필요 상태일 때 액션 */}
      {request.status === 'NEED_NEGOTIATION' && (
        <Paper sx={{ p: 3 }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontSize: 18, fontWeight: 600 }}
          >
            매입 신청 처리
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleAccept}
              disabled={acceptMutation.isPending}
              sx={{
                background: '#4caf50',
                '&:hover': { background: '#45a049' },
              }}
              startIcon={
                acceptMutation.isPending && (
                  <CircularProgress size={16} color="inherit" />
                )
              }
            >
              {acceptMutation.isPending ? '처리 중...' : '수락'}
            </Button>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                placeholder="거절 사유"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                size="small"
              />
              <Button
                variant="contained"
                color="error"
                onClick={handleReject}
                disabled={rejectMutation.isPending}
                startIcon={
                  rejectMutation.isPending && (
                    <CircularProgress size={16} color="inherit" />
                  )
                }
                sx={{ minWidth: 120 }}
              >
                {rejectMutation.isPending ? '처리 중...' : '거절'}
              </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                type="number"
                placeholder="제안 가격"
                value={proposedPrice}
                onChange={(e) => setProposedPrice(e.target.value)}
                size="small"
                sx={{ width: 150 }}
              />
              <TextField
                fullWidth
                placeholder="제안 메모"
                value={proposalNote}
                onChange={(e) => setProposalNote(e.target.value)}
                size="small"
              />
              <Button
                variant="contained"
                onClick={handlePropose}
                disabled={proposeMutation.isPending}
                sx={{
                  background: '#ff9800',
                  '&:hover': { background: '#e68900' },
                  minWidth: 120,
                }}
                startIcon={
                  proposeMutation.isPending && (
                    <CircularProgress size={16} color="inherit" />
                  )
                }
              >
                {proposeMutation.isPending ? '처리 중...' : '가격 제안'}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* 아이템 수정 다이얼로그 */}
      <Dialog open={!!editingItem} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>아이템 수정</DialogTitle>
        <DialogContent>
          {editingItem && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {editingItem.albumTitle} - {editingItem.albumArtist}
              </Typography>

              <TextField
                select
                label="매입상태"
                value={editFormData.purchaseAvailableType || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, purchaseAvailableType: e.target.value as PurchaseAvailableType }))}
                fullWidth
                size="small"
              >
                <MenuItem value="AVAILABLE">매입가능</MenuItem>
                <MenuItem value="NEED_NEGOTIATION">조정필요</MenuItem>
                <MenuItem value="UNAVAILABLE">매입불가</MenuItem>
              </TextField>

              <TextField
                label="단가"
                type="number"
                value={editFormData.evaluatedPrice ?? ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, evaluatedPrice: e.target.value ? parseInt(e.target.value) : undefined }))}
                fullWidth
                size="small"
                InputProps={{ startAdornment: <Typography sx={{ mr: 0.5 }}>₩</Typography> }}
              />

              <TextField
                label="수량"
                type="number"
                value={editFormData.quantity ?? ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, quantity: e.target.value ? parseInt(e.target.value) : undefined }))}
                fullWidth
                size="small"
              />

              <TextField
                label="비고"
                value={editFormData.note || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, note: e.target.value }))}
                fullWidth
                size="small"
                multiline
                rows={2}
              />

              {editFormData.evaluatedPrice && editFormData.quantity && (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  합계: ₩{((editFormData.evaluatedPrice || 0) * (editFormData.quantity || 1)).toLocaleString()}
                </Typography>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseEditDialog} disabled={updateItemMutation.isPending}>
            취소
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveItem}
            disabled={updateItemMutation.isPending}
            startIcon={updateItemMutation.isPending && <CircularProgress size={16} color="inherit" />}
          >
            {updateItemMutation.isPending ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
