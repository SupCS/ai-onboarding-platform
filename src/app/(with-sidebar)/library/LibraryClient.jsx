'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Container, Dialog, DialogContent, DialogTitle, IconButton, Paper, Snackbar, Stack } from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import LibraryToolbar from '../../../components/library/LibraryToolbar';
import LibraryTabs from '../../../components/library/LibraryTabs';
import LibraryTabPanel from '../../../components/library/LibraryTabPanel';
import LearningAssignmentDialog from '../../../components/learning/LearningAssignmentDialog';
import LessonDetailsDialog from '../../../components/lessons/LessonDetailsDialog';
import LessonLibraryFilters from '../../../components/lessons/LessonLibraryFilters';
import LessonPromptForm from '../../../components/lessons/LessonPromptForm';
import MaterialLibrarySearch from '../../../components/materials/MaterialLibrarySearch';
import UploadMaterialDialog from '../../../components/materials/UploadMaterialDialog';
import MaterialDetailsDialog from '../../../components/materials/MaterialDetailsDialog';
import RoadmapFormDialog from '../../../components/roadmaps/RoadmapFormDialog';
import RoadmapLibraryFilters from '../../../components/roadmaps/RoadmapLibraryFilters';
import { useTaskTray } from '../../../components/providers/TaskTrayProvider';

