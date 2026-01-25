'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
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
  height = '300px',
}, ref) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScanning = useRef(false);

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
    }

    const startScanner = async () => {
      if (isScanning.current) return;

      try {
        scannerRef.current = new Html5Qrcode(scannerId, {
          formatsToSupport,
          verbose: false,
        });
        isScanning.current = true;

        await scannerRef.current.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 280, height: 120 },
            disableFlip: false,
          },
          (decodedText) => {
            onScan(decodedText);
          },
          (errorMessage) => {
            // Ignore scan errors (no code found)
          }
        );
      } catch (err: any) {
        console.error('Scanner start error:', err);
        isScanning.current = false;
        if (onError) {
          onError(err?.message || '카메라를 시작할 수 없습니다');
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(startScanner, 100);

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
      }}
    />
  );
};

export default BarcodeScanner;
