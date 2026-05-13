'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Popover,
  Stack,
  TextField,
} from '@mui/material';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SortOutlinedIcon from '@mui/icons-material/SortOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import { AI_DIGITAL_COLORS } from '../../lib/brandColors';

export const LIBRARY_SORT_OPTIONS = [
  { value: 'recent', label: 'Most recent' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'az', label: 'Title A -> Z' },
  { value: 'za', label: 'Title Z -> A' },
];

export default function LibrarySearchToolbar({
  searchLabel,
  placeholder,
  query,
  onQueryChange,
  resultCount = 0,
  totalCount = 0,
  filtersOpen = false,
  onToggleFilters,
  hasActiveFilters = false,
  onReset,
  filterContent,
  sort = 'recent',
  onSortChange,
  sortOptions = LIBRARY_SORT_OPTIONS,
}) {
  const [filtersAnchorEl, setFiltersAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const sortOpen = Boolean(sortAnchorEl);

  const handleToggleFilters = (event) => {
    if (filtersOpen) {
      setFiltersAnchorEl(null);
      onToggleFilters?.();
      return;
    }

    setFiltersAnchorEl(event.currentTarget);
    onToggleFilters?.();
  };

  const handleCloseFilters = () => {
    setFiltersAnchorEl(null);

    if (filtersOpen) {
      onToggleFilters?.();
    }
  };

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
            maxWidth: { md: 390 },
            flex: '1 1 390px',
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
            {searchLabel}
          </Box>
          <TextField
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={placeholder}
            size="small"
            sx={{
              '& .MuiInputBase-root': {
                minHeight: 38,
                borderRadius: 999,
                backgroundColor: '#fff',
                color: '#33344A',
                fontSize: 13,
                fontWeight: 700,
                pr: query ? 0.75 : 2,
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#80808E',
                opacity: 0.72,
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(0, 9, 220, 0.22)',
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
                    aria-label={`Clear ${searchLabel.toLowerCase()}`}
                    size="small"
                    onClick={() => onQueryChange('')}
                    sx={{
                      width: 22,
                      height: 22,
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
            fontWeight: 600,
            whiteSpace: 'nowrap',
            '& span': {
              ml: 0.25,
              color: '#33344A',
              fontSize: 12,
              fontWeight: 600,
            },
          }}
        >
          {resultCount}<span>/{totalCount}</span>
        </Box>

        <Button
          variant={filtersOpen ? 'contained' : 'outlined'}
          color="inherit"
          startIcon={<TuneOutlinedIcon />}
          onClick={handleToggleFilters}
          sx={{
            minHeight: 38,
            minWidth: 118,
            borderRadius: 999,
            borderColor: 'rgba(0, 9, 220, 0.22)',
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            ...(filtersOpen
              ? {
                  color: '#fff',
                  backgroundColor: AI_DIGITAL_COLORS.yvesKleinBlue,
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: '#0007B8',
                    boxShadow: 'none',
                  },
                }
              : {
                  backgroundColor: '#fff',
                  color: '#0B0B0B',
                  '&:hover': {
                    borderColor: 'rgba(0, 9, 220, 0.35)',
                    backgroundColor: '#fff',
                  },
                }),
          }}
        >
          Filters
        </Button>

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
            borderColor: 'rgba(0, 9, 220, 0.22)',
            backgroundColor: '#fff',
            color: '#0B0B0B',
            px: 1.75,
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            '&:hover': {
              borderColor: 'rgba(0, 9, 220, 0.35)',
              backgroundColor: '#fff',
            },
          }}
        >
          Sort
        </Button>
      </Stack>

      <Popover
        open={filtersOpen && Boolean(filtersAnchorEl)}
        anchorEl={filtersAnchorEl}
        onClose={handleCloseFilters}
        disableScrollLock
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              p: 2,
              width: { xs: 'calc(100vw - 32px)', sm: 560 },
              maxWidth: 'calc(100vw - 32px)',
              borderRadius: 3,
              border: '1px solid rgba(0, 9, 220, 0.12)',
              boxShadow: '0 22px 60px rgba(15, 23, 42, 0.16)',
            },
          },
        }}
      >
        <Stack spacing={1.5}>
          {filterContent}

          {hasActiveFilters && (
            <Button
              variant="text"
              color="inherit"
              startIcon={<RestartAltOutlinedIcon />}
              onClick={onReset}
              sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 800 }}
            >
              Reset filters
            </Button>
          )}
        </Stack>
      </Popover>

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
        {sortOptions.map((option) => {
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
