import { Box, Button, Typography } from '@mui/material';

const actionMap = {
  materials: 'Upload Material',
  lessons: 'Create Lesson',
  roadmaps: 'Create Roadmap',
};

export default function LibraryToolbar({ activeTab, onPrimaryAction }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', md: 'center' },
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        mb: 3,
      }}
    >
      <Box>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
          Library
        </Typography>

        <Typography variant="body1" color="text.secondary">
          Manage materials, lessons, and roadmaps in one place.
        </Typography>
      </Box>

      <Button variant="contained" size="large" onClick={onPrimaryAction}>
        {actionMap[activeTab]}
      </Button>
    </Box>
  );
}