'use client';

import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  width?: string;
  height?: string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  onError,
  width = '100%',
  height = '300px',
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScanning = useRef(false);

  useEffect(() => {
    const scannerId = 'barcode-scanner-' + Math.random().toString(36).substr(2, 9);

    if (containerRef.current) {
      containerRef.current.id = scannerId;
    }

    const startScanner = async () => {
      if (isScanning.current) return;

      try {
        scannerRef.current = new Html5Qrcode(scannerId);
        isScanning.current = true;

        await scannerRef.current.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.0,
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
      if (scannerRef.current && isScanning.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current?.clear();
            isScanning.current = false;
          })
          .catch((err) => {
            console.error('Scanner stop error:', err);
          });
      }
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
