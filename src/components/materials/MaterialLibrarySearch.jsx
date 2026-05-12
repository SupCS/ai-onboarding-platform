'use client';

import {
  Box,
  Chip,
  Stack,
  TextField,
} from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

export default function MaterialLibrarySearch({
  query,
  onQueryChange,
  totalCount = 0,
  resultCount = 0,
}) {
  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1}
        sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'flex-end' }}
      >
        <TextField
          label="Search materials"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Title, description, text..."
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

        <Chip
          label={`${resultCount}/${totalCount}`}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 800, backgroundColor: '#fff' }}
        />
      </Stack>
    </Box>
  );
}
