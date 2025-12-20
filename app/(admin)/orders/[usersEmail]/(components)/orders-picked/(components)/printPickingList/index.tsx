'use client';
import React, { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import PrintIcon from '@mui/icons-material/Print';
import { styled } from '@mui/material/styles';
import Divider from '@mui/material/Divider';
import Image from 'next/image';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import QRCode from 'react-qr-code';
import { useCreateShipping } from '@/query/query/shippings';
import { CreateShippingDTO } from '@/types/createShippingDTO';
import { useGetShippingById } from '@/query/query/shippings';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

// 프린트용 스타일드 컴포넌트
const PrintContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'white',
  padding: '20px 30px',
  margin: '0',
  '@media print': {
    width: '100%',
    height: 'auto',
    margin: 0,
    padding: '20px',
    backgroundColor: 'white',
    pageBreakAfter: 'always',
    pageBreakInside: 'avoid',
  },
}));

const PrintHeader = styled(Typography)(({ theme }) => ({
  fontSize: '28px',
  fontWeight: 700,
  marginBottom: theme.spacing(1),
  '@media print': {
    marginBottom: theme.spacing(2),
  },
}));

const PrintSubheader = styled(Typography)(({ theme }) => ({
  fontSize: '18px',
  fontWeight: 600,
  marginBottom: theme.spacing(2),
  '@media print': {
    marginBottom: theme.spacing(3),
  },
}));

// 테이블 스타일
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  boxShadow: 'none',
  border: '1px solid #e0e0e0',
  '@media print': {
    width: '100% !important',
    border: '1px solid #e0e0e0',
    boxShadow: 'none',
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: '12px 16px',
  '@media print': {
    padding: '8px 12px',
    borderBottom: '1px solid #e0e0e0',
  },
}));

const StyledTableHeadCell = styled(StyledTableCell)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  fontWeight: 600,
  '@media print': {
    backgroundColor: '#f0f0f0 !important',
    color: 'black !important',
    fontWeight: 600,
  },
}));

// QR코드용 스타일
const QRCodeContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: theme.spacing(4),
  '@media print': {
    marginBottom: theme.spacing(2),
  },
}));

