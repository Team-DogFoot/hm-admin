import { API_URL } from '@/constants/apis';
import { CreateShippingDTO } from '@/types/createShippingDTO';
import { requests } from '../request';
import axios from 'axios';

export const getAllShippings = async () => {
  const { data } = await requests(`${API_URL}/logi/shipping`, {
    method: 'get',
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    return alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
  } else if (errorMessage) {
    return alert(`${errorMessage}\n${errorCode}`);
  }
  return data;
};

export const getAllShippingsByStatus = async (shippingStatus: string) => {
  const { data } = await requests(
    `${API_URL}/logi/shipping/${shippingStatus}`,
    {
      method: 'get',
    },
  );

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    return alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
  } else if (errorMessage) {
    return alert(`${errorMessage}\n${errorCode}`);
  }
  return data;
};

export const getAllShippingsByUsersEmail = async (usersEmail: string) => {
  const { data } = await requests(
    `${API_URL}/logi/shipping/email/${usersEmail}`,
    {
      method: 'get',
    },
  );

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    return alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
  } else if (errorMessage) {
    return alert(`${errorMessage}\n${errorCode}`);
  }
  return data;
};

export const getAllShippingsByShippingId = async (shippingId: string) => {
  const { data } = await requests(`${API_URL}/logi/shipping/${shippingId}`, {
    method: 'get',
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    return alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
  } else if (errorMessage) {
    return alert(`${errorMessage}\n${errorCode}`);
  }
  return data;
};

export const getShippingById = async (shippingId: string) => {
  const { data } = await requests(`${API_URL}/logi/shipping/${shippingId}`, {
    method: 'get',
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    return alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
  } else if (errorMessage) {
    return alert(`${errorMessage}\n${errorCode}`);
  }
  return data;
};

export const createAShipping = async (payload: CreateShippingDTO) => {
  const { data } = await requests(`${API_URL}/logi/shipping`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify(payload),
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    return alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
  } else if (errorMessage) {
    return alert(`${errorMessage}\n${errorCode}`);
  }
  return data;
};

export const deleteAShipping = async (shippingId: number) => {
  const { data } = await requests(`${API_URL}/logi/shipping/${shippingId}`, {
    method: 'delete',
    headers: { 'Content-Type': 'application/json' },
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    return alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
  } else if (errorMessage) {
    return alert(`${errorMessage}\n${errorCode}`);
  }
  return data;
};

export const updateAShipping = async (shippingId: number) => {
  const { data } = await requests(`${API_URL}/logi/shipping/${shippingId}`, {
    method: 'put',
    headers: { 'Content-Type': 'application/json' },
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    return alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
  } else if (errorMessage) {
    return alert(`${errorMessage}\n${errorCode}`);
  }
  alert('결제 완료를 성공했습니다');

  return data;
};

export const cancelCompleteAShipping = async (shippingId: number) => {
  const { data } = await requests(
    `${API_URL}/logi/shipping/cancel-complete/${shippingId}`,
    {
      method: 'put',
      headers: { 'Content-Type': 'application/json' },
    },
  );

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    return alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
  } else if (errorMessage) {
    return alert(`${errorMessage}\n${errorCode}`);
  }
  alert('취소 완료를 성공했습니다');

  return data;
};

// Presigned URL 요청
export const presignRes = async (shippingCode: string, videoBlob: Blob) => {
  const { data } = await requests(
    `${API_URL}/logi/shipping-videos/presign-by-barcode`,
    {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        barcodeForVideo: shippingCode,
        fileName: `video_${shippingCode}_${Date.now()}.${videoBlob.type.includes('mp4') ? 'mp4' : 'webm'}`,
        fileType: videoBlob.type,
      }),
    },
  );

  // 에러 응답 체크
  if (data?.errorMessage || data?.errorCode) {
    throw new Error(data.errorMessage || data.customMessage || '배송 정보를 찾을 수 없습니다.');
  }

  if (!data?.presignedUrl) {
    throw new Error('업로드 URL을 가져오지 못했습니다.');
  }

  return data;
};

// 2. presigned URL로 직접 S3에 업로드 (더 이상 사용하지 않음 - sidebar에서 직접 axios 호출)
export const uploadRes = async (presignedData: any, videoBlob: Blob) => {
  if (!presignedData || !presignedData.presignedUrl) {
    throw new Error('유효하지 않은 presigned URL');
  }

  const url = presignedData.presignedUrl;
  const validUrl =
    url.startsWith('http://') || url.startsWith('https://')
      ? url
      : `https:${url.startsWith('//') ? url : `//${url}`}`;

  const { data } = await axios.put(validUrl, videoBlob, {
    headers: { 'Content-Type': videoBlob.type },
    timeout: 600000, // 10분 타임아웃
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    withCredentials: false,
  });

  return data;
};

// 업로드 결과 등록
export const registerRes = async (
  shippingCode: string,
  uploadFileUrl: string,
) => {
  const { data } = await requests(
    `${API_URL}/logi/shipping-videos/by-barcode`,
    {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        barcodeForVideo: shippingCode,
        videoUrl: uploadFileUrl,
      }),
    },
  );

  // 에러 응답 체크
  if (data?.errorMessage || data?.errorCode) {
    throw new Error(data.errorMessage || data.customMessage || '영상 등록에 실패했습니다.');
  }

  return data;
};

// 발송일 수정
export const updateShippingCreatedAt = async (
  shippingId: number,
  createdAt: string,
) => {
  const { data } = await requests(
    `${API_URL}/logi/shipping/${shippingId}/created-at`,
    {
      method: 'patch',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ createdAt }),
    },
  );

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    return alert(`${errorMessage}\n${errorCode}\n${customMessage}`);
  } else if (errorMessage) {
    return alert(`${errorMessage}\n${errorCode}`);
  }
  alert('발송일이 수정되었습니다');

  return data;
};
