'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import ClearIcon from '@mui/icons-material/Clear';

interface SearchToolbarProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  visibilityFilter: 'all' | 'visible' | 'hidden';
  onVisibilityFilterChange: (value: 'all' | 'visible' | 'hidden') => void;
  onRefresh: () => void;
}

export default function SearchToolbar({
  searchText,
  onSearchChange,
  visibilityFilter,
  onVisibilityFilterChange,
  onRefresh,
}: SearchToolbarProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        mb: 2,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      {/* Search Input */}
      <TextField
        placeholder="앨범명, 아티스트, ISBN으로 검색..."
        size="small"
        value={searchText}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ minWidth: 300, flex: 1, maxWidth: 400 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: searchText && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => onSearchChange('')}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {/* Visibility Filter */}
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>공개 상태</InputLabel>
        <Select
          value={visibilityFilter}
          label="공개 상태"
          onChange={(e) => onVisibilityFilterChange(e.target.value as 'all' | 'visible' | 'hidden')}
        >
          <MenuItem value="all">전체</MenuItem>
          <MenuItem value="visible">공개</MenuItem>
          <MenuItem value="hidden">비공개</MenuItem>
        </Select>
      </FormControl>

      {/* Refresh Button */}
      <Tooltip title="새로고침">
        <IconButton onClick={onRefresh} color="primary">
          <RefreshIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
