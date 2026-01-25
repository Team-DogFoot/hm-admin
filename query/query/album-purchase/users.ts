import { useQuery } from '@tanstack/react-query';
import { getUsers, getUserDetail } from '../../api/album-purchase/users';

// 회원 목록 조회
export function useGetUsers() {
  return useQuery({
    queryKey: ['album-purchase', 'users'],
    queryFn: () => getUsers(),
  });
}

// 회원 상세 조회
export function useGetUserDetail(userId?: number) {
  return useQuery({
    queryKey: ['album-purchase', 'user', userId],
    queryFn: () => {
      if (!userId) {
        throw new Error('userId is required');
      }
      return getUserDetail(userId);
    },
    enabled: !!userId,
  });
}
