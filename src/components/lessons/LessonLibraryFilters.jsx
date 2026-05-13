'use client';

import {
  Autocomplete,
  Box,
  Chip,
  MenuItem,
  TextField,
} from '@mui/material';
import LibrarySearchToolbar from '../library/LibrarySearchToolbar';

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
  sort = 'recent',
  onSortChange,
  totalCount = 0,
  resultCount = 0,
  hasActiveFilters = false,
  filtersOpen = false,
  onToggleFilters,
  onReset,
}) {
  return (
    <LibrarySearchToolbar
      searchLabel="Search lessons"
      placeholder="Title, tag, creator..."
      query={query}
      onQueryChange={onQueryChange}
      resultCount={resultCount}
      totalCount={totalCount}
      filtersOpen={filtersOpen}
      onToggleFilters={onToggleFilters}
      hasActiveFilters={hasActiveFilters}
      onReset={onReset}
      sort={sort}
      onSortChange={onSortChange}
      filterContent={
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
      }
    />
  );
}
