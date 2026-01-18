import type { SxProps, Theme } from '@mui/material/styles';

export const dataGridStyles: SxProps<Theme> = {
  border: 'none',
  '& .MuiDataGrid-columnHeaders': {
    bgcolor: 'grey.50',
    borderBottom: '1px solid',
    borderColor: 'divider',
  },
  '& .MuiDataGrid-columnHeaderTitle': {
    fontWeight: 600,
    fontSize: 13,
  },
  '& .MuiDataGrid-cell': {
    borderColor: 'divider',
    display: 'flex',
    alignItems: 'center',
  },
  '& .MuiDataGrid-row:hover': {
    bgcolor: 'action.hover',
  },
};

export const dataGridLocaleText = {
  noRowsLabel: '데이터가 없습니다',
};
