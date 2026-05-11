'use client';

import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Collapse,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
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

export default function LessonLibraryFilters({
  query,
  onQueryChange,
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
  return (
    <Box>
      <Stack spacing={1.25}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}
        >
          <TextField
            label="Search lessons"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Title, tag, creator..."
            size="small"
            sx={{
              maxWidth: { md: 420 },
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
              onClick={onToggleFilters}
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
            {hasActiveFilters && (
              <Button
                variant="text"
                color="inherit"
                startIcon={<RestartAltOutlinedIcon />}
                onClick={onReset}
                sx={{ textTransform: 'none', fontWeight: 800 }}
              >
                Reset
              </Button>
            )}
          </Stack>
        </Stack>

        <Collapse in={filtersOpen} timeout="auto" unmountOnExit>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'minmax(240px, 1fr) repeat(2, minmax(170px, 0.55fr))',
              },
              gap: 1,
              pt: 1,
              borderTop: `1px solid ${hexToRgba(AI_DIGITAL_COLORS.midnightCharcoal, 0.08)}`,
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
        </Collapse>
      </Stack>
    </Box>
  );
}
