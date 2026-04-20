'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Container, Dialog, DialogContent, DialogTitle, IconButton, Paper, Snackbar, Stack } from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import LibraryToolbar from '../../../components/library/LibraryToolbar';
import LibraryTabs from '../../../components/library/LibraryTabs';
import LibraryTabPanel from '../../../components/library/LibraryTabPanel';
import LessonDetailsDialog from '../../../components/lessons/LessonDetailsDialog';
import LessonPromptForm from '../../../components/lessons/LessonPromptForm';
import UploadMaterialDialog from '../../../components/materials/UploadMaterialDialog';
import MaterialDetailsDialog from '../../../components/materials/MaterialDetailsDialog';

export default function LibraryClient() {
  const [activeTab, setActiveTab] = useState('materials');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  const [isLoadingLessons, setIsLoadingLessons] = useState(true);
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

  const sortedLessons = useMemo(() => {
    return [...lessons].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [lessons]);

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

  const loadLessons = async () => {
    try {
      setIsLoadingLessons(true);

      const response = await fetch('/api/lessons', {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load lessons.');
      }

      setLessons(data.lessons || []);
    } catch (error) {
      console.error('Failed to load lessons:', error);

      setToast({
        open: true,
        message: error.message || 'Failed to load lessons.',
        severity: 'error',
      });
    } finally {
      setIsLoadingLessons(false);
    }
  };

  useEffect(() => {
    loadMaterials();
    loadLessons();
  }, []);

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  const handlePrimaryAction = () => {
    if (activeTab === 'materials') {
      setEditingMaterial(null);
      setIsUploadDialogOpen(true);
      return;
    }

    if (activeTab === 'lessons') {
      setIsLessonDialogOpen(true);
      return;
    }

    window.alert(`Action for "${activeTab}" will be added next.`);
  };

  const handleCloseUploadDialog = () => {
    if (isSavingMaterial) {
      return;
    }

    setEditingMaterial(null);
    setIsUploadDialogOpen(false);
  };

  const handleOpenMaterial = (material) => {
    setSelectedMaterial(material);
  };

  const handleCloseMaterial = () => {
    setSelectedMaterial(null);
  };

  const handleOpenLesson = (lesson) => {
    setSelectedLesson(lesson);
  };

  const handleCloseLesson = () => {
    setSelectedLesson(null);
  };

  const handleCloseLessonDialog = () => {
    setIsLessonDialogOpen(false);
  };

  const handleOpenSourceMaterial = (materialId) => {
    const material = materials.find((item) => item.id === materialId);

    if (!material) {
      setToast({
        open: true,
        message: 'Source material is no longer available.',
        severity: 'warning',
      });
      return;
    }

    setSelectedMaterial(material);
  };

  const handleLessonGenerated = async () => {
    await loadLessons();
    setIsLessonDialogOpen(false);

    setToast({
      open: true,
      message: 'Lesson generated successfully.',
      severity: 'success',
    });
  };

  const handleLessonUpdated = async (updatedLesson) => {
    setLessons((prev) =>
      prev.map((lesson) =>
        lesson.id === updatedLesson.id ? updatedLesson : lesson
      )
    );
    setSelectedLesson(updatedLesson);

    setToast({
      open: true,
      message: 'Lesson updated successfully.',
      severity: 'success',
    });
  };

  const handleLessonDeleted = async (lessonId) => {
    setLessons((prev) => prev.filter((lesson) => lesson.id !== lessonId));
    setSelectedLesson(null);

    setToast({
      open: true,
      message: 'Lesson deleted successfully.',
      severity: 'success',
    });
  };

  const handleEnrollLesson = async (lesson) => {
    setLessons((prev) =>
      prev.map((item) =>
        item.id === lesson.id ? { ...item, isEnrolled: true } : item
      )
    );

    try {
      const response = await fetch(`/api/lessons/${lesson.id}/enrollment`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add lesson to My Lessons.');
      }

      setToast({
        open: true,
        message: 'Lesson added to My Lessons.',
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to add lesson to My Lessons:', error);

      setLessons((prev) =>
        prev.map((item) =>
          item.id === lesson.id ? { ...item, isEnrolled: false } : item
        )
      );

      setToast({
        open: true,
        message: error.message || 'Failed to add lesson to My Lessons.',
        severity: 'error',
      });
    }
  };

  const handleUnenrollLesson = async (lesson) => {
    setLessons((prev) =>
      prev.map((item) =>
        item.id === lesson.id ? { ...item, isEnrolled: false } : item
      )
    );

    try {
      const response = await fetch(`/api/lessons/${lesson.id}/enrollment`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove lesson from My Lessons.');
      }

      setToast({
        open: true,
        message: 'Lesson removed from My Lessons.',
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to remove lesson from My Lessons:', error);

      setLessons((prev) =>
        prev.map((item) =>
          item.id === lesson.id ? { ...item, isEnrolled: true } : item
        )
      );

      setToast({
        open: true,
        message: error.message || 'Failed to remove lesson from My Lessons.',
        severity: 'error',
      });
    }
  };

  const handleEditMaterial = (material) => {
    if (!material) {
      return;
    }

    setEditingMaterial(material);
    setSelectedMaterial(null);
    setIsUploadDialogOpen(true);
  };

  const uploadNewAttachments = async (files = []) => {
    const uploadedAttachments = [];

    for (const file of files) {
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

    return uploadedAttachments;
  };

  const handleSaveMaterial = async (formData) => {
    try {
      setIsSavingMaterial(true);
      const uploadedAttachments = await uploadNewAttachments(
        formData.newAttachments || []
      );
      const retainedAttachments = (formData.existingAttachments || []).map(
        (attachment) => ({
          id: attachment.id,
          originalName: attachment.name,
          storageKey: attachment.storageKey,
          mimeType: attachment.mimeType || '',
          sizeBytes: attachment.size || 0,
          kind: attachment.kind,
        })
      );

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        youtubeUrls: formData.youtubeUrls,
        links: formData.links
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        text: formData.text.trim(),
        attachments: [...retainedAttachments, ...uploadedAttachments],
      };

      const response = await fetch(
        editingMaterial ? `/api/materials/${editingMaterial.id}` : '/api/materials',
        {
          method: editingMaterial ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            (editingMaterial
              ? 'Failed to update material.'
              : 'Failed to create material.')
        );
      }

      await loadMaterials();
      setEditingMaterial(null);
      setIsUploadDialogOpen(false);

      setToast({
        open: true,
        message: editingMaterial
          ? 'Material updated successfully.'
          : 'Material saved successfully.',
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
              lessons={sortedLessons}
              isHydrated={
                activeTab === 'lessons' ? !isLoadingLessons : !isLoadingMaterials
              }
              onOpenMaterial={handleOpenMaterial}
              onOpenLesson={handleOpenLesson}
              onEnrollLesson={handleEnrollLesson}
              onUnenrollLesson={handleUnenrollLesson}
            />
          </Stack>
        </Paper>
      </Container>

      <UploadMaterialDialog
        key={editingMaterial ? `edit-${editingMaterial.id}` : 'create-material'}
        open={isUploadDialogOpen}
        onClose={handleCloseUploadDialog}
        onSave={handleSaveMaterial}
        isSaving={isSavingMaterial}
        mode={editingMaterial ? 'edit' : 'create'}
        initialMaterial={editingMaterial}
      />

      <Dialog
        open={isLessonDialogOpen}
        onClose={handleCloseLessonDialog}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle sx={{ pr: 7 }}>
          Create lesson
          <IconButton
            aria-label="Close create lesson dialog"
            onClick={handleCloseLessonDialog}
            sx={{ position: 'absolute', right: 16, top: 12 }}
          >
            <CloseOutlinedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <LessonPromptForm
            materials={sortedMaterials}
            onLessonGenerated={handleLessonGenerated}
          />
        </DialogContent>
      </Dialog>

      <MaterialDetailsDialog
        key={selectedMaterial?.id || 'material-details'}
        open={Boolean(selectedMaterial)}
        material={selectedMaterial}
        isDeleting={isDeletingMaterial}
        onClose={handleCloseMaterial}
        onDelete={handleDeleteMaterial}
        onEdit={() => handleEditMaterial(selectedMaterial)}
      />

      <LessonDetailsDialog
        key={selectedLesson?.id || 'lesson-details'}
        open={Boolean(selectedLesson)}
        lesson={selectedLesson}
        onClose={handleCloseLesson}
        onOpenSourceMaterial={handleOpenSourceMaterial}
        onLessonDeleted={handleLessonDeleted}
        onLessonUpdated={handleLessonUpdated}
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
