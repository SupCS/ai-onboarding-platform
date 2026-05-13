'use client';

import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SortOutlinedIcon from '@mui/icons-material/SortOutlined';
import { useState } from 'react';
import { AI_DIGITAL_COLORS } from '../../lib/brandColors';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Most recent' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'az', label: 'Title A -> Z' },
  { value: 'za', label: 'Title Z -> A' },
  { value: 'popular', label: 'Most used' },
];

export default function MaterialLibrarySearch({
  query,
  onQueryChange,
  sort = 'recent',
  onSortChange,
  totalCount = 0,
  resultCount = 0,
}) {
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const sortOpen = Boolean(sortAnchorEl);
  const activeSortLabel =
    SORT_OPTIONS.find((option) => option.value === sort)?.label || SORT_OPTIONS[0].label;

  const handleSortChange = (value) => {
    onSortChange?.(value);
    setSortAnchorEl(null);
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.25}
        sx={{
          alignItems: { xs: 'stretch', md: 'flex-end' },
          justifyContent: 'flex-end',
        }}
      >
        <Box
          sx={{
            maxWidth: { md: 360 },
            flex: '0 1 360px',
            ml: { md: 'auto' },
          }}
        >
          <Box
            sx={{
              mb: 0.5,
              color: '#80808E',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.08em',
              lineHeight: 1.2,
              textTransform: 'uppercase',
            }}
          >
            Search materials
          </Box>
          <TextField
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Title, description, text..."
            size="small"
            sx={{
              '& .MuiInputBase-root': {
                minHeight: 38,
                borderRadius: 999,
                backgroundColor: '#fff',
                color: '#33344A',
                fontSize: 13,
                fontWeight: 600,
                pr: query ? 0.5 : 1.75,
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(0, 9, 220, 0.2)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(0, 9, 220, 0.35)',
              },
              '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: AI_DIGITAL_COLORS.yvesKleinBlue,
              },
            }}
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <SearchOutlinedIcon sx={{ mr: 1, color: '#80808E', fontSize: 18 }} />
                ),
                endAdornment: query ? (
                  <IconButton
                    aria-label="Clear material search"
                    size="small"
                    onClick={() => onQueryChange('')}
                    sx={{
                      width: 20,
                      height: 20,
                      backgroundColor: '#F2F1F3',
                      color: '#80808E',
                      '&:hover': { backgroundColor: '#E7E6EA' },
                    }}
                  >
                    <CloseOutlinedIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                ) : null,
              },
            }}
          />
        </Box>

        <Button
          variant="outlined"
          startIcon={<SortOutlinedIcon />}
          endIcon={
            <KeyboardArrowDownOutlinedIcon
              sx={{
                transition: 'transform 120ms ease',
                transform: sortOpen ? 'rotate(180deg)' : 'none',
              }}
            />
          }
          onClick={(event) => setSortAnchorEl(event.currentTarget)}
          sx={{
            minHeight: 38,
            justifyContent: 'space-between',
            borderRadius: 999,
            borderColor: 'rgba(0, 9, 220, 0.2)',
            backgroundColor: '#fff',
            color: '#33344A',
            px: 1.75,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            '&:hover': {
              borderColor: 'rgba(0, 9, 220, 0.35)',
              backgroundColor: '#fff',
            },
          }}
        >
          Sort: <Box component="strong" sx={{ ml: 0.5, color: '#0B0B0B', fontWeight: 800, letterSpacing: 0, textTransform: 'none' }}>{activeSortLabel}</Box>
        </Button>

        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 32,
            px: 1.5,
            mb: 0.375,
            borderRadius: 999,
            backgroundColor: '#F2F1F3',
            color: '#33344A',
            fontSize: 12,
            fontWeight: 800,
            whiteSpace: 'nowrap',
            '& span': {
              ml: 0.25,
              color: '#80808E',
              fontWeight: 600,
            },
          }}
        >
          {resultCount}<span>/{totalCount}</span>
        </Box>
      </Stack>

      <Menu
        anchorEl={sortAnchorEl}
        open={sortOpen}
        onClose={() => setSortAnchorEl(null)}
        disableScrollLock
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              mt: 0.75,
              minWidth: 200,
              border: '1px solid rgba(0, 9, 220, 0.12)',
              borderRadius: 1.5,
              boxShadow: '0 12px 32px rgba(11, 11, 11, 0.12)',
              p: 0.75,
            },
          },
        }}
      >
        {SORT_OPTIONS.map((option) => {
          const selected = option.value === sort;

          return (
            <MenuItem
              key={option.value}
              selected={selected}
              onClick={() => handleSortChange(option.value)}
              sx={{
                minHeight: 36,
                borderRadius: 1,
                color: selected ? AI_DIGITAL_COLORS.yvesKleinBlue : '#33344A',
                fontSize: 13,
                fontWeight: selected ? 800 : 600,
                justifyContent: 'space-between',
                '&.Mui-selected': {
                  backgroundColor: '#F5F5FE',
                },
                '&.Mui-selected:hover': {
                  backgroundColor: '#F5F5FE',
                },
              }}
            >
              {option.label}
              {selected && <CheckOutlinedIcon sx={{ ml: 2, fontSize: 16 }} />}
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
}
