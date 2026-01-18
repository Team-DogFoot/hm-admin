import { API_URL } from '@/constants/apis';
import { requests } from '../../request';
import type {
  QuickScanRequest,
  QuickScanResponse,
  UpdateReceiptRequest,
  UpdateVideoRequest,
  ScanReceiptRequest,
  ScanReceiptResponse,
  UnmatchedReceiptDetail,
  MatchReceiptRequest,
  ShippingInfo,
  AlbumPurchaseRequestSimple,
  UnmatchReceiptRequest,
  UnmatchReceiptResponse,
} from '@/types/albumPurchase';

const BASE_URL = `${API_URL}/logi/album-purchase/admin/receipt`;

// 퀵스캔 - 송장번호만으로 수령 건 생성
export const quickScanReceipt = async (
  requestData: QuickScanRequest,
): Promise<QuickScanResponse> => {
  const { data } = await requests({
    method: 'post',
    url: `${BASE_URL}/quick-scan`,
    data: requestData,
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
    throw new Error(customMessage);
  } else if (errorMessage) {
    alert(`${errorMessage}\n${errorCode}`);
    throw new Error(errorMessage);
  }

  return data as QuickScanResponse;
};

// 수령 건 상세 조회
export const getReceiptDetail = async (
  receiptId: number,
): Promise<UnmatchedReceiptDetail> => {
  const { data } = await requests({
    method: 'get',
    url: `${BASE_URL}/${receiptId}`,
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
    throw new Error(customMessage);
  } else if (errorMessage) {
    alert(`${errorMessage}\n${errorCode}`);
    throw new Error(errorMessage);
  }

  return data as UnmatchedReceiptDetail;
};

// 수령 건 상세 정보 수정
export const updateReceipt = async (
  receiptId: number,
  requestData: UpdateReceiptRequest,
): Promise<UnmatchedReceiptDetail> => {
  const { data } = await requests({
    method: 'put',
    url: `${BASE_URL}/${receiptId}`,
    data: requestData,
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
    throw new Error(customMessage);
  } else if (errorMessage) {
    alert(`${errorMessage}\n${errorCode}`);
    throw new Error(errorMessage);
  }

  return data as UnmatchedReceiptDetail;
};

// 수령 건 영상 URL 업데이트
export const updateReceiptVideoUrl = async (
  receiptId: number,
  requestData: UpdateVideoRequest,
): Promise<UnmatchedReceiptDetail> => {
  const { data } = await requests({
    method: 'put',
    url: `${BASE_URL}/${receiptId}/video`,
    data: requestData,
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
    throw new Error(customMessage);
  } else if (errorMessage) {
    alert(`${errorMessage}\n${errorCode}`);
    throw new Error(errorMessage);
  }

  return data as UnmatchedReceiptDetail;
};

// 수령 건 삭제
export const deleteReceipt = async (receiptId: number): Promise<void> => {
  const { data } = await requests({
    method: 'delete',
    url: `${BASE_URL}/${receiptId}`,
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
    throw new Error(customMessage);
  } else if (errorMessage) {
    alert(`${errorMessage}\n${errorCode}`);
    throw new Error(errorMessage);
  }
};

// 송장 스캔 (기존 - 전체 정보 포함)
export const scanReceipt = async (
  requestData: ScanReceiptRequest,
): Promise<ScanReceiptResponse> => {
  const { data } = await requests({
    method: 'post',
    url: `${BASE_URL}/scan`,
    data: requestData,
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
    throw new Error(customMessage);
  } else if (errorMessage) {
    alert(`${errorMessage}\n${errorCode}`);
    throw new Error(errorMessage);
  }

  return data as ScanReceiptResponse;
};

// 수령 건 목록 조회
export const getReceipts = async (params?: {
  isReceived?: boolean;
}): Promise<ShippingInfo[]> => {
  const { data } = await requests({
    method: 'get',
    url: `${BASE_URL}/list`,
    params,
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
    throw new Error(customMessage);
  } else if (errorMessage) {
    alert(`${errorMessage}\n${errorCode}`);
    throw new Error(errorMessage);
  }

  return data as ShippingInfo[];
};

// 미매칭 수령 건 목록
export const getUnmatchedReceipts = async (params?: {
  isMatched?: boolean;
}): Promise<UnmatchedReceiptDetail[]> => {
  const { data } = await requests({
    method: 'get',
    url: `${BASE_URL}/unmatched`,
    params,
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
    throw new Error(customMessage);
  } else if (errorMessage) {
    alert(`${errorMessage}\n${errorCode}`);
    throw new Error(errorMessage);
  }

  return data as UnmatchedReceiptDetail[];
};

// 미매칭 수령 건 매칭
export const matchUnmatchedReceipt = async (
  unmatchedReceiptId: number,
  requestData: MatchReceiptRequest,
): Promise<any> => {
  const { data } = await requests({
    method: 'post',
    url: `${BASE_URL}/unmatched/${unmatchedReceiptId}/match`,
    data: requestData,
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
    throw new Error(customMessage);
  } else if (errorMessage) {
    alert(`${errorMessage}\n${errorCode}`);
    throw new Error(errorMessage);
  }

  return data;
};

// 미매칭 수령 건 매칭 해제
export const unmatchReceipt = async (
  unmatchedReceiptId: number,
  requestData: UnmatchReceiptRequest,
): Promise<UnmatchReceiptResponse> => {
  const { data } = await requests({
    method: 'post',
    url: `${BASE_URL}/unmatched/${unmatchedReceiptId}/unmatch`,
    data: requestData,
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
    throw new Error(customMessage);
  } else if (errorMessage) {
    alert(`${errorMessage}\n${errorCode}`);
    throw new Error(errorMessage);
  }

  return data as UnmatchReceiptResponse;
};

// 매칭할 신청 건 검색
export const searchRequests = async (
  keyword?: string,
): Promise<AlbumPurchaseRequestSimple[]> => {
  const { data } = await requests({
    method: 'get',
    url: `${BASE_URL}/search`,
    params: { keyword },
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
    throw new Error(customMessage);
  } else if (errorMessage) {
    alert(`${errorMessage}\n${errorCode}`);
    throw new Error(errorMessage);
  }

  return data as AlbumPurchaseRequestSimple[];
};

// 영상 업로드용 Presigned URL 생성
export const createReceiptPresignedUrl = async (
  receiptId: number,
  fileName: string,
  fileType: string,
): Promise<{ presignedUrl: string; uploadFileUrl: string; receiptId: string }> => {
  const { data } = await requests({
    method: 'post',
    url: `${BASE_URL}/video/presign`,
    data: {
      receiptId: receiptId.toString(),
      fileName,
      fileType,
    },
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    throw new Error(customMessage);
  } else if (errorMessage) {
    throw new Error(errorMessage);
  }

  return data;
};
