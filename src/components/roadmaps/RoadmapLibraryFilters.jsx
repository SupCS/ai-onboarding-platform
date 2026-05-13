'use client';

import {
  Autocomplete,
  Box,
  Chip,
  MenuItem,
  TextField,
} from '@mui/material';
import LibrarySearchToolbar from '../library/LibrarySearchToolbar';

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
      searchLabel="Search roadmaps"
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
      }
    />
  );
}
