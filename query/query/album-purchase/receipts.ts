import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  quickScanReceipt,
  getReceiptDetail,
  updateReceipt,
  updateReceiptVideoUrl,
  deleteReceipt,
  scanReceipt,
  getReceipts,
  getUnmatchedReceipts,
  matchUnmatchedReceipt,
  searchRequests,
  unmatchReceipt,
} from '../../api/album-purchase/receipts';
import type {
  QuickScanRequest,
  UpdateReceiptRequest,
  UpdateVideoRequest,
  ScanReceiptRequest,
  MatchReceiptRequest,
} from '@/types/albumPurchase';

// 퀵스캔 - 송장번호만으로 수령 건 생성
export function useQuickScanReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestData: QuickScanRequest) => quickScanReceipt(requestData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'unmatched-receipts'],
      });
    },
  });
}

// 수령 건 상세 조회
export function useGetReceiptDetail(receiptId?: number) {
  return useQuery({
    queryKey: ['album-purchase', 'receipt', receiptId],
    queryFn: () => getReceiptDetail(receiptId!),
    enabled: !!receiptId,
  });
}

// 수령 건 상세 정보 수정
export function useUpdateReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      receiptId,
      requestData,
    }: {
      receiptId: number;
      requestData: UpdateReceiptRequest;
    }) => updateReceipt(receiptId, requestData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'receipt', variables.receiptId],
      });
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'unmatched-receipts'],
      });
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'receipts'],
      });
    },
  });
}

// 수령 건 영상 URL 업데이트
export function useUpdateReceiptVideoUrl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      receiptId,
      requestData,
    }: {
      receiptId: number;
      requestData: UpdateVideoRequest;
    }) => updateReceiptVideoUrl(receiptId, requestData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'receipt', variables.receiptId],
      });
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'unmatched-receipts'],
      });
    },
  });
}

// 수령 건 삭제
export function useDeleteReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (receiptId: number) => deleteReceipt(receiptId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'unmatched-receipts'],
      });
    },
  });
}

// 수령 건 목록 조회
export function useGetReceipts(params?: { isReceived?: boolean }) {
  return useQuery({
    queryKey: ['album-purchase', 'receipts', params?.isReceived ?? null],
    queryFn: () => getReceipts(params),
  });
}

// 미매칭 수령 건 목록
export function useGetUnmatchedReceipts(params?: { isMatched?: boolean }) {
  return useQuery({
    queryKey: ['album-purchase', 'unmatched-receipts', params?.isMatched ?? null],
    queryFn: () => getUnmatchedReceipts(params),
  });
}

// 송장 스캔
export function useScanReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestData: ScanReceiptRequest) => scanReceipt(requestData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'receipts'],
      });
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'unmatched-receipts'],
      });
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'requests'],
      });
    },
  });
}

// 미매칭 수령 건 매칭
export function useMatchUnmatchedReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      unmatchedReceiptId,
      requestData,
    }: {
      unmatchedReceiptId: number;
      requestData: MatchReceiptRequest;
    }) => matchUnmatchedReceipt(unmatchedReceiptId, requestData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'unmatched-receipts'],
      });
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'receipts'],
      });
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'requests'],
      });
      if (variables.requestData.requestId) {
        queryClient.invalidateQueries({
          queryKey: ['album-purchase', 'request', variables.requestData.requestId],
        });
      }
    },
  });
}

// 미매칭 수령 건 매칭 해제
export function useUnmatchReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      unmatchedReceiptId,
      requestData,
    }: {
      unmatchedReceiptId: number;
      requestData: { unmatchedBy: string; reason?: string };
    }) => unmatchReceipt(unmatchedReceiptId, requestData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'unmatched-receipts'],
      });
      queryClient.invalidateQueries({
        queryKey: ['album-purchase', 'receipts'],
      });
    },
  });
}

// 매칭할 신청 건 검색
export function useSearchRequests(keyword?: string) {
  return useQuery({
    queryKey: ['album-purchase', 'search-requests', keyword ?? ''],
    queryFn: () => searchRequests(keyword),
  });
}
