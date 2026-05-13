'use client';

import {
  Autocomplete,
  Chip,
  TextField,
} from '@mui/material';
import LibrarySearchToolbar from '../library/LibrarySearchToolbar';

export default function MaterialLibrarySearch({
  query,
  onQueryChange,
  sort = 'recent',
  onSortChange,
  selectedTags = [],
  onSelectedTagsChange,
  availableTags = [],
  totalCount = 0,
  resultCount = 0,
  hasActiveFilters = false,
  filtersOpen = false,
  onToggleFilters,
  onReset,
}) {
  return (
    <LibrarySearchToolbar
      searchLabel="Search materials"
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
        <Autocomplete
          multiple
          options={availableTags}
          value={selectedTags}
          onChange={(_event, nextTags) => onSelectedTagsChange?.(nextTags)}
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
      }
    />
  );
}
