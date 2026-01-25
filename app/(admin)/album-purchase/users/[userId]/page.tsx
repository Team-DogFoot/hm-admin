'use client';

import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useGetUserDetail } from '@/query/query/album-purchase/users';
import type {
  PurchaseRequestStatus,
  SettlementStatus,
  AlbumPurchaseUserLevel,
} from '@/types/albumPurchase';

const purchaseRequestStatusLabel: Record<PurchaseRequestStatus, { label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' }> = {
  DRAFT: { label: '임시저장', color: 'default' },
  NEED_NEGOTIATION: { label: '가격조정필요', color: 'warning' },
  SUBMITTED: { label: '제출됨', color: 'info' },
  SHIPPED: { label: '발송완료', color: 'info' },
  COMPLETE_TRACKING_NUMBER: { label: '송장등록완료', color: 'info' },
  RECEIVED_AND_MATCHED: { label: '입고및매칭완료', color: 'primary' },
  REVIEWING: { label: '검수중', color: 'primary' },
  FINAL_NEGOTIATION: { label: '최종협상', color: 'warning' },
  FINISH_REVIEW: { label: '검수완료', color: 'success' },
  PENDING_SETTLEMENT: { label: '정산대기', color: 'success' },
  SETTLEMENT_COMPLETED: { label: '정산완료', color: 'success' },
};

const settlementStatusLabel: Record<SettlementStatus, { label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'error' }> = {
  PENDING: { label: '대기', color: 'default' },
  IN_PROGRESS: { label: '진행중', color: 'primary' },
  COMPLETED: { label: '완료', color: 'success' },
  CANCELLED: { label: '취소', color: 'error' },
  HOLD: { label: '보류', color: 'warning' },
};

const userLevelLabel: Record<AlbumPurchaseUserLevel, string> = {
  CUSTOMER: '일반',
  VIP: 'VIP',
  ADMIN: '관리자',
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = Number(params.userId);

  const { data: user, isLoading } = useGetUserDetail(userId);

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

  if (!user) {
    return <div>고객을 찾을 수 없습니다.</div>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/album-purchase/users')}
        >
          목록
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          고객 상세 정보
        </Typography>
      </Box>

      {/* 기본 정보 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontSize: 18, fontWeight: 600 }}>
          기본 정보
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="body2" color="text.secondary">
              ID
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {user.id}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              이메일
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {user.userEmail}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              이름
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {user.userName || '-'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              닉네임
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {user.nickName || '-'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              전화번호
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {user.phoneNumber || '-'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              생년월일
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {user.birthDate || '-'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              등급
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {user.userLevel ? userLevelLabel[user.userLevel] : '-'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              가입일
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {user.createdAt ? new Date(user.createdAt).toLocaleString() : '-'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* 주소 정보 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontSize: 18, fontWeight: 600 }}>
          주소 정보
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 2,
          }}
        >
          <Box sx={{ gridColumn: { md: 'span 2' } }}>
            <Typography variant="body2" color="text.secondary">
              주소
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {user.address || '-'} {user.addressDetail} {user.zipcode && `(${user.zipcode})`}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* 정산 정보 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontSize: 18, fontWeight: 600 }}>
          정산 계좌 정보
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="body2" color="text.secondary">
              은행
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {user.bankName || '-'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              계좌번호
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {user.bankAccountNumber || '-'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              예금주
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {user.bankAccountHolderName || '-'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* 매입 신청 목록 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontSize: 18, fontWeight: 600 }}>
          매입 신청 내역 ({user.purchaseRequests?.length ?? 0}건)
        </Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>신청 ID</TableCell>
                <TableCell>행사</TableCell>
                <TableCell>앨범</TableCell>
                <TableCell align="right">총 금액</TableCell>
                <TableCell align="right">아이템 수</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>신청일</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {user.purchaseRequests && user.purchaseRequests.length > 0 ? (
                user.purchaseRequests.map((request) => {
                  const statusInfo = purchaseRequestStatusLabel[request.status] || {
                    label: request.status,
                    color: 'default' as const,
                  };
                  return (
                    <TableRow
                      key={request.requestId}
                      hover
                      onClick={() => router.push(`/album-purchase/requests/${request.requestId}`)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{request.requestId}</TableCell>
                      <TableCell>{request.eventTitle || '-'}</TableCell>
                      <TableCell>{request.albumTitle || '-'}</TableCell>
                      <TableCell align="right">
                        {request.totalEvaluatedPrice?.toLocaleString() ?? 0}
                      </TableCell>
                      <TableCell align="right">{request.itemCount ?? 0}</TableCell>
                      <TableCell>
                        <Chip
                          label={statusInfo.label}
                          color={statusInfo.color}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {request.createdAt
                          ? new Date(request.createdAt).toLocaleDateString()
                          : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    매입 신청 내역이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      {/* 정산 내역 */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontSize: 18, fontWeight: 600 }}>
          정산 내역 ({user.settlements?.length ?? 0}건)
        </Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>정산 ID</TableCell>
                <TableCell>정산일</TableCell>
                <TableCell align="right">최종 금액</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>생성일</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {user.settlements && user.settlements.length > 0 ? (
                user.settlements.map((settlement) => {
                  const statusInfo = settlementStatusLabel[settlement.status] || {
                    label: settlement.status,
                    color: 'default' as const,
                  };
                  return (
                    <TableRow
                      key={settlement.id}
                      hover
                      onClick={() => router.push(`/album-purchase/settlements/${settlement.id}`)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{settlement.id}</TableCell>
                      <TableCell>{settlement.settlementDate || '-'}</TableCell>
                      <TableCell align="right">
                        {settlement.finalAmount?.toLocaleString() ?? 0}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusInfo.label}
                          color={statusInfo.color}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {settlement.createdAt
                          ? new Date(settlement.createdAt).toLocaleDateString()
                          : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    정산 내역이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Box>
  );
}
