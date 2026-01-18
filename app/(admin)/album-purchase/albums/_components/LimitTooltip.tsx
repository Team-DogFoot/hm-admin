'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

interface LimitTooltipProps {
  type: 'soft' | 'hard';
}

export default function LimitTooltip({ type }: LimitTooltipProps) {
  if (type === 'soft') {
    return (
      <InputAdornment position="end">
        <Tooltip
          title={
            <Box sx={{ p: 0.5 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Soft Limit (즉시 매입 한도)
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                고객이 신청한 수량이 이 값 이하면 <strong>&quot;매입 가능&quot;</strong> 상태로
                즉시 처리됩니다.
              </Typography>
              <Box
                sx={{
                  bgcolor: 'success.dark',
                  color: 'white',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: 12,
                }}
              >
                예: Soft=100 → 1~100개 신청은 즉시 승인
              </Box>
            </Box>
          }
          arrow
          placement="top"
        >
          <IconButton size="small" tabIndex={-1}>
            <HelpOutlineIcon fontSize="small" color="action" />
          </IconButton>
        </Tooltip>
      </InputAdornment>
    );
  }

  return (
    <InputAdornment position="end">
      <Tooltip
        title={
          <Box sx={{ p: 0.5 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Hard Limit (최대 매입 한도)
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • Soft ~ Hard 사이: <strong>&quot;협의 필요&quot;</strong>
              <br />• Hard 초과: <strong>&quot;매입 불가&quot;</strong>
            </Typography>
            <Box sx={{ bgcolor: 'grey.800', color: 'white', p: 1, borderRadius: 1, fontSize: 12 }}>
              예: Soft=100, Hard=200 설정 시
              <br />
              • 1~100개 → 즉시 승인
              <br />
              • 101~200개 → 협의 필요
              <br />• 201개~ → 매입 불가
            </Box>
          </Box>
        }
        arrow
        placement="top"
      >
        <IconButton size="small" tabIndex={-1}>
          <HelpOutlineIcon fontSize="small" color="action" />
        </IconButton>
      </Tooltip>
    </InputAdornment>
  );
}
