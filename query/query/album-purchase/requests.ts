import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRequests,
  getRequestDetail,
  acceptRequest,
  rejectRequest,
  proposePrice,
} from '../../api/album-purchase/requests';
import type {
  PurchaseRequestStatus,
  AcceptRequestDTO,
  RejectRequestDTO,
  ProposeRequestDTO,
} from '@/types/albumPurchase';

// 매입 신청 목록 조회
export function useGetRequests(params?: {
  status?: PurchaseRequestStatus;
  userId?: number;
  eventId?: number;
  hasNeedNegotiation?: boolean;
}) {
  return useQuery({
    queryKey: ['album-purchase', 'requests', params],
    queryFn: () => getRequests(params),
  });
}

// 매입 신청 상세 조회
export function useGetRequestDetail(requestId?: number) {
  return useQuery({
    queryKey: ['album-purchase', 'request', requestId],
    queryFn: () => {
      if (!requestId) {
        throw new Error('requestId is required');
      }
      return getRequestDetail(requestId);
    },
    enabled: !!requestId,
  });
}

// 매입 신청 수락
export function useAcceptRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      requestData,
    }: {
      requestId: number;
      requestData: AcceptRequestDTO;
    }) => acceptRequest(requestId, requestData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'requests'],
      });
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'request', variables.requestId],
      });
    },
  });
}

// 매입 신청 거절
export function useRejectRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      requestData,
    }: {
      requestId: number;
      requestData: RejectRequestDTO;
    }) => rejectRequest(requestId, requestData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'requests'],
      });
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'request', variables.requestId],
      });
    },
  });
}

// 가격 제안
export function useProposePrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      requestData,
    }: {
      requestId: number;
      requestData: ProposeRequestDTO;
    }) => proposePrice(requestId, requestData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'requests'],
      });
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'request', variables.requestId],
      });
    },
  });
}
