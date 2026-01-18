import { API_URL } from '@/constants/apis';
import { requests } from '../../request';

const BASE_URL = `${API_URL}/logi/album-purchase/admin/image`;

export interface PresignedUrlRequest {
  filename: string;
  contentType?: string;
  extension?: string;
  purpose?: string; // 'thumbnail' | 'detail-page'
}

export interface PresignedUrlResponse {
  key: string;
  uploadUrl: string;
  expiresIn: number;
  publicUrl: string;
}

// Presigned URL 생성
export const getPresignedUrl = async (
  requestData: PresignedUrlRequest,
): Promise<PresignedUrlResponse> => {
  const { data } = await requests({
    method: 'post',
    url: `${BASE_URL}/presigned-url`,
    data: requestData,
  });

  const { errorMessage, errorCode, customMessage } = data;

  if (customMessage) {
    throw new Error(customMessage);
  } else if (errorMessage) {
    throw new Error(errorMessage);
  }

  return data as PresignedUrlResponse;
};

// S3에 파일 직접 업로드
export const uploadFileToS3 = async (
  uploadUrl: string,
  file: File,
): Promise<void> => {
  await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });
};

// Presigned URL 생성 + S3 업로드 통합 함수
export const uploadImage = async (
  file: File,
  purpose: string = 'thumbnail',
): Promise<string> => {
  // 1. Presigned URL 생성
  const presignedResponse = await getPresignedUrl({
    filename: file.name,
    contentType: file.type,
    purpose,
  });

  // 2. S3에 업로드
  await uploadFileToS3(presignedResponse.uploadUrl, file);

  // 3. Public URL 반환
  return presignedResponse.publicUrl;
};
