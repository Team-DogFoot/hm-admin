import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRequests,
  getRequestDetail,
  acceptRequest,
  rejectRequest,
  proposePrice,
  updateRequestStatus,
  deleteRequest,
  updateRequestItem,
  forceUpdateRequestStatus,
  finishReviewAndCreateSettlement,
} from '../../api/album-purchase/requests';
import type {
  PurchaseRequestStatus,
  AcceptRequestDTO,
  RejectRequestDTO,
  ProposeRequestDTO,
  UpdateStatusRequestDTO,
  UpdateRequestItemDTO,
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

// 상태 변경
export function useUpdateRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      requestData,
    }: {
      requestId: number;
      requestData: UpdateStatusRequestDTO;
    }) => updateRequestStatus(requestId, requestData),
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

// 매입 신청 삭제
export function useDeleteRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: number) => deleteRequest(requestId),
    onSuccess: (_, requestId) => {
      // 모든 requests 관련 쿼리 무효화 (params가 다른 쿼리들 포함)
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'album-purchase' &&
          query.queryKey[1] === 'requests',
      });
      // 삭제된 request의 상세 캐시 제거
      queryClient.removeQueries({
        queryKey: ['album-purchase', 'request', requestId],
      });
    },
  });
}

// 매입 신청 아이템 수정
export function useUpdateRequestItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      itemId,
      requestData,
    }: {
      requestId: number;
      itemId: number;
      requestData: UpdateRequestItemDTO;
    }) => updateRequestItem(requestId, itemId, requestData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'request', variables.requestId],
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'album-purchase' &&
          query.queryKey[1] === 'requests',
      });
    },
  });
}

// 매입 신청 상태 강제 변경
export function useForceUpdateRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      requestData,
    }: {
      requestId: number;
      requestData: UpdateStatusRequestDTO;
    }) => forceUpdateRequestStatus(requestId, requestData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'request', variables.requestId],
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'album-purchase' &&
          query.queryKey[1] === 'requests',
      });
    },
  });
}

// 검수완료 및 정산 생성
export function useFinishReviewAndCreateSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      processedBy,
    }: {
      requestId: number;
      processedBy?: string;
    }) => finishReviewAndCreateSettlement(requestId, processedBy),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'request', variables.requestId],
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'album-purchase' &&
          query.queryKey[1] === 'requests',
      });
      // 정산 목록도 무효화
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'settlements'],
      });
    },
  });
}
