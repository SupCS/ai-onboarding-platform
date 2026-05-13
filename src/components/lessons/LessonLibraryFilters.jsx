'use client';

import { useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Popover,
  Stack,
  TextField,
} from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import { AI_DIGITAL_COLORS, hexToRgba } from '../../lib/brandColors';

const activityOptions = [
  { value: 'all', label: 'Any activity' },
  { value: 'quiz', label: 'Has quiz' },
  { value: 'flashcards', label: 'Has flashcards' },
  { value: 'no-activities', label: 'No activities' },
];

const enrollmentOptions = [
  { value: 'all', label: 'Any enrollment' },
  { value: 'enrolled', label: 'In My Lessons' },
  { value: 'not-enrolled', label: 'Not in My Lessons' },
];

const lessonStatusOptions = [
  { value: 'ready', label: 'Ready' },
  { value: 'archived', label: 'Archived' },
  { value: 'pending', label: 'Pending' },
  { value: 'all', label: 'All' },
];

export default function LessonLibraryFilters({
  query,
  onQueryChange,
  status,
  onStatusChange,
  selectedTags = [],
  onSelectedTagsChange,
  availableTags = [],
  activity,
  onActivityChange,
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
          sx={{ alignItems: { xs: 'stretch', md: 'flex-end' }, justifyContent: 'flex-end' }}
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
              Search lessons
            </Box>
            <TextField
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Title, tag, creator..."
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
                  startAdornment: <SearchOutlinedIcon sx={{ mr: 1, color: '#80808E', fontSize: 18 }} />,
                  endAdornment: query ? (
                    <IconButton
                      aria-label="Clear lesson search"
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

          <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-end', justifyContent: { xs: 'space-between', md: 'flex-end' } }}>
            <Chip
              label={
                <Box component="span">
                  {resultCount}
                  <Box component="span" sx={{ ml: 0.25, color: '#80808E', fontWeight: 600 }}>
                    /{totalCount}
                  </Box>
                </Box>
              }
              size="small"
              sx={{
                height: 32,
                borderRadius: 999,
                backgroundColor: '#F2F1F3',
                color: '#33344A',
                fontSize: 12,
                fontWeight: 800,
              }}
            />
            <Button
              variant={filtersOpen ? 'contained' : 'outlined'}
              color="inherit"
              startIcon={<TuneOutlinedIcon />}
              onClick={handleToggleFilters}
              sx={{
                minHeight: 38,
                minWidth: 102,
                borderRadius: 999,
                borderColor: 'rgba(0, 9, 220, 0.2)',
                fontSize: 12,
                fontWeight: 800,
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
                      color: '#33344A',
                      '&:hover': {
                        borderColor: 'rgba(0, 9, 220, 0.35)',
                        backgroundColor: '#fff',
                      },
                    }),
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
                label="Status"
                value={status}
                onChange={(event) => onStatusChange(event.target.value)}
                size="small"
                fullWidth
              >
                {lessonStatusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Activity"
                value={activity}
                onChange={(event) => onActivityChange(event.target.value)}
                size="small"
                fullWidth
              >
                {activityOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="My Lessons"
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
