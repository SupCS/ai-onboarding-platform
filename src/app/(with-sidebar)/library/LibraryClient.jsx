'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Container, Paper, Snackbar, Stack } from '@mui/material';
import LibraryToolbar from '../../../components/library/LibraryToolbar';
import LibraryTabs from '../../../components/library/LibraryTabs';
import LibraryTabPanel from '../../../components/library/LibraryTabPanel';
import UploadMaterialDialog from '../../../components/materials/UploadMaterialDialog';

const MATERIALS_STORAGE_KEY = 'ai-onboarding-materials';

export default function LibraryClient() {
  const [activeTab, setActiveTab] = useState('materials');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    try {
      const storedMaterials = window.localStorage.getItem(MATERIALS_STORAGE_KEY);

      if (storedMaterials) {
        setMaterials(JSON.parse(storedMaterials));
      }
    } catch (error) {
      console.error('Failed to load materials from localStorage:', error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(
        MATERIALS_STORAGE_KEY,
        JSON.stringify(materials)
      );
    } catch (error) {
      console.error('Failed to save materials to localStorage:', error);
    }
  }, [materials, isHydrated]);

  const sortedMaterials = useMemo(() => {
    return [...materials].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [materials]);

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  const handlePrimaryAction = () => {
    if (activeTab === 'materials') {
      setIsUploadDialogOpen(true);
      return;
    }

    window.alert(`Action for "${activeTab}" will be added next.`);
  };

  const handleCloseUploadDialog = () => {
    setIsUploadDialogOpen(false);
  };

  const handleSaveMaterial = (materialData) => {
    const newMaterial = {
      id: crypto.randomUUID(),
      title: materialData.title.trim(),
      type: materialData.type,
      description: materialData.description.trim(),
      source: materialData.source.trim(),
      createdAt: new Date().toISOString(),
    };

    setMaterials((prev) => [newMaterial, ...prev]);
    setIsUploadDialogOpen(false);
    setToast({
      open: true,
      message: 'Material saved successfully.',
      severity: 'success',
    });
  };

  const handleDeleteMaterial = (materialId) => {
    setMaterials((prev) => prev.filter((item) => item.id !== materialId));
    setToast({
      open: true,
      message: 'Material deleted.',
      severity: 'success',
    });
  };

  const handleCloseToast = () => {
    setToast((prev) => ({
      ...prev,
      open: false,
    }));
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
            <LibraryTabPanel
              activeTab={activeTab}
              materials={sortedMaterials}
              isHydrated={isHydrated}
              onDeleteMaterial={handleDeleteMaterial}
            />
          </Stack>
        </Paper>
      </Container>

      <UploadMaterialDialog
        open={isUploadDialogOpen}
        onClose={handleCloseUploadDialog}
        onSave={handleSaveMaterial}
      />

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseToast}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
}