import { API_URL } from '@/constants/apis';
import { requests } from '../../request';
import type {
  SettlementSimple,
  SettlementDetail,
  EligibleRequest,
  CreateSettlementRequest,
  CompleteSettlementRequest,
  UpdateSettlementStatusRequest,
  SettlementStatus,
  DashboardStats,
  PeriodReport,
} from '@/types/albumPurchase';

const BASE_URL = `${API_URL}/logi/album-purchase/admin/settlement`;

// 정산 대상 조회
export const getEligibleRequests = async (): Promise<EligibleRequest[]> => {
  const { data } = await requests({
    method: 'get',
    url: `${BASE_URL}/eligible`,
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
    throw new Error(customMessage);
  } else if (errorMessage) {
    alert(`${errorMessage}\n${errorCode}`);
    throw new Error(errorMessage);
  }

  return data as EligibleRequest[];
};

// 정산 생성
export const createSettlements = async (
  requestData: CreateSettlementRequest,
): Promise<any> => {
  const { data } = await requests({
    method: 'post',
    url: `${BASE_URL}/create`,
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

// 정산 목록 조회
export const getSettlements = async (params?: {
  status?: SettlementStatus;
  userId?: number;
  startDate?: string;
  endDate?: string;
}): Promise<SettlementSimple[]> => {
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

  return data as SettlementSimple[];
};

// 정산 상세 조회
export const getSettlementDetail = async (
  settlementId: number,
): Promise<SettlementDetail> => {
  const { data } = await requests({
    method: 'get',
    url: `${BASE_URL}/${settlementId}`,
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
    throw new Error(customMessage);
  } else if (errorMessage) {
    alert(`${errorMessage}\n${errorCode}`);
    throw new Error(errorMessage);
  }

  return data as SettlementDetail;
};

// 정산 완료 처리
export const completeSettlement = async (
  settlementId: number,
  requestData: CompleteSettlementRequest,
): Promise<SettlementDetail> => {
  const { data } = await requests({
    method: 'post',
    url: `${BASE_URL}/${settlementId}/complete`,
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

  return data as SettlementDetail;
};

// 대시보드 통계
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await requests({
    method: 'get',
    url: `${BASE_URL}/stats`,
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
    throw new Error(customMessage);
  } else if (errorMessage) {
    alert(`${errorMessage}\n${errorCode}`);
    throw new Error(errorMessage);
  }

  return data as DashboardStats;
};

// 기간별 리포트
export const getSettlementReport = async (
  startDate: string,
  endDate: string,
): Promise<PeriodReport> => {
  const { data } = await requests({
    method: 'get',
    url: `${BASE_URL}/report`,
    params: { startDate, endDate },
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
    throw new Error(customMessage);
  } else if (errorMessage) {
    alert(`${errorMessage}\n${errorCode}`);
    throw new Error(errorMessage);
  }

  return data as PeriodReport;
};

// 정산 상태 변경
export const updateSettlementStatus = async (
  settlementId: number,
  requestData: UpdateSettlementStatusRequest,
): Promise<SettlementDetail> => {
  const { data } = await requests({
    method: 'patch',
    url: `${BASE_URL}/${settlementId}/status`,
    data: requestData,
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    throw new Error(customMessage);
  } else if (errorMessage) {
    throw new Error(errorMessage);
  }

  return data as SettlementDetail;
};
