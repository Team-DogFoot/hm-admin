import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEligibleRequests,
  createSettlements,
  getSettlements,
  getSettlementDetail,
  completeSettlement,
  getDashboardStats,
  getSettlementReport,
  updateSettlementStatus,
  deleteSettlement,
  findSimilarProducts,
  transferStock,
  StockTransferRequest,
} from '../../api/album-purchase/settlements';
import type {
  CreateSettlementRequest,
  CompleteSettlementRequest,
  SettlementStatus,
  UpdateSettlementStatusRequest,
} from '@/types/albumPurchase';

// 정산 대상 조회
export function useGetEligibleRequests() {
  return useQuery({
    queryKey: ['album-purchase', 'eligible-requests'],
    queryFn: () => getEligibleRequests(),
  });
}

// 정산 목록 조회
export function useGetSettlements(params?: {
  status?: SettlementStatus;
  userId?: number;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['album-purchase', 'settlements', params],
    queryFn: () => getSettlements(params),
  });
}

// 정산 상세 조회
export function useGetSettlementDetail(settlementId: number) {
  return useQuery({
    queryKey: ['album-purchase', 'settlement', settlementId],
    queryFn: () => getSettlementDetail(settlementId),
    enabled: !!settlementId,
  });
}

// 정산 생성
export function useCreateSettlements() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestData: CreateSettlementRequest) =>
      createSettlements(requestData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'eligible-requests'],
      });
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'settlements'],
      });
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'requests'],
      });
    },
  });
}

// 정산 완료 처리
export function useCompleteSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      settlementId,
      requestData,
    }: {
      settlementId: number;
      requestData: CompleteSettlementRequest;
    }) => completeSettlement(settlementId, requestData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'settlements'],
      });
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'settlement', variables.settlementId],
      });
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'dashboard-stats'],
      });
    },
  });
}

// 대시보드 통계
export function useGetDashboardStats() {
  return useQuery({
    queryKey: ['album-purchase', 'dashboard-stats'],
    queryFn: () => getDashboardStats(),
  });
}

// 기간별 리포트
export function useGetSettlementReport(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['album-purchase', 'settlement-report', startDate, endDate],
    queryFn: () => getSettlementReport(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

// 정산 상태 변경
export function useUpdateSettlementStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      settlementId,
      requestData,
    }: {
      settlementId: number;
      requestData: UpdateSettlementStatusRequest;
    }) => updateSettlementStatus(settlementId, requestData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'settlements'],
      });
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'settlement', variables.settlementId],
      });
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'dashboard-stats'],
      });
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'requests'],
      });
    },
  });
}

// 정산 삭제
export function useDeleteSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settlementId: number) => deleteSettlement(settlementId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'settlements'],
      });
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'dashboard-stats'],
      });
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'requests'],
      });
    },
  });
}

// 유사 상품 검색
export function useFindSimilarProducts(settlementId: number, itemId: number, enabled = false) {
  return useQuery({
    queryKey: ['album-purchase', 'settlement', settlementId, 'item', itemId, 'similar-products'],
    queryFn: () => findSimilarProducts(settlementId, itemId),
    enabled: enabled && !!settlementId && !!itemId,
  });
}

// 재고 이동
export function useTransferStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      settlementId,
      itemId,
      requestData,
    }: {
      settlementId: number;
      itemId: number;
      requestData: StockTransferRequest;
    }) => transferStock(settlementId, itemId, requestData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'settlement', variables.settlementId],
      });
    },
  });
}
