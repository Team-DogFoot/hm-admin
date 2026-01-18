'use client';

import { useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { uploadImage } from '@/query/api/album-purchase/image-upload';

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  purpose?: string;
}

export default function ImageUploader({
  images,
  onImagesChange,
  maxImages = 5,
  purpose = 'thumbnail',
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      setError(`최대 ${maxImages}개의 이미지만 업로드할 수 있습니다.`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setIsUploading(true);
    setError(null);

    try {
      const uploadedUrls: string[] = [];
      for (const file of filesToUpload) {
        // 파일 유효성 검사
        if (!file.type.startsWith('image/')) {
          throw new Error('이미지 파일만 업로드할 수 있습니다.');
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('파일 크기는 10MB를 초과할 수 없습니다.');
        }

        const url = await uploadImage(file, purpose);
        uploadedUrls.push(url);
      }
      onImagesChange([...images, ...uploadedUrls]);
    } catch (err: any) {
      setError(err.message || '이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        썸네일 이미지 ({images.length}/{maxImages})
      </Typography>

      {/* 이미지 미리보기 */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2,
        }}
      >
        {images.map((url, index) => (
          <Box
            key={index}
            sx={{
              position: 'relative',
              width: 120,
              height: 120,
              borderRadius: 1,
              overflow: 'hidden',
              border: '1px solid #e0e0e0',
            }}
          >
            <img
              src={url}
              alt={`썸네일 ${index + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            <IconButton
              size="small"
              onClick={() => handleRemoveImage(index)}
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                bgcolor: 'rgba(255,255,255,0.9)',
                '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
              }}
            >
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                bottom: 4,
                left: 4,
                bgcolor: 'rgba(0,0,0,0.6)',
                color: 'white',
                px: 0.5,
                borderRadius: 0.5,
              }}
            >
              {index + 1}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* 업로드 버튼 */}
      {images.length < maxImages && (
        <Box>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="image-upload-input"
          />
          <label htmlFor="image-upload-input">
            <Button
              variant="outlined"
              component="span"
              disabled={isUploading}
              startIcon={
                isUploading ? (
                  <CircularProgress size={20} />
                ) : (
                  <CloudUploadIcon />
                )
              }
            >
              {isUploading ? '업로드 중...' : '이미지 선택'}
            </Button>
          </label>
        </Box>
      )}

      {/* 에러 메시지 */}
      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          {error}
        </Typography>
      )}

      {/* 안내 텍스트 */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        JPG, PNG 파일 (최대 10MB, 최대 {maxImages}장)
      </Typography>
    </Box>
  );
}
