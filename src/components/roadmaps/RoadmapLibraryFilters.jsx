'use client';

import { useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  MenuItem,
  Popover,
  Stack,
  TextField,
} from '@mui/material';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import { AI_DIGITAL_COLORS } from '../../lib/brandColors';

const enrollmentOptions = [
  { value: 'all', label: 'Any roadmap' },
  { value: 'enrolled', label: 'In My Roadmaps' },
  { value: 'not-enrolled', label: 'Not in My Roadmaps' },
];

export default function RoadmapLibraryFilters({
  query,
  onQueryChange,
  selectedTags = [],
  onSelectedTagsChange,
  availableTags = [],
  enrollment,
  onEnrollmentChange,
  totalCount = 0,
  resultCount = 0,
  hasActiveFilters = false,
  filtersOpen = false,
  onToggleFilters,
  onReset,
}) {
  const [filtersAnchorEl, setFiltersAnchorEl] = useState(null);

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

  return (
    <Box>
      <Stack spacing={1.25}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'flex-end' }}
        >
          <TextField
            label="Search roadmaps"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Title, tag, creator, lesson..."
            size="small"
            sx={{
              maxWidth: { md: 420 },
              flex: '0 1 420px',
              ml: { md: 'auto' },
              '& .MuiInputBase-root': {
                borderRadius: 2.5,
                backgroundColor: '#fff',
              },
            }}
            fullWidth
            slotProps={{
              input: {
                startAdornment: <SearchOutlinedIcon color="action" sx={{ mr: 1, fontSize: 20 }} />,
              },
            }}
          />

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: { xs: 'space-between', md: 'flex-end' } }}>
            <Chip
              label={`${resultCount}/${totalCount}`}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 800, backgroundColor: '#fff' }}
            />
            <Button
              variant={filtersOpen ? 'contained' : 'outlined'}
              color="inherit"
              startIcon={<TuneOutlinedIcon />}
              onClick={handleToggleFilters}
              sx={{
                minWidth: 102,
                textTransform: 'none',
                fontWeight: 850,
                borderRadius: 2.5,
                ...(filtersOpen
                  ? {
                      color: '#fff',
                      backgroundColor: AI_DIGITAL_COLORS.yvesKleinBlue,
                      '&:hover': { backgroundColor: AI_DIGITAL_COLORS.violetPulse },
                    }
                  : {}),
              }}
            >
              Filters
            </Button>
          </Stack>
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
                border: '1px solid #e5e7eb',
                boxShadow: '0 22px 60px rgba(15, 23, 42, 0.16)',
              },
            },
          }}
        >
          <Stack spacing={1.5}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                },
                gap: 1,
                '& .MuiInputBase-root': {
                  minWidth: 0,
                },
                '& .MuiInputBase-input': {
                  minWidth: 0,
                },
              }}
            >
              <Autocomplete
                multiple
                options={availableTags}
                value={selectedTags}
                onChange={(_event, nextTags) => onSelectedTagsChange(nextTags)}
                size="small"
                renderValue={(value, getItemProps) =>
                  value.map((tag, index) => {
                    const { key, ...itemProps } = getItemProps({ index });

                    return (
                      <Chip
                        key={key}
                        label={tag}
                        size="small"
                        {...itemProps}
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tags"
                    placeholder="Choose tags"
                  />
                )}
              />

              <TextField
                select
                label="My Roadmaps"
                value={enrollment}
                onChange={(event) => onEnrollmentChange(event.target.value)}
                size="small"
                fullWidth
              >
                {enrollmentOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

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
      </Stack>
    </Box>
  );
}
