import { API_URL } from '@/constants/apis';
import { requests } from '../../request';
import type {
  AlbumPurchaseUserSimple,
  AlbumPurchaseUserDetail,
} from '@/types/albumPurchase';

const BASE_URL = `${API_URL}/logi/album-purchase/admin/users`;

// 회원 목록 조회
export const getUsers = async (): Promise<AlbumPurchaseUserSimple[]> => {
  const { data } = await requests({
    method: 'get',
    url: BASE_URL,
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
    throw new Error(customMessage);
  } else if (errorMessage) {
    alert(`${errorMessage}\n${errorCode}`);
    throw new Error(errorMessage);
  }

  return data as AlbumPurchaseUserSimple[];
};

// 회원 상세 조회
export const getUserDetail = async (
  userId: number,
): Promise<AlbumPurchaseUserDetail> => {
  const { data } = await requests({
    method: 'get',
    url: `${BASE_URL}/${userId}`,
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
    throw new Error(customMessage);
  } else if (errorMessage) {
    alert(`${errorMessage}\n${errorCode}`);
    throw new Error(errorMessage);
  }

  return data as AlbumPurchaseUserDetail;
};
