import React from 'react';
import dynamic from 'next/dynamic';
import IconButton from '@mui/material/IconButton';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
const QrScanner = dynamic(() => import('react-qr-scanner'), { ssr: false });
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { menus } from '@/constants/menus';
import { pocaMenus } from '@/constants/poca-menus';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useSnackbar } from '@/providers/SnackbarProvider';
import { registerRes, presignRes, uploadRes } from '@/query/api/shipping';
import { useRouter } from 'next/navigation';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

function Sidebar() {
  const { showSnackbar } = useSnackbar();
  const router = useRouter();
  const { userEmail } = useAuth();
  const [openMenus, setOpenMenus] = React.useState<{ [key: string]: boolean }>(
    {},
  );
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Modal state for video recording
  const [openModal, setOpenModal] = React.useState(false);
  const [shippingCode, setShippingCode] = React.useState('');
  const [videoBlob, setVideoBlob] = React.useState<Blob | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const [openQrScanner, setOpenQrScanner] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [deviceSupportsCamera, setDeviceSupportsCamera] = React.useState(true);
  const [recordingState, setRecordingState] = React.useState<
    'inactive' | 'recording' | 'paused'
  >('inactive');
  const chunksRef = React.useRef<Blob[]>([]);

  // 디바이스 기능 감지
  React.useEffect(() => {
    // 카메라 지원 여부 확인
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setDeviceSupportsCamera(false);
      showSnackbar('이 기기는 카메라를 지원하지 않습니다.', 'warning');
    }

    // MediaRecorder 지원 여부 확인
    if (typeof MediaRecorder === 'undefined') {
      showSnackbar('이 기기는 비디오 녹화를 지원하지 않습니다.', 'warning');
    }
  }, []);

  // 디바이스에 적합한 비디오 MIME 타입 감지
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
    return 'video/webm'; // 기본값
  };

  const startRecording = async () => {
    try {
      // 후면 카메라 먼저 시도
      const constraints = {
        video: {
          facingMode: { exact: 'environment' },
          // iOS에서 전체화면 방지를 위한 추가 설정
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // 후면 카메라가 없거나 접근 불가능한 경우 기본 카메라로 대체
        showSnackbar(
          '후면 카메라를 사용할 수 없어 기본 카메라로 전환합니다',
          'info',
        );
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        // iOS에서 전체화면 방지
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
      }

      const mimeType = getSupportedMimeType();
      chunksRef.current = []; // 청크 배열 초기화

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setVideoBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
        setRecordingState('inactive');
        setIsRecording(false);
        setIsPaused(false);

        // 파일 크기를 MB 단위로 계산
        const fileSizeInBytes = blob.size;
        const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);

        showSnackbar(
          `촬영 완료: ${fileSizeInMB}MB 비디오가 생성되었습니다`,
          'success',
        );
      };

      // 일정 간격으로 데이터 수집 (더 안정적인 녹화를 위해)
      mediaRecorder.start(1000); // 1초마다 데이터 수집
      setIsRecording(true);
      setRecordingState('recording');
      showSnackbar('녹화가 시작되었습니다', 'info');
    } catch (error) {
      console.error('녹화 시작 오류:', error);
      showSnackbar(
        '카메라에 접근할 수 없습니다. 권한을 확인해 주세요.',
        'error',
      );
    }
  };

  const pauseRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      setRecordingState('paused');
      showSnackbar('녹화가 일시정지되었습니다', 'info');
    }
  };

  const resumeRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'paused'
    ) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      setRecordingState('recording');
      showSnackbar('녹화가 재개되었습니다', 'info');
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      (mediaRecorderRef.current.state === 'recording' ||
        mediaRecorderRef.current.state === 'paused')
    ) {
      mediaRecorderRef.current.stop();
      showSnackbar('녹화를 종료하는 중...', 'info');
    } else {
      showSnackbar('녹화가 진행 중이지 않습니다', 'warning');
    }
  };

  // iOS Safari 전체화면 후 모달로 돌아올 때 상태 재점검을 위한 함수
  const handleModalFocus = () => {
    // 녹화 상태 재점검
    if (mediaRecorderRef.current) {
      const state = mediaRecorderRef.current.state;
      console.log('모달 포커스: 현재 MediaRecorder 상태:', state);

      // 실제 상태와 UI 상태 동기화
      if (state === 'recording' && !isRecording) {
        setIsRecording(true);
        setRecordingState('recording');
        setIsPaused(false);
      } else if (state === 'paused' && !isPaused) {
        setIsRecording(true);
        setRecordingState('paused');
        setIsPaused(true);
      } else if (state === 'inactive' && isRecording) {
        setIsRecording(false);
        setRecordingState('inactive');
        setIsPaused(false);
      }
    }
  };

  const uploadRecording = async () => {
    try {
      if (!videoBlob) {
        showSnackbar('업로드할 비디오가 없습니다', 'error');
        return;
      }

      if (!shippingCode || shippingCode.trim() === '') {
        showSnackbar('배송 코드를 입력해주세요', 'warning');
        return;
      }

      // 파일 크기 표시
      const fileSizeInBytes = videoBlob.size;
      const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);

      showSnackbar(`${fileSizeInMB}MB 비디오 업로드 중...`, 'info');

      // 1. S3 업로드를 위한 presigned URL 가져오기
      const presignedData = await presignRes(shippingCode, videoBlob);

      // 2. presigned URL로 직접 S3에 업로드
      await uploadRes(presignedData, videoBlob);

      // 3. 업로드 결과 등록
      await registerRes(shippingCode, presignedData.uploadFileUrl);

      showSnackbar('영상이 성공적으로 업로드되었습니다', 'success');
      setOpenModal(false);
      setShippingCode('');
      setVideoBlob(null);
    } catch (error) {
      console.error('업로드 오류:', error);
      showSnackbar(
        '영상 업로드 중 오류가 발생했습니다' + JSON.stringify(error),
      );
    }
  };

  const handleClick = (text: string) => {
    setOpenMenus((prev) => ({ ...prev, [text]: !prev[text] }));
  };

  const showPocaMenus =
    userEmail === 'rudghksldl@gmail.com' || userEmail === 'kurare@naver.com';
  const showAuditMenus = ['rudghksldl', 'kurare', 'kkhdevs'].some((keyword) =>
    (userEmail || '').includes(keyword),
  );
  const visibleMenus = React.useMemo(
    () =>
      showAuditMenus
        ? menus
        : menus.filter((menu) => menu.text !== '시스템'),
    [showAuditMenus],
  );

  const renderMenus = (menuList: any[]) =>
    menuList.map((menu, idx) => {
      if (menu.href) {
        return (
          <ListItem key={menu.text + idx} disablePadding>
            <Link href={menu.href} passHref legacyBehavior>
              <ListItemButton
                component="a"
                sx={{
                  color: theme.palette.text.primary,
                  borderRadius: theme.shape.borderRadius,
                  mx: 1,
                  '&:hover': {
                    backgroundColor: theme.palette.grey[200],
                    color: theme.palette.common.black,
                  },
                  '&.Mui-selected, &.Mui-selected:hover': {
                    backgroundColor: theme.palette.grey[900],
                    color: theme.palette.common.white,
                  },
                }}
              >
                <ListItemText primary={menu.text} />
              </ListItemButton>
            </Link>
          </ListItem>
        );
      }
      if (menu.subMenus && menu.subMenus.length > 0) {
        return (
          <React.Fragment key={menu.text + idx}>
            <ListItemButton
              onClick={() => handleClick(menu.text)}
              sx={{
                color: theme.palette.text.primary,
                borderRadius: theme.shape.borderRadius,
                mx: 1,
                '&:hover': {
                  backgroundColor: theme.palette.grey[200],
                  color: theme.palette.common.black,
                },
                '&.Mui-selected, &.Mui-selected:hover': {
                  backgroundColor: theme.palette.grey[900],
                  color: theme.palette.common.white,
                },
              }}
            >
              <ListItemText primary={menu.text} />
              {openMenus[menu.text] ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={openMenus[menu.text]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {menu.subMenus.map((sub: any, subIdx: number) => (
                  <ListItem
                    key={sub.text + subIdx}
                    sx={{ pl: 4 }}
                    disablePadding
                  >
                    <Link href={sub.href} passHref legacyBehavior>
                      <ListItemButton
                        component="a"
                        sx={{
                          color: theme.palette.text.secondary,
                          borderRadius: theme.shape.borderRadius,
                          mx: 1,
                          '&:hover': {
                            backgroundColor: theme.palette.grey[800],
                            color: theme.palette.common.white,
                          },
                          '&.Mui-selected, &.Mui-selected:hover': {
                            backgroundColor: theme.palette.common.black,
                            color: theme.palette.common.white,
                          },
                        }}
                      >
                        <ListItemText primary={sub.text} />
                      </ListItemButton>
                    </Link>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </React.Fragment>
        );
      }
      return null;
    });

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 200,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: 200,
          boxSizing: 'border-box',
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <List>
        {renderMenus(visibleMenus)}
        {showPocaMenus && renderMenus(pocaMenus)}
      </List>
      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button
          variant="contained"
          color="secondary"
          fullWidth
          onClick={() => router.push('/album-purchase/mobile-receipt')}
          startIcon={<LocalShippingIcon />}
        >
          수령처리
        </Button>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={() => setOpenModal(true)}
          disabled={!deviceSupportsCamera}
        >
          영상촬영
        </Button>
        <Dialog
          open={openModal}
          onClose={() => {
            if (mediaRecorderRef.current && isRecording) {
              mediaRecorderRef.current.stop();
              setIsRecording(false);
            }
            setOpenModal(false);
          }}
          fullWidth
          fullScreen={isMobile}
          maxWidth="sm"
          onFocus={handleModalFocus}
          TransitionProps={{
            onEntered: handleModalFocus,
          }}
          PaperProps={{
            sx: {
              ...(isMobile && {
                m: 0,
                width: '100%',
                height: '100%',
                maxHeight: '100%',
                maxWidth: '100%',
                borderRadius: 0,
              }),
            },
          }}
        >
          <DialogTitle>
            배송 ID 입력 또는 스캔
            {isMobile && (
              <IconButton
                edge="end"
                color="inherit"
                onClick={() => {
                  if (mediaRecorderRef.current && isRecording) {
                    mediaRecorderRef.current.stop();
                  }
                  setOpenModal(false);
                }}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                <Box>×</Box>
              </IconButton>
            )}
          </DialogTitle>
          <DialogContent>
            <Box display="flex" alignItems="center">
              <TextField
                fullWidth
                margin="normal"
                label="배송 코드"
                value={shippingCode}
                onChange={(e) => setShippingCode(e.target.value)}
              />
              <IconButton
                onClick={() => setOpenQrScanner(true)}
                sx={{ ml: 1 }}
                size="large"
              >
                <QrCodeScannerIcon />
              </IconButton>
            </Box>
            <video
              ref={videoRef}
              width="100%"
              height={isMobile ? 'auto' : 'auto'}
              controls
              muted
              playsInline
              webkit-playsinline="true"
              style={{
                marginTop: 16,
                maxHeight: isMobile ? 'calc(100vh - 250px)' : 'auto',
                objectFit: 'contain',
                background: '#000',
              }}
            />
          </DialogContent>
          <DialogActions
            sx={{
              flexWrap: 'wrap',
              justifyContent: 'center',
              p: isMobile ? 2 : 1,
              pb: isMobile ? 4 : 1,
            }}
          >
            <Button
              onClick={startRecording}
              disabled={isRecording}
              color="primary"
              variant={isMobile ? 'contained' : 'text'}
              sx={{
                minWidth: '120px',
                m: 0.5,
                ...(isMobile && {
                  py: 1.5,
                  borderRadius: 2,
                }),
              }}
            >
              촬영 시작
            </Button>
            {isPaused ? (
              <Button
                onClick={resumeRecording}
                disabled={!isRecording || recordingState !== 'paused'}
                color="primary"
                variant={isMobile ? 'contained' : 'text'}
                sx={{
                  minWidth: '120px',
                  m: 0.5,
                  ...(isMobile && {
                    py: 1.5,
                    borderRadius: 2,
                  }),
                }}
              >
                녹화 계속
              </Button>
            ) : (
              <Button
                onClick={pauseRecording}
                disabled={!isRecording || recordingState !== 'recording'}
                color="primary"
                variant={isMobile ? 'contained' : 'text'}
                sx={{
                  minWidth: '120px',
                  m: 0.5,
                  ...(isMobile && {
                    py: 1.5,
                    borderRadius: 2,
                  }),
                }}
              >
                일시정지
              </Button>
            )}
            <Button
              onClick={stopRecording}
              disabled={!isRecording}
              color="secondary"
              variant={isMobile ? 'contained' : 'text'}
              sx={{
                minWidth: '120px',
                m: 0.5,
                ...(isMobile && {
                  py: 1.5,
                  borderRadius: 2,
                }),
              }}
            >
              촬영 종료
            </Button>
            <Button
              onClick={uploadRecording}
              disabled={isRecording || !videoBlob}
              color="success"
              variant={isMobile ? 'contained' : 'text'}
              sx={{
                minWidth: '120px',
                m: 0.5,
                ...(isMobile && {
                  py: 1.5,
                  borderRadius: 2,
                }),
              }}
            >
              업로드
            </Button>
            {!isMobile && (
              <Button
                onClick={() => {
                  if (mediaRecorderRef.current && isRecording) {
                    mediaRecorderRef.current.stop();
                    setIsRecording(false);
                  }
                  setOpenModal(false);
                }}
                sx={{ minWidth: '120px', m: 0.5 }}
              >
                닫기
              </Button>
            )}
          </DialogActions>
        </Dialog>
        <Dialog
          open={openQrScanner}
          onClose={() => setOpenQrScanner(false)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>바코드/QR 코드 스캔</DialogTitle>
          <DialogContent>
            <QrScanner
              delay={300}
              onError={(err: Error) => {
                console.error('QR 스캔 오류:', err);
                showSnackbar('QR 스캔 중 오류가 발생했습니다', 'error');

                // 오류가 발생하면 카메라 접근 실패를 알리고 대화상자 닫기
                if (err.name === 'OverconstrainedError') {
                  showSnackbar(
                    '이 기기에는 후면 카메라가 없습니다. 카메라 설정을 확인해주세요.',
                    'warning',
                  );
                  setTimeout(() => setOpenQrScanner(false), 3000);
                }
              }}
              onScan={(data: { text: string } | null) => {
                if (data?.text) {
                  setShippingCode(data.text);
                  setOpenQrScanner(false);
                  showSnackbar('QR 코드를 성공적으로 스캔했습니다', 'success');
                }
              }}
              style={{ width: '100%' }}
              constraints={{
                video: {
                  facingMode: 'environment', // exact 제약 제거
                },
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenQrScanner(false)}>닫기</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Drawer>
  );
}

export default Sidebar;
