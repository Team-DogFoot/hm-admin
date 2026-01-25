'use client';

import { useState } from 'react';
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
import {
  useGetSettlementDetail,
  useCompleteSettlement,
  useUpdateSettlementStatus,
} from '@/query/query/album-purchase/settlements';
import { useSnackbar } from '../../_components/useSnackbar';
import type { SettlementStatus } from '@/types/albumPurchase';

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
  const completeMutation = useCompleteSettlement();
  const updateStatusMutation = useUpdateSettlementStatus();

  const [transferredAt, setTransferredAt] = useState(
    new Date().toISOString().slice(0, 16),
  );
  const [settlementNote, setSettlementNote] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<SettlementStatus | ''>('');

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
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        정산 상세
      </Typography>

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
              <TableCell align="right">최종 가격</TableCell>
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
                  <TableCell align="right">
                    ₩{item.finalPrice.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
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
    </Box>
  );
}