export default function PrintPickingList({
  table: data,
  usersData,
  addressId,
  usersEmail,
  addressData,
}: {
  table: any;
  usersData: any;
  addressId?: number;
  usersEmail?: string;
  addressData?: any[];
}) {
  // 다이얼로그 상태
  const [openDialog, setOpenDialog] = useState(false);
  const [printType, setPrintType] = useState<'pickingList' | 'shipping' | null>(
    null,
  );
  const [shippingId, setShippingId] = useState<number | null>(null);
  const [isCreatingShipping, setIsCreatingShipping] = useState(false);

  // 배송 폼 상태
  const [shippingForm, setShippingForm] = useState({
    shippingType: '택배' as '택배' | '퀵' | '기타',
    trackingNumber: '',
    shippingFee: 0,
    addressId: addressId || 0,
  });

  // addressId가 변경될 때 폼 상태 업데이트
  useEffect(() => {
    if (addressId) {
      setShippingForm((prev) => ({ ...prev, addressId: addressId }));
    }
  }, [addressId]);

  // 폼 입력 핸들러
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setShippingForm((prev) => ({
      ...prev,
      [name]: name === 'shippingFee' ? Number(value) : value,
    }));
  };

  // Select 핸들러
  const handleSelectChange = (
    e: React.ChangeEvent<{ name?: string; value: unknown }>,
  ) => {
    const name = e.target.name as string;
    const value = e.target.value;
    setShippingForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 배송 정보 가져오기
  const { data: shippingData, isLoading: isShippingLoading } =
    useGetShippingById(shippingId ? shippingId.toString() : '', !!shippingId);

  // 프린트 기능
  const componentRef = useRef<any>(null);
  const shippingComponentRef = useRef<any>(null);

  // 기존 프린트 함수
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    pageStyle: `
      @page {
        size: A4;
        margin: 15mm;
      }
      @media print {
        html, body {
          width: 210mm;
          height: 297mm;
          margin: 0;
          padding: 0;
        }
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          color-adjust: exact;
        }
        table {
          width: 100% !important;
          border-collapse: collapse;
        }
        th {
          background-color: #f0f0f0 !important;
          color: black !important;
          font-weight: 600 !important;
        }
      }
    `,
    onBeforeGetContent: () => {
      document.body.classList.add('printing');
      return Promise.resolve();
    },
    onAfterPrint: () => {
      document.body.classList.remove('printing');
    },
  });

  // 배송 프린트 함수
  const handleShippingPrint = useReactToPrint({
    content: () => shippingComponentRef.current,
    pageStyle: `
      @page {
        size: A4;
        margin: 15mm;
      }
      @media print {
        html, body {
          width: 210mm;
          height: 297mm;
          margin: 0;
          padding: 0;
        }
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          color-adjust: exact;
        }
        table {
          width: 100% !important;
          border-collapse: collapse;
        }
        th {
          background-color: #f0f0f0 !important;
          color: black !important;
          font-weight: 600 !important;
        }
      }
    `,
    onBeforeGetContent: () => {
      document.body.classList.add('printing');
      return Promise.resolve();
    },
    onAfterPrint: () => {
      document.body.classList.remove('printing');
      setShippingId(null);
    },
  });

  // Shipping 생성 함수
  const { mutateAsync: createShipping } = useCreateShipping();

  const handleCreateAndPrintShipping = async () => {
    if (!data.getSelectedRowModel().rows.length) {
      alert('인쇄할 주문을 선택해 주세요.');
      return;
    }

    if (!shippingForm.addressId) {
      alert('배송지를 선택해 주세요.');
      return;
    }

    if (shippingForm.shippingFee < 0) {
      alert('배송비는 0 이상이어야 합니다.');
      return;
    }

    setIsCreatingShipping(true);

    try {
      const selectedRows = data
        .getSelectedRowModel()
        .rows.map((row: any) => row.original.id);

      const shippingData: CreateShippingDTO = {
        shippingType: shippingForm.shippingType,
        trackingNumber: shippingForm.trackingNumber,
        shippingFee: shippingForm.shippingFee,
        memo: 'QR코드와 동시에 생성된 배송',
        usersEmail: usersEmail?.replace('%40', '@') || '',
        orderItemsIds: selectedRows,
        addressId: shippingForm.addressId,
      };

      const response = await createShipping(shippingData);
      setShippingId(response.id);
      setPrintType('shipping');

      // 배송 데이터를 가져올 시간을 주기 위해 짧은 지연
      setTimeout(() => {
        if (shippingComponentRef.current) {
          handleShippingPrint();
        }
      }, 1000);
    } catch (error) {
      console.error('배송 생성 오류:', error);
      alert('배송 생성 중 오류가 발생했습니다.');
    } finally {
      setIsCreatingShipping(false);
      setOpenDialog(false);
    }
  };

  const printGoback = () => {
    if (!data.getSelectedRowModel().rows.length) {
      return alert('인쇄할 주문을 선택해 주세요.');
    }

    // 다이얼로그 열기
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handlePrintPickingList = () => {
    setPrintType('pickingList');
    handlePrint();
    setOpenDialog(false);
  };

  // 데이터 가져오기
  const rows = data.getSelectedRowModel().rows.map((row: any) => row.original);

  // 프린트될 컴포넌트
  const ComponentToPrint = React.forwardRef<HTMLDivElement>((props, ref) => {
    return (
      <PrintContainer ref={ref}>
        <PrintHeader variant="h1">PICKING LIST</PrintHeader>

        <PrintSubheader variant="h2">
          {usersData?.nickname || '고객명'}
          <Typography
            component="span"
            sx={{ ml: 2, fontSize: '14px', fontWeight: 400 }}
          >
            {new Date().toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Typography>
        </PrintSubheader>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ width: '100%', mb: 2 }}>
          <StyledTableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <StyledTableHeadCell align="center" width="100px">
                    썸네일
                  </StyledTableHeadCell>
                  <StyledTableHeadCell width="150px">
                    바코드/sku
                  </StyledTableHeadCell>
                  <StyledTableHeadCell>제목</StyledTableHeadCell>
                  <StyledTableHeadCell align="center" width="80px">
                    수량
                  </StyledTableHeadCell>
                  <StyledTableHeadCell width="120px">좌표</StyledTableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows &&
                  rows.length > 0 &&
                  rows[0] &&
                  rows?.map((row: any, index: number) => (
                    <TableRow key={index}>
                      <StyledTableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Image
                            alt="상품 이미지"
                            unoptimized={true}
                            src={row.thumbNailUrl}
                            width={50}
                            height={50}
                            style={{ objectFit: 'contain' }}
                          />
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography sx={{ fontWeight: 500, lineHeight: 1.2 }}>
                            {row.barcode || '-'}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '0.8rem',
                              color: '#666',
                              lineHeight: 1.2,
                            }}
                          >
                            {row.sku || '-'}
                          </Typography>
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography sx={{ lineHeight: 1.2 }}>
                          {row.title || '-'}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Typography sx={{ fontWeight: 'bold' }}>
                          {row.qty || 0}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          {row.coordinates && row.coordinates.length > 0 ? (
                            row.coordinates.map((coordinate: any) => (
                              <Typography
                                key={coordinate.id}
                                sx={{
                                  padding: '2px 0',
                                  lineHeight: 1.2,
                                  fontWeight: 500,
                                }}
                              >
                                {coordinate.name}
                              </Typography>
                            ))
                          ) : (
                            <Typography>-</Typography>
                          )}
                        </Box>
                      </StyledTableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </StyledTableContainer>
        </Box>

        <Box
          sx={{
            mt: 4,
            pt: 2,
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '1px dashed #ccc',
          }}
        >
          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
              배송 메모
            </Typography>
            <Typography variant="body2" color="text.secondary"></Typography>
          </Box>
          <Box textAlign="right">
            <Typography variant="body2" fontWeight={600}>
              담당자 확인: ________________
            </Typography>
          </Box>
        </Box>
      </PrintContainer>
    );
  });
  ComponentToPrint.displayName = 'ComponentToPrint';

  // 배송 QR 코드 프린트 컴포넌트
  const ShippingComponentToPrint = React.forwardRef<HTMLDivElement>(
    (props, ref) => {
      if (isShippingLoading || !shippingData) {
        return (
          <PrintContainer ref={ref}>
            <Typography>배송 정보를 불러오는 중...</Typography>
          </PrintContainer>
        );
      }
      console.log('shippingData', shippingData);

      return (
        <PrintContainer ref={ref}>
          <PrintHeader variant="h1">배송 정보</PrintHeader>

          <PrintSubheader variant="h2">
            {usersData?.nickname || '고객명'}
            <Typography
              component="span"
              sx={{ ml: 2, fontSize: '14px', fontWeight: 400 }}
            >
              {new Date().toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Typography>
          </PrintSubheader>

          <Divider sx={{ mb: 3 }} />

          {/* QR 코드 섹션 */}
          <QRCodeContainer>
            {shippingData.barcodeForVideo && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  배송 QR 코드
                </Typography>
                <QRCode value={shippingData.barcodeForVideo} size={150} />
              </Box>
            )}
          </QRCodeContainer>

          <Box sx={{ width: '100%', mb: 2 }}>
            <StyledTableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <StyledTableHeadCell align="center" width="100px">
                      썸네일
                    </StyledTableHeadCell>
                    <StyledTableHeadCell width="150px">
                      바코드/sku
                    </StyledTableHeadCell>
                    <StyledTableHeadCell>제목</StyledTableHeadCell>
                    <StyledTableHeadCell align="center" width="80px">
                      수량
                    </StyledTableHeadCell>
                    <StyledTableHeadCell align="center" width="80px">
                      좌표
                    </StyledTableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shippingData.logiShippingItems &&
                    shippingData.logiShippingItems.length > 0 &&
                    shippingData.logiShippingItems.map(
                      (item: any, index: number) => (
                        <TableRow key={index}>
                          <StyledTableCell align="center">
                            <Box
                              sx={{ display: 'flex', justifyContent: 'center' }}
                            >
                              <Image
                                alt="상품 이미지"
                                unoptimized={true}
                                src={item.logiProduct?.thumbNailUrl || ''}
                                width={50}
                                height={50}
                                style={{ objectFit: 'contain' }}
                              />
                            </Box>
                          </StyledTableCell>
                          <StyledTableCell>
                            <Box
                              sx={{ display: 'flex', flexDirection: 'column' }}
                            >
                              <Typography
                                sx={{ fontWeight: 500, lineHeight: 1.2 }}
                              >
                                {item.logiProduct?.barcode || '-'}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: '0.8rem',
                                  color: '#666',
                                  lineHeight: 1.2,
                                }}
                              >
                                {item.logiProduct?.sku || '-'}
                              </Typography>
                            </Box>
                          </StyledTableCell>
                          <StyledTableCell>
                            <Typography sx={{ lineHeight: 1.2 }}>
                              {item.logiProduct?.title || '-'}
                            </Typography>
                          </StyledTableCell>
                          <StyledTableCell align="center">
                            <Typography sx={{ fontWeight: 'bold' }}>
                              {item.qty || 0}
                            </Typography>
                          </StyledTableCell>
                          <StyledTableCell
                            align="center"
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                            }}
                          >
                            <Typography sx={{ fontWeight: 'bold' }}>
                              {item?.coordinates?.map((coordinate: any) => (
                                <Typography key={coordinate.id}>
                                  {coordinate.name}
                                </Typography>
                              )) || '-'}
                            </Typography>
                          </StyledTableCell>
                        </TableRow>
                      ),
                    )}
                </TableBody>
              </Table>
            </StyledTableContainer>
          </Box>

          <Box
            sx={{
              mt: 4,
              pt: 2,
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1px dashed #ccc',
            }}
          >
            <Box>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                배송지 정보
              </Typography>
              <Typography variant="body2">
                {shippingData.address?.receiverName || ''} |{' '}
                {shippingData.address?.receiverPhoneNumber || ''}
              </Typography>
              <Typography variant="body2">
                {shippingData.address?.city || ''}{' '}
                {shippingData.address?.state || ''} (
                {shippingData.address?.zipcode || ''})
              </Typography>
            </Box>
            <Box textAlign="right">
              <Typography variant="body2" fontWeight={600}>
                담당자 확인: ________________
              </Typography>
            </Box>
          </Box>
        </PrintContainer>
      );
    },
  );
  ShippingComponentToPrint.displayName = 'ShippingComponentToPrint';

  return (
    <Box>
      <Button
        variant="outlined"
        startIcon={<PrintIcon />}
        onClick={printGoback}
        size="small"
      >
        포장리스트 인쇄
      </Button>

      {/* 인쇄 선택 다이얼로그 */}
      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>인쇄 옵션 선택</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 3 }}>
            원하시는 인쇄 옵션을 선택하세요.
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flexBasis: { xs: '100%', md: '47%' } }}>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>배송방법</InputLabel>
                <Select
                  name="shippingType"
                  label="배송방법"
                  value={shippingForm.shippingType}
                  onChange={handleSelectChange as any}
                >
                  <MenuItem value="택배">택배</MenuItem>
                  <MenuItem value="퀵">퀵</MenuItem>
                  <MenuItem value="기타">기타</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flexBasis: { xs: '100%', md: '47%' } }}>
              <TextField
                fullWidth
                label="송장번호"
                name="trackingNumber"
                value={shippingForm.trackingNumber}
                onChange={handleInputChange}
                size="small"
                sx={{ mb: 2 }}
              />
            </Box>

            <Box sx={{ flexBasis: { xs: '100%', md: '47%' } }}>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>배송지</InputLabel>
                {addressData && addressData.length > 0 && (
                  <Select
                    label="배송지"
                    name="addressId"
                    onChange={handleSelectChange as any}
                    value={shippingForm.addressId || ''}
                  >
                    <MenuItem value="" disabled>
                      배송지를 선택해주세요
                    </MenuItem>
                    {addressData.map((address: any) => (
                      <MenuItem key={address.id} value={address.id}>
                        {address.addressName}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              </FormControl>
            </Box>

            <Box sx={{ flexBasis: { xs: '100%', md: '47%' } }}>
              <TextField
                fullWidth
                label="배송비"
                type="number"
                name="shippingFee"
                value={shippingForm.shippingFee}
                onChange={handleInputChange}
                size="small"
                sx={{ mb: 2 }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePrintPickingList}>기본 포장리스트</Button>
          <Button
            onClick={handleCreateAndPrintShipping}
            disabled={isCreatingShipping}
            color="primary"
            variant="contained"
          >
            {isCreatingShipping ? '처리 중...' : 'QR코드 포함 배송정보'}
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ display: 'none' }}>
        <ComponentToPrint ref={componentRef} />
        <ShippingComponentToPrint ref={shippingComponentRef} />
      </Box>
    </Box>
  );
}
