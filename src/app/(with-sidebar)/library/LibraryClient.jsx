'use client';

import { useState } from 'react';
import { Container, Paper, Stack } from '@mui/material';
import LibraryToolbar from '../../../components/library/LibraryToolbar';
import LibraryTabs from '../../../components/library/LibraryTabs';
import LibraryTabPanel from '../../../components/library/LibraryTabPanel';
import UploadMaterialDialog from '../../../components/materials/UploadMaterialDialog';

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
    <>
      <Container maxWidth="xl" disableGutters>
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

          <LibraryTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          <Stack spacing={3}>
            <LibraryTabPanel activeTab={activeTab} />
          </Stack>
        </Paper>
      </Container>

      <UploadMaterialDialog
        open={isUploadDialogOpen}
        onClose={handleCloseUploadDialog}
      />
    </>
  );
}