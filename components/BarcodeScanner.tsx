'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export interface BarcodeScannerRef {
  stop: () => Promise<void>;
}

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  width?: string;
  height?: string;
}

const BarcodeScanner = forwardRef<BarcodeScannerRef, BarcodeScannerProps>(({
  onScan,
  onError,
  width = '100%',
  height = '400px',
}, ref) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScanning = useRef(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // 바코드 형식 지정 (택배 송장에서 주로 사용되는 형식)
  const formatsToSupport = [
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.ITF,
    Html5QrcodeSupportedFormats.CODABAR,
    Html5QrcodeSupportedFormats.QR_CODE,
  ];

  const stopScanner = async () => {
    if (scannerRef.current && isScanning.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        isScanning.current = false;
      } catch (err) {
        console.error('Scanner stop error:', err);
      }
    }
  };

  useImperativeHandle(ref, () => ({
    stop: stopScanner,
  }));

  useEffect(() => {
    const scannerId = 'barcode-scanner-' + Math.random().toString(36).substr(2, 9);

    if (containerRef.current) {
      containerRef.current.id = scannerId;
      // 컨테이너 크기 측정
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    }

    const startScanner = async () => {
      if (isScanning.current) return;
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const containerWidth = rect.width || 350;
      const containerHeight = rect.height || 400;

      // qrbox를 컨테이너의 80% 크기로 동적 계산 (바코드가 가로로 길므로 가로를 더 크게)
      const qrboxWidth = Math.floor(containerWidth * 0.9);
      const qrboxHeight = Math.floor(containerHeight * 0.4);

      try {
        scannerRef.current = new Html5Qrcode(scannerId, {
          formatsToSupport,
          verbose: false,
        });
        isScanning.current = true;

        // iOS와 Android 모두 지원하는 카메라 설정
        const cameraConfig = {
          facingMode: 'environment',
        };

        const scanConfig = {
          fps: 20,
          qrbox: { width: qrboxWidth, height: qrboxHeight },
          aspectRatio: containerWidth / containerHeight,
          disableFlip: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true, // 브라우저 내장 바코드 감지 API 사용 (지원 시)
          },
        };

        try {
          // 먼저 후면 카메라로 시도
          await scannerRef.current.start(
            cameraConfig,
            scanConfig,
            (decodedText) => {
              onScan(decodedText);
            },
            () => {
              // Ignore scan errors (no code found)
            }
          );
        } catch (envError) {
          console.warn('후면 카메라 실패, 기본 카메라로 재시도:', envError);

          // 후면 카메라 실패 시 기본 카메라로 재시도 (iOS fallback)
          try {
            await scannerRef.current.start(
              { facingMode: 'user' },
              scanConfig,
              (decodedText) => {
                onScan(decodedText);
              },
              () => {}
            );
          } catch (userError) {
            console.warn('전면 카메라도 실패, 카메라 ID로 재시도');

            // 마지막 시도: 사용 가능한 첫 번째 카메라 사용
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length > 0) {
              // 후면 카메라 우선 선택 (label에 back, rear, environment 포함)
              const backCamera = devices.find(d =>
                d.label.toLowerCase().includes('back') ||
                d.label.toLowerCase().includes('rear') ||
                d.label.toLowerCase().includes('environment')
              );
              const cameraId = backCamera ? backCamera.id : devices[0].id;

              await scannerRef.current.start(
                cameraId,
                scanConfig,
                (decodedText) => {
                  onScan(decodedText);
                },
                () => {}
              );
            } else {
              throw new Error('사용 가능한 카메라가 없습니다');
            }
          }
        }
      } catch (err: any) {
        console.error('Scanner start error:', err);
        isScanning.current = false;
        if (onError) {
          onError(err?.message || '카메라를 시작할 수 없습니다');
        }
      }
    };

    // DOM이 준비될 때까지 약간의 딜레이
    const timer = setTimeout(startScanner, 200);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [onScan, onError]);

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        overflow: 'hidden',
        borderRadius: '8px',
        backgroundColor: '#000',
      }}
    />
  );
});

BarcodeScanner.displayName = 'BarcodeScanner';

export default BarcodeScanner;
