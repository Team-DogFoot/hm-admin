'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import { useGetUsers } from '@/query/query/album-purchase/users';
import type { AlbumPurchaseUserLevel } from '@/types/albumPurchase';

const userLevelLabel: Record<AlbumPurchaseUserLevel, { label: string; color: 'default' | 'primary' | 'secondary' }> = {
  CUSTOMER: { label: '일반', color: 'default' },
  VIP: { label: 'VIP', color: 'primary' },
  ADMIN: { label: '관리자', color: 'secondary' },
};

export default function UsersPage() {
  const router = useRouter();
  const { data: users, isLoading } = useGetUsers();

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // 검색 필터링
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchTerm.trim()) return users;

    const term = searchTerm.toLowerCase();
    return users.filter(
      (user) =>
        user.userEmail?.toLowerCase().includes(term) ||
        user.userName?.toLowerCase().includes(term) ||
        user.nickName?.toLowerCase().includes(term) ||
        user.phoneNumber?.includes(term)
    );
  }, [users, searchTerm]);

  // 페이지네이션
  const paginatedUsers = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, page, rowsPerPage]);

  const handleRowClick = (userId: number) => {
    router.push(`/album-purchase/users/${userId}`);
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        고객 정보
      </Typography>

      <Paper sx={{ p: 3 }}>
        {/* 검색 */}
        <Box sx={{ mb: 3 }}>
          <TextField
            placeholder="이메일, 이름, 닉네임, 전화번호로 검색"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            size="small"
            sx={{ width: 400 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* 테이블 */}
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>이메일</TableCell>
                <TableCell>이름</TableCell>
                <TableCell>닉네임</TableCell>
                <TableCell>전화번호</TableCell>
                <TableCell>등급</TableCell>
                <TableCell>가입일</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUsers.map((user) => {
                const level = user.userLevel
                  ? userLevelLabel[user.userLevel]
                  : { label: '-', color: 'default' as const };
                return (
                  <TableRow
                    key={user.id}
                    hover
                    onClick={() => handleRowClick(user.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.userEmail}</TableCell>
                    <TableCell>{user.userName || '-'}</TableCell>
                    <TableCell>{user.nickName || '-'}</TableCell>
                    <TableCell>{user.phoneNumber || '-'}</TableCell>
                    <TableCell>
                      <Chip label={level.label} color={level.color} size="small" />
                    </TableCell>
                    <TableCell>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginatedUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    {searchTerm ? '검색 결과가 없습니다.' : '고객이 없습니다.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        <TablePagination
          component="div"
          count={filteredUsers.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="페이지당 항목"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
        />
      </Paper>
    </Box>
  );
}
