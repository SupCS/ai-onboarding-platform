'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';

const libraryTabs = [
  { value: 'materials', label: 'Materials' },
  { value: 'lessons', label: 'Lessons' },
  { value: 'roadmaps', label: 'Roadmaps' },
];

function LibraryToolbar({ activeTab, onPrimaryAction }) {
  const actionMap = {
    materials: 'Upload Material',
    lessons: 'Create Lesson',
    roadmaps: 'Create Roadmap',
  };

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

function EmptyState({ title, description }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 4,
        border: '1px solid #e5e7eb',
        backgroundColor: '#fff',
      }}
    >
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
        {title}
      </Typography>

      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Paper>
  );
}

function LibraryTabPanel({ activeTab }) {
  if (activeTab === 'materials') {
    return (
      <EmptyState
        title="No materials yet"
        description="Uploaded documents and videos will appear here. This is where users with permission will manage source content."
      />
    );
  }

  if (activeTab === 'lessons') {
    return (
      <EmptyState
        title="No lessons yet"
        description="Lessons created from one or multiple materials will appear here."
      />
    );
  }

  return (
    <EmptyState
      title="No roadmaps yet"
      description="Roadmaps built from multiple lessons will appear here."
    />
  );
}

function UploadMaterialDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Upload Material</DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Title" fullWidth />

          <TextField
            label="Material Type"
            select
            fullWidth
            defaultValue="document"
          >
            <MenuItem value="document">Document</MenuItem>
            <MenuItem value="video">Video</MenuItem>
          </TextField>

          <TextField
            label="Description"
            fullWidth
            multiline
            minRows={3}
          />

          <TextField
            label="Source URL or file placeholder"
            fullWidth
            placeholder="For now we will keep this as a simple placeholder field"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button variant="contained">
          Save Material
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function LibraryClient() {
  const [activeTab, setActiveTab] = useState('materials');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  const handlePrimaryAction = () => {
    if (activeTab === 'materials') {
      setIsUploadDialogOpen(true);
      return;
    }

    alert(`Action for "${activeTab}" will be added next.`);
  };

  const handleCloseUploadDialog = () => {
    setIsUploadDialogOpen(false);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          alignItems: 'flex-start',
        }}
      >
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: '1px solid #e5e7eb',
              backgroundColor: '#f8fafc',
            }}
          >
            <LibraryToolbar
              activeTab={activeTab}
              onPrimaryAction={handlePrimaryAction}
            />

            <Paper
              elevation={0}
              sx={{
                mb: 3,
                p: 1,
                borderRadius: 4,
                border: '1px solid #e5e7eb',
                backgroundColor: '#fff',
              }}
            >
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  px: 1,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    minHeight: 48,
                  },
                }}
              >
                {libraryTabs.map((tab) => (
                  <Tab key={tab.value} value={tab.value} label={tab.label} />
                ))}
              </Tabs>
            </Paper>

            <Stack spacing={3}>
              <LibraryTabPanel activeTab={activeTab} />
            </Stack>
          </Paper>
        </Box>
      </Box>

      <UploadMaterialDialog
        open={isUploadDialogOpen}
        onClose={handleCloseUploadDialog}
      />
    </Container>
  );
}