export default function LibraryClient({ currentUserPermissions = {} }) {
  const { addTask, updateTask } = useTaskTray();
  const [activeTab, setActiveTab] = useState('materials');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [isRoadmapDialogOpen, setIsRoadmapDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [editingRoadmap, setEditingRoadmap] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [lessonSearchQuery, setLessonSearchQuery] = useState('');
  const [lessonStatusFilter, setLessonStatusFilter] = useState('ready');
  const [lessonSelectedTags, setLessonSelectedTags] = useState([]);
  const [lessonActivityFilter, setLessonActivityFilter] = useState('all');
  const [lessonEnrollmentFilter, setLessonEnrollmentFilter] = useState('all');
  const [areLessonFiltersOpen, setAreLessonFiltersOpen] = useState(false);
  const [roadmapSearchQuery, setRoadmapSearchQuery] = useState('');
  const [roadmapSelectedTags, setRoadmapSelectedTags] = useState([]);
  const [roadmapEnrollmentFilter, setRoadmapEnrollmentFilter] = useState('all');
  const [areRoadmapFiltersOpen, setAreRoadmapFiltersOpen] = useState(false);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  const [isLoadingLessons, setIsLoadingLessons] = useState(true);
  const [isLoadingRoadmaps, setIsLoadingRoadmaps] = useState(true);
  const [isSavingMaterial, setIsSavingMaterial] = useState(false);
  const [isSavingRoadmap, setIsSavingRoadmap] = useState(false);
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const [isDeletingMaterial, setIsDeletingMaterial] = useState(false);
  const [isDeletingRoadmap, setIsDeletingRoadmap] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [hasLoadedAssignableUsers, setHasLoadedAssignableUsers] = useState(false);
  const [isLoadingAssignableUsers, setIsLoadingAssignableUsers] = useState(false);
  const [assignmentDialog, setAssignmentDialog] = useState({
    open: false,
    itemType: 'lesson',
    item: null,
    selectedUserIds: [],
  });
  const [materialFormResetKey, setMaterialFormResetKey] = useState(0);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const canCreateMaterials = Boolean(currentUserPermissions['materials.create']);
  const canEditMaterials = Boolean(currentUserPermissions['materials.edit']);
  const canDeleteMaterials = Boolean(currentUserPermissions['materials.delete']);
  const canCreateLessons = Boolean(currentUserPermissions['lessons.create']);
  const canCreateRoadmaps = Boolean(currentUserPermissions['roadmaps.create']);
  const canAssignLearning = Boolean(currentUserPermissions['learning.assign']);

  const sortedMaterials = useMemo(() => {
    return [...materials].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    const normalizedQuery = materialSearchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return sortedMaterials;
    }

    return sortedMaterials.filter((material) => {
      const attachmentNames = Array.isArray(material.attachments)
        ? material.attachments.map((attachment) => attachment.name)
        : [];
      const searchableText = [
        material.title,
        material.description,
        material.text,
        ...attachmentNames,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [materialSearchQuery, sortedMaterials]);

  const hasActiveMaterialSearch = materialSearchQuery.trim().length > 0;

  const sortedLessons = useMemo(() => {
    return [...lessons].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [lessons]);

  const lessonAvailableTags = useMemo(() => {
    const tagSet = new Set();

    lessons.forEach((lesson) => {
      (Array.isArray(lesson.tags) ? lesson.tags : []).forEach((tag) => {
        if (tag) {
          tagSet.add(tag);
        }
      });
    });

    return [...tagSet].sort((a, b) => a.localeCompare(b));
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    const normalizedQuery = lessonSearchQuery.trim().toLowerCase();

    return sortedLessons.filter((lesson) => {
      const tags = Array.isArray(lesson.tags) ? lesson.tags : [];
      const activities = Array.isArray(lesson.activities) ? lesson.activities : [];
      const isArchived = lesson.publicationStatus === 'archived' || lesson.isArchived;

      if (normalizedQuery) {
        const searchableText = [
          lesson.title,
          lesson.description,
          lesson.createdBy,
          lesson.status,
          ...tags,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(normalizedQuery)) {
          return false;
        }
      }

      if (lessonStatusFilter === 'ready' && (lesson.status !== 'ready' || isArchived)) {
        return false;
      }

      if (lessonStatusFilter === 'archived' && !isArchived) {
        return false;
      }

      if (lessonStatusFilter === 'pending' && (lesson.status === 'ready' || isArchived)) {
        return false;
      }

      if (
        lessonSelectedTags.length > 0 &&
        !lessonSelectedTags.every((tag) => tags.includes(tag))
      ) {
        return false;
      }

      if (lessonActivityFilter === 'quiz' && !activities.some((activity) => activity.type === 'quiz')) {
        return false;
      }

      if (
        lessonActivityFilter === 'flashcards' &&
        !activities.some((activity) => activity.type === 'flashcards')
      ) {
        return false;
      }

      if (lessonActivityFilter === 'no-activities' && activities.length > 0) {
        return false;
      }

      if (lessonEnrollmentFilter === 'enrolled' && !lesson.isEnrolled) {
        return false;
      }

      if (lessonEnrollmentFilter === 'not-enrolled' && lesson.isEnrolled) {
        return false;
      }

      return true;
    });
  }, [
    lessonActivityFilter,
    lessonEnrollmentFilter,
    lessonSearchQuery,
    lessonSelectedTags,
    lessonStatusFilter,
    sortedLessons,
  ]);

  const hasActiveLessonFilters =
    lessonSearchQuery.trim().length > 0 ||
    lessonStatusFilter !== 'ready' ||
    lessonSelectedTags.length > 0 ||
    lessonActivityFilter !== 'all' ||
    lessonEnrollmentFilter !== 'all';

  const resetLessonFilters = () => {
    setLessonSearchQuery('');
    setLessonStatusFilter('ready');
    setLessonSelectedTags([]);
    setLessonActivityFilter('all');
    setLessonEnrollmentFilter('all');
  };

  const sortedRoadmaps = useMemo(() => {
    return [...roadmaps].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [roadmaps]);

  const roadmapAvailableTags = useMemo(() => {
    const tagSet = new Set();

    roadmaps.forEach((roadmap) => {
      (Array.isArray(roadmap.tags) ? roadmap.tags : []).forEach((tag) => {
        if (tag) {
          tagSet.add(tag);
        }
      });
    });

    return [...tagSet].sort((a, b) => a.localeCompare(b));
  }, [roadmaps]);

  const filteredRoadmaps = useMemo(() => {
    const normalizedQuery = roadmapSearchQuery.trim().toLowerCase();

    return sortedRoadmaps.filter((roadmap) => {
      const tags = Array.isArray(roadmap.tags) ? roadmap.tags : [];
      const lessonTitles = Array.isArray(roadmap.lessons)
        ? roadmap.lessons.map((lesson) => lesson.title)
        : [];

      if (normalizedQuery) {
        const searchableText = [
          roadmap.title,
          roadmap.description,
          roadmap.createdBy,
          ...tags,
          ...lessonTitles,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(normalizedQuery)) {
          return false;
        }
      }

      if (
        roadmapSelectedTags.length > 0 &&
        !roadmapSelectedTags.every((tag) => tags.includes(tag))
      ) {
        return false;
      }

      if (roadmapEnrollmentFilter === 'enrolled' && !roadmap.isEnrolled) {
        return false;
      }

      if (roadmapEnrollmentFilter === 'not-enrolled' && roadmap.isEnrolled) {
        return false;
      }

      return true;
    });
  }, [
    roadmapEnrollmentFilter,
    roadmapSearchQuery,
    roadmapSelectedTags,
    sortedRoadmaps,
  ]);

  const hasActiveRoadmapFilters =
    roadmapSearchQuery.trim().length > 0 ||
    roadmapSelectedTags.length > 0 ||
    roadmapEnrollmentFilter !== 'all';

  const resetRoadmapFilters = () => {
    setRoadmapSearchQuery('');
    setRoadmapSelectedTags([]);
    setRoadmapEnrollmentFilter('all');
  };

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

  const loadRoadmaps = async () => {
    try {
      setIsLoadingRoadmaps(true);

      const response = await fetch('/api/roadmaps', {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load roadmaps.');
      }

      setRoadmaps(data.roadmaps || []);
    } catch (error) {
      console.error('Failed to load roadmaps:', error);

      setToast({
        open: true,
        message: error.message || 'Failed to load roadmaps.',
        severity: 'error',
      });
    } finally {
      setIsLoadingRoadmaps(false);
    }
  };

  const loadAssignableUsers = async () => {
    if (!canAssignLearning) {
      return [];
    }

    try {
      setIsLoadingAssignableUsers(true);

      const response = await fetch('/api/learning/assignees', {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load team members.');
      }

      const users = data.users || [];
      setAssignableUsers(users);
      setHasLoadedAssignableUsers(true);
      return users;
    } catch (error) {
      console.error('Failed to load assignable users:', error);

      setToast({
        open: true,
        message: error.message || 'Failed to load team members.',
        severity: 'error',
      });

      return [];
    } finally {
      setIsLoadingAssignableUsers(false);
    }
  };

  useEffect(() => {
    loadMaterials();
    loadLessons();
    loadRoadmaps();
  }, []);

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  const handlePrimaryAction = () => {
    if (activeTab === 'materials') {
      if (!canCreateMaterials) {
        return;
      }

      setEditingMaterial(null);
      setIsUploadDialogOpen(true);
      return;
    }

    if (activeTab === 'lessons') {
      if (!canCreateLessons) {
        return;
      }

      setIsLessonDialogOpen(true);
      return;
    }

    if (activeTab === 'roadmaps') {
      if (!canCreateRoadmaps) {
        return;
      }

      setEditingRoadmap(null);
      setIsRoadmapDialogOpen(true);
    }
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

  const handleCloseRoadmapDialog = () => {
    if (isSavingRoadmap) {
      return;
    }

    setEditingRoadmap(null);
    setIsRoadmapDialogOpen(false);
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

  const handleOpenAssignmentDialog = async (itemType, item) => {
    if (!canAssignLearning) {
      return;
    }

    setAssignmentDialog({
      open: true,
      itemType,
      item,
      selectedUserIds: [],
    });

    if (!hasLoadedAssignableUsers) {
      await loadAssignableUsers();
    }
  };

  const handleCloseAssignmentDialog = () => {
    if (isSavingAssignment) {
      return;
    }

    setAssignmentDialog((prev) => ({
      ...prev,
      open: false,
      item: null,
      selectedUserIds: [],
    }));
  };

  const handleToggleAssignmentUser = (userId) => {
    setAssignmentDialog((prev) => {
      const selectedUserIds = prev.selectedUserIds.includes(userId)
        ? prev.selectedUserIds.filter((id) => id !== userId)
        : [...prev.selectedUserIds, userId];

      return {
        ...prev,
        selectedUserIds,
      };
    });
  };

  const handleToggleAllAssignmentUsers = () => {
    setAssignmentDialog((prev) => {
      const allSelected =
        assignableUsers.length > 0 &&
        prev.selectedUserIds.length === assignableUsers.length;

      return {
        ...prev,
        selectedUserIds: allSelected ? [] : assignableUsers.map((user) => user.id),
      };
    });
  };

  const handleSubmitAssignment = async () => {
    const { itemType, item, selectedUserIds } = assignmentDialog;

    if (!item || selectedUserIds.length === 0) {
      return;
    }

    const endpoint =
      itemType === 'roadmap'
        ? `/api/roadmaps/${item.id}/assignments`
        : `/api/lessons/${item.id}/assignments`;
    const noun = itemType === 'roadmap' ? 'Roadmap' : 'Lesson';

    try {
      setIsSavingAssignment(true);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: selectedUserIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to assign ${itemType}.`);
      }

      setAssignmentDialog({
        open: false,
        itemType: 'lesson',
        item: null,
        selectedUserIds: [],
      });

      setToast({
        open: true,
        message: `${noun} assigned to ${selectedUserIds.length} team member${selectedUserIds.length === 1 ? '' : 's'}.`,
        severity: 'success',
      });
    } catch (error) {
      console.error(`Failed to assign ${itemType}:`, error);

      setToast({
        open: true,
        message: error.message || `Failed to assign ${itemType}.`,
        severity: 'error',
      });
    } finally {
      setIsSavingAssignment(false);
    }
  };

  const handleSaveRoadmap = async (formData) => {
    const roadmapBeingEdited = editingRoadmap;

    try {
      setIsSavingRoadmap(true);

      const response = await fetch(
        roadmapBeingEdited ? `/api/roadmaps/${roadmapBeingEdited.id}` : '/api/roadmaps',
        {
          method: roadmapBeingEdited ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            (roadmapBeingEdited
              ? 'Failed to update roadmap.'
              : 'Failed to create roadmap.')
        );
      }

      setRoadmaps((prev) =>
        roadmapBeingEdited
          ? prev.map((roadmap) =>
              roadmap.id === data.roadmap.id ? data.roadmap : roadmap
            )
          : [data.roadmap, ...prev]
      );
      setEditingRoadmap(null);
      setIsRoadmapDialogOpen(false);

      setToast({
        open: true,
        message: roadmapBeingEdited
          ? 'Roadmap updated successfully.'
          : 'Roadmap created successfully.',
        severity: 'success',
      });
    } catch (error) {
      console.error(
        roadmapBeingEdited ? 'Failed to update roadmap:' : 'Failed to create roadmap:',
        error
      );

      setToast({
        open: true,
        message:
          error.message ||
          (roadmapBeingEdited
            ? 'Failed to update roadmap.'
            : 'Failed to create roadmap.'),
        severity: 'error',
      });
    } finally {
      setIsSavingRoadmap(false);
    }
  };

  const handleOpenRoadmap = (roadmap) => {
    if (!roadmap?.viewerCanManage) {
      return;
    }

    setEditingRoadmap(roadmap);
    setIsRoadmapDialogOpen(true);
  };

  const handleDeleteRoadmap = async (roadmap) => {
    if (isDeletingRoadmap) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete "${roadmap.title}"? This will remove the roadmap for everyone, but it will not delete the lessons.`
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setIsDeletingRoadmap(true);

      const response = await fetch(`/api/roadmaps/${roadmap.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete roadmap.');
      }

      setRoadmaps((prev) => prev.filter((item) => item.id !== roadmap.id));
      setEditingRoadmap(null);
      setIsRoadmapDialogOpen(false);

      setToast({
        open: true,
        message: 'Roadmap deleted successfully.',
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to delete roadmap:', error);

      setToast({
        open: true,
        message: error.message || 'Failed to delete roadmap.',
        severity: 'error',
      });
    } finally {
      setIsDeletingRoadmap(false);
    }
  };

  const handleEnrollRoadmap = async (roadmap) => {
    setRoadmaps((prev) =>
      prev.map((item) =>
        item.id === roadmap.id ? { ...item, isEnrolled: true } : item
      )
    );

    try {
      const response = await fetch(`/api/roadmaps/${roadmap.id}/enrollment`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe to roadmap.');
      }

      setToast({
        open: true,
        message: 'Roadmap added to your learning plan.',
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to subscribe to roadmap:', error);

      setRoadmaps((prev) =>
        prev.map((item) =>
          item.id === roadmap.id ? { ...item, isEnrolled: false } : item
        )
      );

      setToast({
        open: true,
        message: error.message || 'Failed to subscribe to roadmap.',
        severity: 'error',
      });
    }
  };

  const handleUnenrollRoadmap = async (roadmap) => {
    setRoadmaps((prev) =>
      prev.map((item) =>
        item.id === roadmap.id ? { ...item, isEnrolled: false } : item
      )
    );

    try {
      const response = await fetch(`/api/roadmaps/${roadmap.id}/enrollment`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unsubscribe from roadmap.');
      }

      setToast({
        open: true,
        message: 'Roadmap removed from your learning plan.',
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to unsubscribe from roadmap:', error);

      setRoadmaps((prev) =>
        prev.map((item) =>
          item.id === roadmap.id ? { ...item, isEnrolled: true } : item
        )
      );

      setToast({
        open: true,
        message: error.message || 'Failed to unsubscribe from roadmap.',
        severity: 'error',
      });
    }
  };

  const hydrateLessonSourceAttachments = (lesson) => {
    const sourceReferences = lesson?.generationMetadata?.preparedMaterials?.sourceReferences;

    if (!Array.isArray(sourceReferences)) {
      return lesson;
    }

    const materialsById = new Map(materials.map((material) => [material.id, material]));

    return {
      ...lesson,
      generationMetadata: {
        ...lesson.generationMetadata,
        preparedMaterials: {
          ...lesson.generationMetadata.preparedMaterials,
          sourceReferences: sourceReferences.map((source) => {
            const material = materialsById.get(source.id);

            if (!material) {
              return source;
            }

            return {
              ...source,
              attachments: (material.attachments || []).map((attachment) => ({
                id: attachment.id,
                name: attachment.name,
                storageKey: attachment.storageKey,
                mimeType: attachment.mimeType,
                kind: attachment.kind,
                size: attachment.size,
                previewUrl: attachment.previewUrl || '',
                fileUrl: attachment.fileUrl || '',
                openaiFileId: attachment.openaiFileId,
                openaiFileStatus: attachment.openaiFileStatus,
              })),
            };
          }),
        },
      },
    };
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
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const uploadResponse = await fetch('/api/materials/upload-file', {
        method: 'POST',
        body: uploadFormData,
      });
      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || `Failed to upload file: ${file.name}`);
      }

      uploadedAttachments.push({
        originalName: file.name,
        storageKey: uploadData.storageKey,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        kind: file.type.startsWith('image/') ? 'image' : 'file',
      });
    }

    return uploadedAttachments;
  };

  const handleSaveMaterial = async (formData) => {
    const materialBeingEdited = editingMaterial;
    const isEditMode = Boolean(materialBeingEdited);
    const taskId = addTask({
      title: isEditMode ? 'Updating material' : 'Creating material',
      description: formData.title.trim() || 'Preparing material sources',
    });

    setIsUploadDialogOpen(false);
    setEditingMaterial(null);

    try {
      setIsSavingMaterial(true);
      updateTask(taskId, {
        description: formData.newAttachments?.length
          ? `Uploading ${formData.newAttachments.length} file(s)...`
          : 'Saving sources and metadata...',
      });

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
          openaiFileId: attachment.openaiFileId || '',
          openaiFilePurpose: attachment.openaiFilePurpose || '',
          openaiFileStatus: attachment.openaiFileStatus || '',
          openaiFileError: attachment.openaiFileError || '',
          openaiUploadedAt: attachment.openaiUploadedAt || null,
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
        materialBeingEdited ? `/api/materials/${materialBeingEdited.id}` : '/api/materials',
        {
          method: materialBeingEdited ? 'PUT' : 'POST',
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
            (materialBeingEdited
              ? 'Failed to update material.'
              : 'Failed to create material.')
        );
      }

      updateTask(taskId, {
        description: 'Refreshing library...',
      });
      await loadMaterials();
      updateTask(taskId, {
        status: 'success',
        description: materialBeingEdited
          ? 'Material updated successfully.'
          : 'Material created successfully.',
      });

      setToast({
        open: true,
        message: materialBeingEdited
          ? 'Material updated successfully.'
          : 'Material saved successfully.',
        severity: 'success',
      });

      if (!materialBeingEdited) {
        setMaterialFormResetKey((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Failed to save material:', error);

      setToast({
        open: true,
        message: error.message || 'Failed to save material.',
        severity: 'error',
      });
      updateTask(taskId, {
        status: 'error',
        description: error.message || 'Failed to save material.',
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
            canCreateByTab={{
              materials: canCreateMaterials,
              lessons: canCreateLessons,
              roadmaps: canCreateRoadmaps,
            }}
          />

          <LibraryTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            actionSlot={
              activeTab === 'materials' && sortedMaterials.length > 0 ? (
                <MaterialLibrarySearch
                  query={materialSearchQuery}
                  onQueryChange={setMaterialSearchQuery}
                  totalCount={sortedMaterials.length}
                  resultCount={filteredMaterials.length}
                />
              ) : activeTab === 'lessons' && sortedLessons.length > 0 ? (
                <LessonLibraryFilters
                  query={lessonSearchQuery}
                  onQueryChange={setLessonSearchQuery}
                  status={lessonStatusFilter}
                  onStatusChange={setLessonStatusFilter}
                  selectedTags={lessonSelectedTags}
                  onSelectedTagsChange={setLessonSelectedTags}
                  availableTags={lessonAvailableTags}
                  activity={lessonActivityFilter}
                  onActivityChange={setLessonActivityFilter}
                  enrollment={lessonEnrollmentFilter}
                  onEnrollmentChange={setLessonEnrollmentFilter}
                  totalCount={sortedLessons.length}
                  resultCount={filteredLessons.length}
                  hasActiveFilters={hasActiveLessonFilters}
                  filtersOpen={areLessonFiltersOpen}
                  onToggleFilters={() => setAreLessonFiltersOpen((prev) => !prev)}
                  onReset={resetLessonFilters}
                />
              ) : activeTab === 'roadmaps' && sortedRoadmaps.length > 0 ? (
                <RoadmapLibraryFilters
                  query={roadmapSearchQuery}
                  onQueryChange={setRoadmapSearchQuery}
                  selectedTags={roadmapSelectedTags}
                  onSelectedTagsChange={setRoadmapSelectedTags}
                  availableTags={roadmapAvailableTags}
                  enrollment={roadmapEnrollmentFilter}
                  onEnrollmentChange={setRoadmapEnrollmentFilter}
                  totalCount={sortedRoadmaps.length}
                  resultCount={filteredRoadmaps.length}
                  hasActiveFilters={hasActiveRoadmapFilters}
                  filtersOpen={areRoadmapFiltersOpen}
                  onToggleFilters={() => setAreRoadmapFiltersOpen((prev) => !prev)}
                  onReset={resetRoadmapFilters}
                />
              ) : null
            }
          />

          <Stack spacing={3}>
            <LibraryTabPanel
              activeTab={activeTab}
              materials={filteredMaterials}
              totalMaterials={sortedMaterials.length}
              hasActiveMaterialSearch={hasActiveMaterialSearch}
              onResetMaterialSearch={() => setMaterialSearchQuery('')}
              lessons={filteredLessons}
              totalLessons={sortedLessons.length}
              hasActiveLessonFilters={hasActiveLessonFilters}
              onResetLessonFilters={resetLessonFilters}
              roadmaps={filteredRoadmaps}
              totalRoadmaps={sortedRoadmaps.length}
              hasActiveRoadmapFilters={hasActiveRoadmapFilters}
              onResetRoadmapFilters={resetRoadmapFilters}
              isHydrated={
                activeTab === 'lessons'
                  ? !isLoadingLessons
                  : activeTab === 'roadmaps'
                    ? !isLoadingRoadmaps
                    : !isLoadingMaterials
              }
              onOpenMaterial={handleOpenMaterial}
              onOpenLesson={handleOpenLesson}
              onEnrollLesson={handleEnrollLesson}
              onUnenrollLesson={handleUnenrollLesson}
              onAssignLesson={(lesson) => handleOpenAssignmentDialog('lesson', lesson)}
              onEnrollRoadmap={handleEnrollRoadmap}
              onUnenrollRoadmap={handleUnenrollRoadmap}
              onAssignRoadmap={(roadmap) => handleOpenAssignmentDialog('roadmap', roadmap)}
              onOpenRoadmap={handleOpenRoadmap}
              canAssignLearning={canAssignLearning}
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
        resetKey={materialFormResetKey}
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
            onLessonGenerationStarted={handleCloseLessonDialog}
          />
        </DialogContent>
      </Dialog>

      <RoadmapFormDialog
        key={editingRoadmap ? `edit-${editingRoadmap.id}` : 'create-roadmap'}
        open={isRoadmapDialogOpen}
        lessons={sortedLessons}
        isSaving={isSavingRoadmap}
        isDeleting={isDeletingRoadmap}
        mode={editingRoadmap ? 'edit' : 'create'}
        initialRoadmap={editingRoadmap}
        onClose={handleCloseRoadmapDialog}
        onSave={handleSaveRoadmap}
        onDelete={handleDeleteRoadmap}
      />

      <MaterialDetailsDialog
        key={selectedMaterial?.id || 'material-details'}
        open={Boolean(selectedMaterial)}
        material={selectedMaterial}
        isDeleting={isDeletingMaterial}
        allowDelete={!selectedLesson}
        canEdit={canEditMaterials}
        canDelete={canDeleteMaterials && !selectedLesson}
        onClose={handleCloseMaterial}
        onDelete={handleDeleteMaterial}
        onEdit={() => handleEditMaterial(selectedMaterial)}
      />

      <LessonDetailsDialog
        key={selectedLesson?.id || 'lesson-details'}
        open={Boolean(selectedLesson)}
        lesson={hydrateLessonSourceAttachments(selectedLesson)}
        onClose={handleCloseLesson}
        onOpenSourceMaterial={handleOpenSourceMaterial}
        onLessonDeleted={handleLessonDeleted}
        onLessonUpdated={handleLessonUpdated}
      />

      <LearningAssignmentDialog
        open={assignmentDialog.open}
        item={assignmentDialog.item}
        itemType={assignmentDialog.itemType}
        users={assignableUsers}
        selectedUserIds={assignmentDialog.selectedUserIds}
        isLoading={isLoadingAssignableUsers}
        isSaving={isSavingAssignment}
        onClose={handleCloseAssignmentDialog}
        onToggleUser={handleToggleAssignmentUser}
        onToggleAll={handleToggleAllAssignmentUsers}
        onAssign={handleSubmitAssignment}
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
