import { API_URL } from '@/constants/apis';
import { requests } from '../../request';

const BASE_URL = `${API_URL}/logi/album-purchase/admin`;

export interface AlbumPurchase {
  id: number;
  isbn: string;
  title: string;
  artist: string;
  releaseDate: string;
  entertainmentAgency?: string;
  sku?: string;
  memo?: string;
  salePrice: number;
  defaultPurchasePrice: number;
  currentStock: number;
  softPurchaseLimit: number;
  hardPurchaseLimit: number;
  isDeleted: boolean;
  isVisible: boolean;
  albumDescription?: string;
  createdAt: string;
  updatedAt: string;
  // 썸네일 이미지 URL 목록
  thumbnailImageUrls?: string[];
}

export interface CreateAlbumRequest {
  isbn: string;
  title: string;
  artist: string;
  releaseDate: string;
  entertainmentAgency?: string;
  albumDescription?: string;
  memo?: string;
  salePrice: number;
  defaultPurchasePrice: number;
  currentStock: number;
  softPurchaseLimit: number;
  hardPurchaseLimit: number;
  // 디폴트 이벤트 정보
  albumTitle: string;
  albumArtist: string;
  albumReleaseDate: string;
  albumEntertainmentAgency?: string;
  eventIsbn: string;
  eventDescription?: string;
  eventMemo?: string;
  purchaseAlbumPrice: number;
  photocardPrice: number;
  purchaseAlbumAndPhotocardPrice: number;
  etcPrice: number;
  etcDescription?: string;
  eventDate: string;
  limitPeriodDate?: number;
  deadlineForArrivalDate: string;
  eventStatus: string;
  eventPurchaseType: string;
  // 썸네일 이미지 URL 목록
  thumbnailImageUrls?: string[];
}

export interface UpdateAlbumRequest {
  id: number;
  isbn: string;
  title: string;
  artist: string;
  releaseDate: string;
  entertainmentAgency?: string;
  albumDescription?: string;
  memo?: string;
  // 썸네일 이미지 URL 목록
  thumbnailImageUrls?: string[];
}

// 앨범 목록 조회
export const getAlbums = async (): Promise<AlbumPurchase[]> => {
  const { data } = await requests({
    method: 'get',
    url: `${BASE_URL}/all`,
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
    throw new Error(customMessage);
  } else if (errorMessage) {
    alert(`${errorMessage}\n${errorCode}`);
    throw new Error(errorMessage);
  }

  return data as AlbumPurchase[];
};

// 앨범 등록
export const createAlbum = async (
  requestData: CreateAlbumRequest,
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

// 앨범 수정
export const updateAlbum = async (
  requestData: UpdateAlbumRequest,
): Promise<any> => {
  const { data } = await requests({
    method: 'put',
    url: `${BASE_URL}/update`,
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

// 앨범 삭제
export const deleteAlbum = async (albumId: number): Promise<any> => {
  const { data } = await requests({
    method: 'delete',
    url: `${BASE_URL}/delete/${albumId}`,
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
