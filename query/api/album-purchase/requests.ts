import { API_URL } from '@/constants/apis';
import { requests } from '../../request';
import type {
  AlbumPurchaseRequestSimple,
  AlbumPurchaseRequestDetail,
  PurchaseRequestStatus,
  AcceptRequestDTO,
  RejectRequestDTO,
  ProposeRequestDTO,
  UpdateStatusRequestDTO,
  UpdateStatusResponseDTO,
} from '@/types/albumPurchase';

const BASE_URL = `${API_URL}/logi/album-purchase/admin/request`;

// 매입 신청 목록 조회
export const getRequests = async (params?: {
  status?: PurchaseRequestStatus;
  userId?: number;
  eventId?: number;
  hasNeedNegotiation?: boolean;
}): Promise<AlbumPurchaseRequestSimple[]> => {
  const { data } = await requests({
    method: 'get',
    url: BASE_URL,
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

  return data as AlbumPurchaseRequestSimple[];
};

// 매입 신청 상세 조회
export const getRequestDetail = async (
  requestId: number,
): Promise<AlbumPurchaseRequestDetail> => {
  const { data } = await requests({
    method: 'get',
    url: `${BASE_URL}/${requestId}`,
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
    throw new Error(customMessage);
  } else if (errorMessage) {
    alert(`${errorMessage}\n${errorCode}`);
    throw new Error(errorMessage);
  }

  return data as AlbumPurchaseRequestDetail;
};

// 매입 신청 수락
export const acceptRequest = async (
  requestId: number,
  requestData: AcceptRequestDTO,
): Promise<any> => {
  const { data } = await requests({
    method: 'post',
    url: `${BASE_URL}/${requestId}/accept`,
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

// 매입 신청 거절
export const rejectRequest = async (
  requestId: number,
  requestData: RejectRequestDTO,
): Promise<any> => {
  const { data } = await requests({
    method: 'post',
    url: `${BASE_URL}/${requestId}/reject`,
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

// 가격 제안
export const proposePrice = async (
  requestId: number,
  requestData: ProposeRequestDTO,
): Promise<any> => {
  const { data } = await requests({
    method: 'post',
    url: `${BASE_URL}/${requestId}/propose-price`,
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

// 상태 변경
export const updateRequestStatus = async (
  requestId: number,
  requestData: UpdateStatusRequestDTO,
): Promise<UpdateStatusResponseDTO> => {
  const { data } = await requests({
    method: 'patch',
    url: `${BASE_URL}/${requestId}/status`,
    data: requestData,
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    throw new Error(customMessage);
  } else if (errorMessage) {
    throw new Error(errorMessage);
  }

  return data as UpdateStatusResponseDTO;
};
