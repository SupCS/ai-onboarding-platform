'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Container, Paper, Snackbar, Stack } from '@mui/material';
import LibraryToolbar from '../../../components/library/LibraryToolbar';
import LibraryTabs from '../../../components/library/LibraryTabs';
import LibraryTabPanel from '../../../components/library/LibraryTabPanel';
import UploadMaterialDialog from '../../../components/materials/UploadMaterialDialog';
import MaterialDetailsDialog from '../../../components/materials/MaterialDetailsDialog';

export default function LibraryClient() {
  const [activeTab, setActiveTab] = useState('materials');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  const [isSavingMaterial, setIsSavingMaterial] = useState(false);
  const [isDeletingMaterial, setIsDeletingMaterial] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const sortedMaterials = useMemo(() => {
    return [...materials].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [materials]);

  const loadMaterials = async () => {
    try {
      setIsLoadingMaterials(true);

      const response = await fetch('/api/materials', {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load materials.');
      }

      const normalizedMaterials = (data.materials || []).map((material) => ({
        ...material,
        attachments: material.attachments || [],
      }));

      setMaterials(normalizedMaterials);
    } catch (error) {
      console.error('Failed to load materials:', error);

      setToast({
        open: true,
        message: error.message || 'Failed to load materials.',
        severity: 'error',
      });
    } finally {
      setIsLoadingMaterials(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

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
    if (isSavingMaterial) {
      return;
    }

    setIsUploadDialogOpen(false);
  };

  const handleOpenMaterial = (material) => {
    setSelectedMaterial(material);
  };

  const handleCloseMaterial = () => {
    setSelectedMaterial(null);
  };

  const handleEditMaterial = () => {
    setToast({
      open: true,
      message: 'Edit material is the next step.',
      severity: 'info',
    });
  };

  const handleSaveMaterial = async (formData) => {
    try {
      setIsSavingMaterial(true);

      const uploadedAttachments = [];

      for (const file of formData.attachments || []) {
        const uploadUrlResponse = await fetch('/api/materials/upload-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type || 'application/octet-stream',
            size: file.size,
          }),
        });

        const uploadUrlData = await uploadUrlResponse.json();

        if (!uploadUrlResponse.ok) {
          throw new Error(uploadUrlData.error || 'Failed to prepare file upload.');
        }

        const uploadResponse = await fetch(uploadUrlData.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload file: ${file.name}`);
        }

        uploadedAttachments.push({
          originalName: file.name,
          storageKey: uploadUrlData.storageKey,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          kind: file.type.startsWith('image/') ? 'image' : 'file',
        });
      }

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        youtubeUrls: formData.youtubeUrls,
        links: formData.links
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        text: formData.text.trim(),
        attachments: uploadedAttachments,
      };

      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create material.');
      }

      await loadMaterials();
      setIsUploadDialogOpen(false);

      setToast({
        open: true,
        message: 'Material saved successfully.',
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to save material:', error);

      setToast({
        open: true,
        message: error.message || 'Failed to save material.',
        severity: 'error',
      });
    } finally {
      setIsSavingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (material) => {
    try {
      setIsDeletingMaterial(true);

      const response = await fetch(`/api/materials/${material.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete material.');
      }

      setMaterials((prev) => prev.filter((item) => item.id !== material.id));
      setSelectedMaterial((prev) => (prev?.id === material.id ? null : prev));

      setToast({
        open: true,
        message: 'Material deleted successfully.',
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to delete material:', error);

      setToast({
        open: true,
        message: error.message || 'Failed to delete material.',
        severity: 'error',
      });
    } finally {
      setIsDeletingMaterial(false);
    }
  };

  const handleCloseToast = () => {
    setToast((prev) => ({
      ...prev,
      open: false,
    }));
  };

  return (
    <>
      <Container maxWidth={false} disableGutters>
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
              isHydrated={!isLoadingMaterials}
              onOpenMaterial={handleOpenMaterial}
            />
          </Stack>
        </Paper>
      </Container>

      <UploadMaterialDialog
        open={isUploadDialogOpen}
        onClose={handleCloseUploadDialog}
        onSave={handleSaveMaterial}
        isSaving={isSavingMaterial}
      />

      <MaterialDetailsDialog
        key={selectedMaterial?.id || 'material-details'}
        open={Boolean(selectedMaterial)}
        material={selectedMaterial}
        isDeleting={isDeletingMaterial}
        onClose={handleCloseMaterial}
        onDelete={handleDeleteMaterial}
        onEdit={handleEditMaterial}
      />

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
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
