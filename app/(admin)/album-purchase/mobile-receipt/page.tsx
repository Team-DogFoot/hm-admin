'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VideocamIcon from '@mui/icons-material/Videocam';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import StopIcon from '@mui/icons-material/Stop';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';
import axios from 'axios';

import {
  quickScanReceipt,
  updateReceiptVideoUrl,
  createReceiptPresignedUrl,
} from '@/query/api/album-purchase/receipts';

const QrScanner = dynamic(() => import('react-qr-scanner'), { ssr: false });

type Step = 'scanning' | 'scanned' | 'ask-video' | 'recording' | 'uploading' | 'complete';

interface ScannedReceipt {
  receiptId: number;
  trackingNumber: string;
}

export default function MobileReceiptPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('scanning');
  const [scannedReceipt, setScannedReceipt] = useState<ScannedReceipt | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Video recording refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }
    chunksRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Handle barcode scan
  const handleScan = async (data: { text: string } | null) => {
    if (data?.text && !isProcessing) {
      setIsProcessing(true);
      setError(null);

      try {
        const response = await quickScanReceipt({ trackingNumber: data.text });
        setScannedReceipt({
          receiptId: response.receiptId,
          trackingNumber: data.text,
        });
        setStep('ask-video');
      } catch (err: any) {
        setError(err.message || '스캔 처리 중 오류가 발생했습니다.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Handle manual input
  const handleManualSubmit = async () => {
    if (!manualInput.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await quickScanReceipt({ trackingNumber: manualInput.trim() });
      setScannedReceipt({
        receiptId: response.receiptId,
        trackingNumber: manualInput.trim(),
      });
      setManualInput('');
      setShowManualInput(false);
      setStep('ask-video');
    } catch (err: any) {
      setError(err.message || '등록 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Get supported MIME type
  const getSupportedMimeType = (): string => {
    const types = [
      'video/webm',
      'video/mp4',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return 'video/webm';
  };

  // Start video recording
  const startRecording = async () => {
    setError(null);

    try {
      const constraints = {
        video: {
          facingMode: { exact: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
      }

      const mimeType = getSupportedMimeType();
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mimeType = getSupportedMimeType();
        const blob = new Blob(chunksRef.current, { type: mimeType });
        stream.getTracks().forEach((track) => track.stop());

        // Upload the video
        await uploadVideo(blob);
      };

      mediaRecorder.start(1000);
      setStep('recording');
    } catch (err: any) {
      setError('카메라 접근에 실패했습니다. 권한을 확인해주세요.');
      setStep('ask-video');
    }
  };

  // Stop recording and upload
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      setStep('uploading');
      mediaRecorderRef.current.stop();
    }
  };

  // Upload video to S3
  const uploadVideo = async (blob: Blob) => {
    if (!scannedReceipt) return;

    try {
      const fileName = `receipt_${scannedReceipt.receiptId}_${Date.now()}.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`;

      // Get presigned URL
      const presignData = await createReceiptPresignedUrl(
        scannedReceipt.receiptId,
        fileName,
        blob.type
      );

      // Upload to S3
      await axios.put(presignData.presignedUrl, blob, {
        headers: { 'Content-Type': blob.type },
        withCredentials: false,
      });

      // Update receipt with video URL
      await updateReceiptVideoUrl(scannedReceipt.receiptId, {
        videoUrl: presignData.uploadFileUrl,
      });

      setStep('complete');

      // Auto reset after 2 seconds
      setTimeout(() => {
        resetToScanning();
      }, 2000);
    } catch (err: any) {
      setError('영상 업로드 중 오류가 발생했습니다: ' + err.message);
      setStep('ask-video');
    }
  };

  // Skip video and go back to scanning
  const skipVideo = () => {
    setStep('complete');
    setTimeout(() => {
      resetToScanning();
    }, 1500);
  };

  // Reset to scanning mode
  const resetToScanning = () => {
    cleanup();
    setScannedReceipt(null);
    setError(null);
    setStep('scanning');
  };

  // Render based on current step
  const renderContent = () => {
    switch (step) {
      case 'scanning':
        return (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flex: 1, position: 'relative', bgcolor: '#000' }}>
              <QrScanner
                delay={300}
                onError={(err: Error) => {
                  console.error('QR 스캔 오류:', err);
                  if (err.name === 'OverconstrainedError') {
                    setError('카메라를 사용할 수 없습니다.');
                  }
                }}
                onScan={handleScan}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                constraints={{
                  video: { facingMode: 'environment' },
                }}
              />
              {isProcessing && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CircularProgress color="primary" />
                </Box>
              )}
            </Box>

            <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
                송장 바코드를 카메라에 비춰주세요
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setShowManualInput(true)}
              >
                수동 입력
              </Button>
            </Box>

            {/* Manual Input Dialog */}
            <Dialog open={showManualInput} onClose={() => setShowManualInput(false)} fullWidth>
              <DialogTitle>송장번호 입력</DialogTitle>
              <DialogContent>
                <TextField
                  autoFocus
                  fullWidth
                  margin="normal"
                  label="송장번호"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleManualSubmit();
                  }}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowManualInput(false)}>취소</Button>
                <Button
                  onClick={handleManualSubmit}
                  variant="contained"
                  disabled={!manualInput.trim() || isProcessing}
                >
                  {isProcessing ? <CircularProgress size={20} /> : '등록'}
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        );

      case 'ask-video':
        return (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 3,
              gap: 3,
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main' }} />
            <Typography variant="h5" fontWeight="bold" align="center">
              수령 건 등록 완료
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center">
              송장번호: {scannedReceipt?.trackingNumber}
            </Typography>

            <Box sx={{ width: '100%', mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<VideocamIcon />}
                onClick={startRecording}
                sx={{ py: 2 }}
              >
                개봉 영상 촬영
              </Button>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<QrCodeScannerIcon />}
                onClick={skipVideo}
                sx={{ py: 2 }}
              >
                건너뛰고 계속 스캔
              </Button>
            </Box>
          </Box>
        );

      case 'recording':
        return (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flex: 1, position: 'relative', bgcolor: '#000' }}>
              <video
                ref={videoRef}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                muted
                playsInline
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: 'error.main',
                  color: 'white',
                  px: 2,
                  py: 0.5,
                  borderRadius: 2,
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: 'white',
                    animation: 'pulse 1s infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                    },
                  }}
                />
                <Typography variant="body2" fontWeight="bold">
                  REC
                </Typography>
              </Box>
            </Box>

            <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
              <Button
                fullWidth
                variant="contained"
                color="error"
                size="large"
                startIcon={<StopIcon />}
                onClick={stopRecording}
                sx={{ py: 2 }}
              >
                촬영 종료
              </Button>
            </Box>
          </Box>
        );

      case 'uploading':
        return (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
            }}
          >
            <CircularProgress size={60} />
            <Typography variant="h6">영상 업로드 중...</Typography>
          </Box>
        );

      case 'complete':
        return (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 100, color: 'success.main' }} />
            <Typography variant="h5" fontWeight="bold">
              완료!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              다음 스캔으로 이동합니다...
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 2,
          bgcolor: 'primary.main',
          color: 'white',
        }}
      >
        <Button
          color="inherit"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/album-purchase/receipts')}
        >
          뒤로
        </Button>
        <Typography variant="h6" sx={{ flex: 1 }}>
          수령 처리
        </Typography>
      </Box>

      {/* Error display */}
      {error && (
        <Box sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography variant="body2">{error}</Typography>
        </Box>
      )}

      {/* Main content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {renderContent()}
      </Box>
    </Box>
  );
}
