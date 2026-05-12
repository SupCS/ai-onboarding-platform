'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  IconButton,
  Paper,
  Radio,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import SourceOutlinedIcon from '@mui/icons-material/SourceOutlined';
import StyleOutlinedIcon from '@mui/icons-material/StyleOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import UnarchiveOutlinedIcon from '@mui/icons-material/UnarchiveOutlined';
import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import LessonAttachments, { getSourceAttachments } from './LessonAttachments';
import { SimpleEditor } from '../tiptap/tiptap-templates/simple/simple-editor';
import { markdownToHtml } from '../../lib/lessonContent';
import { AI_DIGITAL_COLORS, hexToRgba } from '../../lib/brandColors';
import { normalizeLessonTagInput, suggestedLessonTags } from '../../lib/lessonTags';

function formatDateTime(isoString) {
  try {
    return new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString));
  } catch {
    return '';
  }
}

function getStatusColor(status) {
  if (status === 'ready') {
    return 'success';
  }

  if (status === 'failed') {
    return 'error';
  }

  if (status === 'generating') {
    return 'warning';
  }

  return 'default';
}

const revisionOptions = [
  { value: 'simpler', label: 'Simpler' },
  { value: 'deeper', label: 'Deeper' },
  { value: 'examples', label: 'More examples' },
  { value: 'structured', label: 'Better structure' },
  { value: 'shorter', label: 'Shorter' },
];

const activityTypeOptions = [
  { value: 'quiz', label: 'Quiz', min: 3, max: 20, defaultCount: 8 },
  { value: 'flashcards', label: 'Flashcards', min: 5, max: 40, defaultCount: 12 },
];

function getActivityTypeSettings(type) {
  return activityTypeOptions.find((option) => option.value === type) || activityTypeOptions[0];
}

function DetailPanel({ icon, title, children, accent = AI_DIGITAL_COLORS.yvesKleinBlue }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${hexToRgba(accent, 0.22)}`,
        backgroundColor: '#fff',
        boxShadow: `0 14px 34px ${hexToRgba(AI_DIGITAL_COLORS.midnightCharcoal, 0.05)}`,
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              display: 'grid',
              placeItems: 'center',
              color: AI_DIGITAL_COLORS.midnightCharcoal,
              backgroundColor: hexToRgba(accent, 0.18),
            }}
          >
            {icon}
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
            {title}
          </Typography>
        </Stack>

        {children}
      </Stack>
    </Paper>
  );
}

function normalizeLessonAssetForCard(asset) {
  if (asset.kind === 'youtube') {
    return {
      id: asset.id,
      name: asset.title || asset.name || 'YouTube video',
      kind: 'youtube',
      mimeType: 'video/youtube',
      url: asset.url,
      youtubeTitle: asset.title || '',
      youtubeAuthorName: asset.metadata?.authorName || asset.description || '',
      youtubeThumbnailUrl: asset.imageUrl || '',
      sourceTitle: 'Lesson asset',
    };
  }

  if (asset.kind === 'link') {
    return {
      id: asset.id,
      name: asset.title || asset.name || 'Web link',
      kind: 'link',
      mimeType: 'text/html',
      url: asset.url,
      linkTitle: asset.title || '',
      linkDescription: asset.description || '',
      linkImageUrl: asset.imageUrl || '',
      linkSiteName: asset.siteName || '',
      sourceTitle: 'Lesson asset',
    };
  }

  return {
    id: asset.id,
    name: asset.name || asset.title || 'Lesson file',
    kind: asset.kind,
    mimeType: asset.mimeType || '',
    size: asset.size || 0,
    storageKey: asset.storageKey || '',
    sourceTitle: 'Lesson asset',
  };
}

function getActivityItems(activity) {
  if (activity?.type === 'flashcards') {
    return Array.isArray(activity.payload?.cards) ? activity.payload.cards : [];
  }

  return Array.isArray(activity?.payload?.items) ? activity.payload.items : [];
}

function createActivityDraft(activity) {
  if (!activity) {
    return null;
  }

  if (activity.type === 'flashcards') {
    return {
      id: activity.id,
      type: activity.type,
      title: activity.title || activity.payload?.title || 'Lesson flashcards',
      cards: getActivityItems(activity).map((card) => ({
        front: card.front || '',
        back: card.back || '',
        explanation: card.explanation || '',
      })),
    };
  }

  return {
    id: activity.id,
    type: activity.type,
    title: activity.title || activity.payload?.title || 'Lesson quiz',
    items: getActivityItems(activity).map((item) => ({
      question: item.question || '',
      options: Array.from({ length: 4 }, (_, index) => item.options?.[index] || ''),
      correctAnswer: item.correctAnswer || '',
      explanation: item.explanation || '',
    })),
  };
}

function ActivityEditor({ activity, draft, onDraftChange, disabled }) {
  if (!activity || !draft) {
    return (
      <Stack spacing={1.5} sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" sx={{ fontWeight: 900 }}>
          Activity not found
        </Typography>
        <Typography color="text.secondary">
          Generate an activity first, then it will appear as an editor tab here.
        </Typography>
      </Stack>
    );
  }

  const isFlashcards = activity.type === 'flashcards';

  const updateDraft = (updater) => {
    onDraftChange((current) => {
      const currentDraft = current[activity.id] || createActivityDraft(activity);

      return {
        ...current,
        [activity.id]: updater(currentDraft),
      };
    });
  };

  const updateQuizItem = (itemIndex, nextItem) => {
    updateDraft((currentDraft) => ({
      ...currentDraft,
      items: currentDraft.items.map((item, index) => (
        index === itemIndex ? nextItem : item
      )),
    }));
  };

  const updateCard = (cardIndex, nextCard) => {
    updateDraft((currentDraft) => ({
      ...currentDraft,
      cards: currentDraft.cards.map((card, index) => (
        index === cardIndex ? nextCard : card
      )),
    }));
  };

  return (
    <Stack sx={{ minHeight: 0, height: '100%' }}>
      <Box
        sx={{
          px: { xs: 1.5, md: 2 },
          py: 1.5,
          borderBottom: '1px solid #e8edf5',
          backgroundColor: '#fff',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            {isFlashcards ? (
              <StyleOutlinedIcon sx={{ color: AI_DIGITAL_COLORS.yvesKleinBlue }} />
            ) : (
              <QuizOutlinedIcon sx={{ color: AI_DIGITAL_COLORS.yvesKleinBlue }} />
            )}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                {isFlashcards ? 'Flashcards editor' : 'Quiz editor'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Edit saved activity content. Changes are saved into this lesson activity.
              </Typography>
            </Box>
          </Stack>

          <Chip
            label={`${isFlashcards ? draft.cards.length : draft.items.length} item${(isFlashcards ? draft.cards.length : draft.items.length) === 1 ? '' : 's'}`}
            size="small"
            sx={{
              alignSelf: { xs: 'flex-start', md: 'center' },
              fontWeight: 800,
              color: AI_DIGITAL_COLORS.yvesKleinBlue,
              backgroundColor: hexToRgba(AI_DIGITAL_COLORS.skywave, 0.24),
            }}
          />
        </Stack>
      </Box>

      <Box sx={{ flex: '1 1 auto', minHeight: 0, overflow: 'auto', p: { xs: 1.5, md: 2 } }}>
        <Stack spacing={2}>
          <TextField
            label={isFlashcards ? 'Flashcards title' : 'Quiz title'}
            value={draft.title}
            onChange={(event) => updateDraft((currentDraft) => ({
              ...currentDraft,
              title: event.target.value,
            }))}
            disabled={disabled}
            fullWidth
          />

          {isFlashcards ? (
            <>
              {draft.cards.map((card, cardIndex) => (
                <Paper
                  key={`card-${cardIndex}`}
                  elevation={0}
                  sx={{
                    p: { xs: 1.5, md: 2 },
                    borderRadius: 2,
                    border: `1px solid ${hexToRgba(AI_DIGITAL_COLORS.yvesKleinBlue, 0.12)}`,
                    backgroundColor: '#fff',
                  }}
                >
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip label={`Card ${cardIndex + 1}`} size="small" sx={{ fontWeight: 900 }} />
                      <IconButton
                        aria-label="Remove flashcard"
                        size="small"
                        disabled={disabled || draft.cards.length <= 1}
                        onClick={() => updateDraft((currentDraft) => ({
                          ...currentDraft,
                          cards: currentDraft.cards.filter((_, index) => index !== cardIndex),
                        }))}
                      >
                        <DeleteOutlineOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                    <TextField
                      label="Front"
                      value={card.front}
                      onChange={(event) => updateCard(cardIndex, { ...card, front: event.target.value })}
                      disabled={disabled}
                      multiline
                      minRows={2}
                      fullWidth
                    />
                    <TextField
                      label="Back"
                      value={card.back}
                      onChange={(event) => updateCard(cardIndex, { ...card, back: event.target.value })}
                      disabled={disabled}
                      multiline
                      minRows={2}
                      fullWidth
                    />
                    <TextField
                      label="Explanation"
                      value={card.explanation}
                      onChange={(event) => updateCard(cardIndex, { ...card, explanation: event.target.value })}
                      disabled={disabled}
                      multiline
                      minRows={2}
                      fullWidth
                    />
                  </Stack>
                </Paper>
              ))}
              <Button
                variant="outlined"
                startIcon={<AddOutlinedIcon />}
                disabled={disabled}
                onClick={() => updateDraft((currentDraft) => ({
                  ...currentDraft,
                  cards: [...currentDraft.cards, { front: '', back: '', explanation: '' }],
                }))}
                sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 800 }}
              >
                Add card
              </Button>
            </>
          ) : (
            <>
              {draft.items.map((item, itemIndex) => (
                <Paper
                  key={`question-${itemIndex}`}
                  elevation={0}
                  sx={{
                    p: { xs: 1.5, md: 2 },
                    borderRadius: 2,
                    border: `1px solid ${hexToRgba(AI_DIGITAL_COLORS.yvesKleinBlue, 0.12)}`,
                    backgroundColor: '#fff',
                  }}
                >
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip label={`Question ${itemIndex + 1}`} size="small" sx={{ fontWeight: 900 }} />
                      <IconButton
                        aria-label="Remove question"
                        size="small"
                        disabled={disabled || draft.items.length <= 1}
                        onClick={() => updateDraft((currentDraft) => ({
                          ...currentDraft,
                          items: currentDraft.items.filter((_, index) => index !== itemIndex),
                        }))}
                      >
                        <DeleteOutlineOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                    <TextField
                      label="Question"
                      value={item.question}
                      onChange={(event) => updateQuizItem(itemIndex, { ...item, question: event.target.value })}
                      disabled={disabled}
                      multiline
                      minRows={2}
                      fullWidth
                    />
                    <Stack spacing={1}>
                      {item.options.map((option, optionIndex) => (
                        <Box
                          key={`option-${optionIndex}`}
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: 'auto minmax(0, 1fr)',
                            gap: 1,
                            alignItems: 'center',
                          }}
                        >
                          <Radio
                            checked={item.correctAnswer === option && Boolean(option)}
                            disabled={disabled || !option}
                            onChange={() => updateQuizItem(itemIndex, { ...item, correctAnswer: option })}
                            size="small"
                          />
                          <TextField
                            label={`Option ${optionIndex + 1}`}
                            value={option}
                            onChange={(event) => {
                              const nextOptions = item.options.map((currentOption, index) => (
                                index === optionIndex ? event.target.value : currentOption
                              ));
                              const nextCorrectAnswer = item.correctAnswer === option
                                ? event.target.value
                                : item.correctAnswer;

                              updateQuizItem(itemIndex, {
                                ...item,
                                options: nextOptions,
                                correctAnswer: nextCorrectAnswer,
                              });
                            }}
                            disabled={disabled}
                            size="small"
                            fullWidth
                          />
                        </Box>
                      ))}
                    </Stack>
                    <TextField
                      label="Explanation"
                      value={item.explanation}
                      onChange={(event) => updateQuizItem(itemIndex, { ...item, explanation: event.target.value })}
                      disabled={disabled}
                      multiline
                      minRows={2}
                      fullWidth
                    />
                  </Stack>
                </Paper>
              ))}
              <Button
                variant="outlined"
                startIcon={<AddOutlinedIcon />}
                disabled={disabled}
                onClick={() => updateDraft((currentDraft) => ({
                  ...currentDraft,
                  items: [
                    ...currentDraft.items,
                    {
                      question: '',
                      options: ['', '', '', ''],
                      correctAnswer: '',
                      explanation: '',
                    },
                  ],
                }))}
                sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 800 }}
              >
                Add question
              </Button>
            </>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}

export default function LessonDetailsDialog({
  lesson,
  open,
  onClose,
  onOpenSourceMaterial,
  onLessonDeleted,
  onLessonUpdated,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmArchiveOpen, setIsConfirmArchiveOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [archiveError, setArchiveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isRevising, setIsRevising] = useState(false);
  const [isGeneratingActivity, setIsGeneratingActivity] = useState(false);
  const [revisionRequest, setRevisionRequest] = useState('');
  const [selectedRevisionOptions, setSelectedRevisionOptions] = useState([]);
  const [revisionError, setRevisionError] = useState('');
  const [activityType, setActivityType] = useState('quiz');
  const [activityCount, setActivityCount] = useState(8);
  const [activityError, setActivityError] = useState('');
  const [activitySuccess, setActivitySuccess] = useState('');
  const [activeView, setActiveView] = useState('lesson');
  const [activityDrafts, setActivityDrafts] = useState({});
  const [activitySaveError, setActivitySaveError] = useState('');
  const [activitySaveSuccess, setActivitySaveSuccess] = useState('');
  const [isSavingActivity, setIsSavingActivity] = useState(false);
  const [assetUrl, setAssetUrl] = useState('');
  const [assetError, setAssetError] = useState('');
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const assetFileInputRef = useRef(null);
  const initialHtml = useMemo(() => {
    return lesson?.contentHtml || markdownToHtml(lesson?.contentMarkdown || '');
  }, [lesson]);
  const lessonTagsKey = useMemo(() => {
    return normalizeLessonTagInput(lesson?.tags || []).join('\n');
  }, [lesson?.tags]);
  const lessonResetKey = `${lesson?.title || ''}\n${lessonTagsKey}`;
  const [draftHtml, setDraftHtml] = useState(initialHtml);
  const [draftTitle, setDraftTitle] = useState(lesson?.title || '');
  const [draftTags, setDraftTags] = useState(() => normalizeLessonTagInput(lesson?.tags || []));
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  useEffect(() => {
    setIsEditing(false);
    setIsConfirmDeleteOpen(false);
    setIsConfirmArchiveOpen(false);
    setDeleteError('');
    setArchiveError('');
    setDraftHtml(initialHtml);
    setDraftTitle(lesson?.title || '');
    setDraftTags(normalizeLessonTagInput(lesson?.tags || []));
    setIsPublishing(false);
    setIsArchiving(false);
    setIsRevising(false);
    setRevisionRequest('');
    setSelectedRevisionOptions([]);
    setRevisionError('');
    setActivityType('quiz');
    setActivityCount(8);
    setActivityError('');
    setActivitySuccess('');
    setActiveView('lesson');
    setActivityDrafts({});
    setActivitySaveError('');
    setActivitySaveSuccess('');
    setIsSavingActivity(false);
    setAssetUrl('');
    setAssetError('');
    setIsAddingAsset(false);
    setIsRightPanelCollapsed(false);
  // Keep the dependency array shape stable for React while still resetting when title or tags change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialHtml, lesson?.id, lessonResetKey]);

  useEffect(() => {
    if (isEditing) {
      setIsRightPanelCollapsed(true);
    }
  }, [isEditing]);

  useEffect(() => {
    const nextActivities = Array.isArray(lesson?.activities) ? lesson.activities : [];
    const hasQuiz = nextActivities.some((activity) => activity.type === 'quiz');
    const hasFlashcards = nextActivities.some((activity) => activity.type === 'flashcards');

    if ((activeView === 'quiz' && !hasQuiz) || (activeView === 'flashcards' && !hasFlashcards)) {
      setActiveView('lesson');
    }
  }, [activeView, lesson?.activities]);

  if (!lesson) {
    return null;
  }

  const metadata = lesson.generationMetadata || {};
  const preparedMaterials = metadata.preparedMaterials || {};
  const sourceReferences = preparedMaterials.sourceReferences || [];
  const sourceAttachments = getSourceAttachments(sourceReferences);
  const lessonAssets = (lesson.lessonAssets || []).map(normalizeLessonAssetForCard);
  const allAssets = [...lessonAssets, ...sourceAttachments];
  const revisionHistory = Array.isArray(metadata.revisionHistory)
    ? metadata.revisionHistory
    : [];
  const lastRevision = revisionHistory[revisionHistory.length - 1] || null;
  const activities = Array.isArray(lesson.activities) ? lesson.activities : [];
  const quizActivity = activities.find((activity) => activity.type === 'quiz') || null;
  const flashcardsActivity = activities.find((activity) => activity.type === 'flashcards') || null;
  const activeActivity = activeView === 'quiz'
    ? quizActivity
    : activeView === 'flashcards'
      ? flashcardsActivity
      : null;
  const activeActivityDraft = activeActivity
    ? activityDrafts[activeActivity.id] || createActivityDraft(activeActivity)
    : null;
  const activitySettings = getActivityTypeSettings(activityType);
  const hasAssets = allAssets.length > 0;
  const isRightPanelVisible = !isRightPanelCollapsed;
  const canManageCurrentLesson = Boolean(lesson.viewerCanManage);
  const isLessonArchived = lesson.isArchived || lesson.publicationStatus === 'archived';
  const canPublishLesson =
    lesson.status === 'ready' &&
    !lesson.isPublished &&
    !isLessonArchived &&
    canManageCurrentLesson;
  const publicationLabel = isLessonArchived
    ? 'Archived'
    : lesson.isPublished
      ? 'Published'
      : 'Private draft';


  const handleSave = async () => {
    try {
      setIsSaving(true);

      const response = await fetch(`/api/lessons/${lesson.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: draftTitle.trim(),
          contentHtml: draftHtml,
          tags: draftTags,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save lesson.');
      }

      setIsEditing(false);
      await onLessonUpdated?.(data.lesson);
    } catch (error) {
      console.error('Failed to save lesson:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);

      const response = await fetch(`/api/lessons/${lesson.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'publish' }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish lesson.');
      }

      await onLessonUpdated?.(data.lesson);
    } catch (error) {
      console.error('Failed to publish lesson:', error);
      setRevisionError(error.message || 'Failed to publish lesson.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleArchive = async () => {
    try {
      setIsArchiving(true);
      setArchiveError('');

      const response = await fetch(`/api/lessons/${lesson.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'archive' }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to archive lesson.');
      }

      await onLessonUpdated?.(data.lesson);
      setIsConfirmArchiveOpen(false);
    } catch (error) {
      console.error('Failed to archive lesson:', error);
      setArchiveError(error.message || 'Failed to archive lesson.');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleRestore = async () => {
    try {
      setIsPublishing(true);
      setRevisionError('');

      const response = await fetch(`/api/lessons/${lesson.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'restore' }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to restore lesson.');
      }

      await onLessonUpdated?.(data.lesson);
    } catch (error) {
      console.error('Failed to restore lesson:', error);
      setRevisionError(error.message || 'Failed to restore lesson.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCancelEdit = () => {
    setDraftHtml(initialHtml);
    setDraftTitle(lesson.title || '');
    setDraftTags(normalizeLessonTagInput(lesson.tags || []));
    setIsEditing(false);
  };

  const handleAddUrlAsset = async () => {
    if (!assetUrl.trim()) {
      setAssetError('Add a link or YouTube URL first.');
      return;
    }

    try {
      setIsAddingAsset(true);
      setAssetError('');

      const response = await fetch(`/api/lessons/${lesson.id}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kind: 'url',
          url: assetUrl.trim(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add asset.');
      }

      setAssetUrl('');
      await onLessonUpdated?.(data.lesson);
    } catch (error) {
      console.error('Failed to add lesson URL asset:', error);
      setAssetError(error.message || 'Failed to add asset.');
    } finally {
      setIsAddingAsset(false);
    }
  };

  const handleAddFileAsset = async (file) => {
    if (!file) {
      return;
    }

    try {
      setIsAddingAsset(true);
      setAssetError('');

      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const uploadResponse = await fetch('/api/lessons/upload-file', {
        method: 'POST',
        body: uploadFormData,
      });
      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || `Failed to upload file: ${file.name}`);
      }

      const response = await fetch(`/api/lessons/${lesson.id}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kind: file.type.startsWith('image/') ? 'image' : 'file',
          originalName: file.name,
          storageKey: uploadData.storageKey,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save uploaded asset.');
      }

      await onLessonUpdated?.(data.lesson);
    } catch (error) {
      console.error('Failed to add lesson file asset:', error);
      setAssetError(error.message || 'Failed to add file asset.');
    } finally {
      setIsAddingAsset(false);
      if (assetFileInputRef.current) {
        assetFileInputRef.current.value = '';
      }
    }
  };

  const uploadLessonImageAsset = async (file) => {
    if (!file || !file.type?.startsWith('image/')) {
      throw new Error('Only image files can be pasted into the editor.');
    }

    try {
      setIsAddingAsset(true);
      setAssetError('');

      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const uploadResponse = await fetch('/api/lessons/upload-file', {
        method: 'POST',
        body: uploadFormData,
      });
      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || `Failed to upload image: ${file.name}`);
      }

      const assetResponse = await fetch(`/api/lessons/${lesson.id}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kind: 'image',
          originalName: file.name,
          storageKey: uploadData.storageKey,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
        }),
      });
      const assetData = await assetResponse.json();

      if (!assetResponse.ok) {
        throw new Error(assetData.error || 'Failed to save pasted image asset.');
      }

      await onLessonUpdated?.(assetData.lesson);

      return {
        src: `/api/files/object?storageKey=${encodeURIComponent(uploadData.storageKey)}`,
        alt: file.name,
        title: file.name,
      };
    } catch (error) {
      console.error('Failed to paste lesson image asset:', error);
      setAssetError(error.message || 'Failed to paste image asset.');
      throw error;
    } finally {
      setIsAddingAsset(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setDeleteError('');

      const response = await fetch(`/api/lessons/${lesson.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete lesson.');
      }

      await onLessonDeleted?.(lesson.id);
      setIsConfirmDeleteOpen(false);
    } catch (error) {
      console.error('Failed to delete lesson:', error);
      setDeleteError(error.message || 'Failed to delete lesson.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleRevisionOption = (value) => {
    setSelectedRevisionOptions((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }

      return [...prev, value];
    });
  };

  const handleRevise = async () => {
    if (!revisionRequest.trim() && selectedRevisionOptions.length === 0) {
      setRevisionError('Add revision notes or select at least one revision option.');
      return;
    }

    try {
      setIsRevising(true);
      setRevisionError('');

      const response = await fetch(`/api/lessons/${lesson.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          revisionRequest,
          selectedOptions: selectedRevisionOptions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to revise lesson.');
      }

      setRevisionRequest('');
      setSelectedRevisionOptions([]);
      await onLessonUpdated?.(data.lesson);
    } catch (error) {
      console.error('Failed to revise lesson:', error);
      setRevisionError(error.message || 'Failed to revise lesson.');
    } finally {
      setIsRevising(false);
    }
  };

  const handleActivityTypeChange = (nextType) => {
    const nextSettings = getActivityTypeSettings(nextType);

    setActivityType(nextType);
    setActivityCount(nextSettings.defaultCount);
    setActivityError('');
    setActivitySuccess('');
  };

  const handleGenerateActivity = async () => {
    const normalizedCount = Number.parseInt(activityCount, 10);

    if (
      Number.isNaN(normalizedCount) ||
      normalizedCount < activitySettings.min ||
      normalizedCount > activitySettings.max
    ) {
      setActivityError(
        `Choose a number between ${activitySettings.min} and ${activitySettings.max}.`
      );
      return;
    }

    try {
      setIsGeneratingActivity(true);
      setActivityError('');
      setActivitySuccess('');

      const response = await fetch(`/api/lessons/${lesson.id}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: activityType,
          count: normalizedCount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate activity.');
      }

      console.group('Generated lesson activity');
      console.log('Lesson:', lesson);
      console.log('Activity:', data.activity);
      console.log('Activity payload:', data.activity?.payload);
      console.log('Prompt:', data.prompt);
      console.log('Full response:', data);
      console.groupEnd();

      setActivitySuccess('Activity generated and saved. Check the browser console for the JSON.');
      await onLessonUpdated?.({
        ...lesson,
        activities: [data.activity, ...activities],
      });
      setActiveView(data.activity.type);
    } catch (error) {
      console.error('Failed to generate lesson activity:', error);
      setActivityError(error.message || 'Failed to generate activity.');
    } finally {
      setIsGeneratingActivity(false);
    }
  };

  const handleSaveActivity = async () => {
    if (!activeActivity || !activeActivityDraft) {
      return;
    }

    try {
      setIsSavingActivity(true);
      setActivitySaveError('');
      setActivitySaveSuccess('');

      const response = await fetch(`/api/lessons/${lesson.id}/activities/${activeActivity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activeActivityDraft),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update activity.');
      }

      setActivityDrafts((current) => {
        const nextDrafts = { ...current };
        delete nextDrafts[activeActivity.id];
        return nextDrafts;
      });
      setActivitySaveSuccess('Activity saved.');
      await onLessonUpdated?.(data.lesson);
    } catch (error) {
      console.error('Failed to save lesson activity:', error);
      setActivitySaveError(error.message || 'Failed to update activity.');
    } finally {
      setIsSavingActivity(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xl"
      slotProps={{
        paper: {
          sx: {
            height: '94vh',
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundColor: AI_DIGITAL_COLORS.silverHaze,
            border: 0,
            boxShadow: `0 28px 80px ${hexToRgba(AI_DIGITAL_COLORS.midnightCharcoal, 0.2)}`,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 0,
          flex: '0 0 auto',
          color: '#fff',
          background: `linear-gradient(115deg, ${AI_DIGITAL_COLORS.yvesKleinBlue} 0%, ${AI_DIGITAL_COLORS.violetPulse} 64%, ${AI_DIGITAL_COLORS.neonAzure} 100%)`,
        }}
      >
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            py: isEditing ? { xs: 1.25, md: 1.5 } : { xs: 1.5, md: 2 },
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' },
              gap: { xs: 1.25, md: 2 },
              alignItems: 'start',
            }}
          >
            <Stack spacing={isEditing ? 0.75 : 1}>
              <Box sx={{ minWidth: 0, flex: '1 1 auto', width: '100%' }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                  <Chip
                    icon={isEditing ? <EditOutlinedIcon /> : <VisibilityOutlinedIcon />}
                    label={isEditing ? 'Editing lesson' : 'Lesson preview'}
                    size="small"
                    sx={{
                      color: AI_DIGITAL_COLORS.midnightCharcoal,
                      backgroundColor: AI_DIGITAL_COLORS.lime,
                      fontWeight: 900,
                      '& .MuiChip-icon': { color: AI_DIGITAL_COLORS.midnightCharcoal },
                    }}
                  />
                  <Chip
                    label={lesson.status}
                    color={getStatusColor(lesson.status)}
                    size="small"
                    sx={{ backgroundColor: 'rgba(255,255,255,0.16)', color: '#fff', fontWeight: 800 }}
                  />
                  <Chip
                    label={publicationLabel}
                    size="small"
                    sx={{
                      backgroundColor: lesson.isPublished || isLessonArchived
                        ? 'rgba(255,255,255,0.16)'
                        : AI_DIGITAL_COLORS.lime,
                      color: lesson.isPublished || isLessonArchived ? '#fff' : AI_DIGITAL_COLORS.midnightCharcoal,
                      fontWeight: 900,
                    }}
                  />
                </Stack>

                {isEditing ? (
                  <Box
                    component="input"
                    value={draftTitle}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    placeholder="Lesson title"
                    sx={{
                      display: 'block',
                      width: '100%',
                      maxWidth: 980,
                      minWidth: 0,
                      border: 0,
                      outline: 0,
                      p: 0,
                      m: 0,
                      color: '#fff',
                      backgroundColor: 'transparent',
                      fontFamily: 'Arial, sans-serif',
                      fontSize: isEditing
                        ? { xs: '1.2rem', md: '1.45rem' }
                        : { xs: '1.65rem', md: '2.125rem' },
                      fontWeight: 950,
                      lineHeight: 1.14,
                      letterSpacing: 0,
                      '&::placeholder': {
                        color: 'rgba(255,255,255,0.68)',
                      },
                      '&:focus': {
                        boxShadow: `0 2px 0 ${AI_DIGITAL_COLORS.lime}`,
                      },
                    }}
                  />
                ) : (
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 950,
                      lineHeight: 1.08,
                      letterSpacing: 0,
                      maxWidth: 980,
                      wordBreak: 'break-word',
                    }}
                  >
                    {lesson.title}
                  </Typography>
                )}

                {isEditing ? (
                  <Autocomplete
                    multiple
                    freeSolo
                    options={suggestedLessonTags}
                    value={draftTags}
                    onChange={(_event, nextTags) => setDraftTags(normalizeLessonTagInput(nextTags))}
                    sx={{
                      maxWidth: 760,
                      mt: 1.25,
                      '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        backgroundColor: 'rgba(255,255,255,0.12)',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.34)' },
                        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.58)' },
                        '&.Mui-focused fieldset': { borderColor: AI_DIGITAL_COLORS.lime },
                      },
                      '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.76)' },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#fff' },
                      '& .MuiChip-root': {
                        color: AI_DIGITAL_COLORS.midnightCharcoal,
                        backgroundColor: AI_DIGITAL_COLORS.lime,
                        fontWeight: 800,
                      },
                      '& .MuiSvgIcon-root': { color: '#fff' },
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Tags"
                        placeholder="Add a tag"
                        size="small"
                      />
                    )}
                  />
                ) : lesson.tags?.length > 0 && (
                  <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', mt: 1.25 }}>
                    {lesson.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        sx={{
                          color: '#fff',
                          borderColor: 'rgba(255,255,255,0.38)',
                          backgroundColor: 'rgba(255,255,255,0.12)',
                          fontWeight: 800,
                        }}
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                )}
              </Box>

              {!isEditing && (
                <>
                  {lesson.description && (
                    <Typography sx={{ maxWidth: 900, color: 'rgba(255,255,255,0.84)', lineHeight: 1.45 }}>
                      {lesson.description}
                    </Typography>
                  )}

                  {(metadata.model || metadata.promptVersion || metadata.lastRevisionAt) && (
                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                      {metadata.model && <Chip label={`Model: ${metadata.model}`} size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.14)', color: '#fff' }} />}
                      {metadata.promptVersion && <Chip label={`Prompt: ${metadata.promptVersion}`} size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.14)', color: '#fff' }} />}
                      {metadata.lastRevisionAt && <Chip label={`Revised ${formatDateTime(metadata.lastRevisionAt)}`} size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.14)', color: '#fff' }} />}
                    </Stack>
                  )}
                </>
              )}
            </Stack>

            <Stack
              spacing={1}
              sx={{
                alignItems: { xs: 'flex-start', md: 'flex-end' },
                minWidth: { md: 260 },
              }}
            >
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
                <IconButton
                  aria-label="Close lesson details"
                  onClick={onClose}
                  sx={{
                    width: 34,
                    height: 34,
                    color: '#fff',
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.22)' },
                  }}
                >
                  <CloseOutlinedIcon />
                </IconButton>
              </Stack>

              {!isEditing && (
                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  sx={{
                    flexWrap: 'wrap',
                    justifyContent: { xs: 'flex-start', md: 'flex-end' },
                  }}
                >
                  <Chip label={`Created ${formatDateTime(lesson.createdAt)}`} size="small" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.36)' }} variant="outlined" />
                  <Chip label={`By ${lesson.createdBy || 'AI Onboarding'}`} size="small" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.36)' }} variant="outlined" />
                </Stack>
              )}
            </Stack>
          </Box>
        </Box>

        <Box sx={{ px: { xs: 1, md: 3 }, pb: 1.25 }}>
          <Tabs
            value={activeView}
            onChange={(_event, nextView) => {
              setActiveView(nextView);
              setActivitySaveError('');
              setActivitySaveSuccess('');
            }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 40,
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: 999,
                backgroundColor: AI_DIGITAL_COLORS.lime,
              },
              '& .MuiTab-root': {
                minHeight: 40,
                mr: 1,
                px: 1.5,
                borderRadius: 1.5,
                color: 'rgba(255,255,255,0.78)',
                textTransform: 'none',
                fontWeight: 900,
              },
              '& .Mui-selected': {
                color: '#fff',
                backgroundColor: 'rgba(255,255,255,0.14)',
              },
            }}
          >
            <Tab value="lesson" label="Lesson" />
            {quizActivity && (
              <Tab
                value="quiz"
                icon={<QuizOutlinedIcon fontSize="small" />}
                iconPosition="start"
                label="Quiz"
              />
            )}
            {flashcardsActivity && (
              <Tab
                value="flashcards"
                icon={<StyleOutlinedIcon fontSize="small" />}
                iconPosition="start"
                label="Flashcards"
              />
            )}
          </Tabs>
        </Box>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          flex: '1 1 auto',
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          p: { xs: 1.5, md: 2.5 },
          borderColor: hexToRgba(AI_DIGITAL_COLORS.yvesKleinBlue, 0.1),
          backgroundColor: AI_DIGITAL_COLORS.silverHaze,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: activeView === 'lesson' && isRightPanelVisible
                ? 'minmax(0, 1fr) 340px'
                : 'minmax(0, 1fr)',
            },
            gap: 2.5,
            alignItems: 'stretch',
            flex: '1 1 auto',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: 0,
              backgroundColor: '#fff',
              minHeight: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: isEditing
                ? `0 20px 52px ${hexToRgba(AI_DIGITAL_COLORS.yvesKleinBlue, 0.12)}`
                : `0 18px 44px ${hexToRgba(AI_DIGITAL_COLORS.midnightCharcoal, 0.06)}`,
            }}
          >
            {activeView !== 'lesson' ? (
              <Stack sx={{ minHeight: 0, overflow: 'hidden', height: '100%' }}>
                {(activitySaveError || activitySaveSuccess) && (
                  <Box sx={{ p: { xs: 1.5, md: 2 }, pb: 0 }}>
                    {activitySaveError && <Alert severity="error">{activitySaveError}</Alert>}
                    {activitySaveSuccess && <Alert severity="success">{activitySaveSuccess}</Alert>}
                  </Box>
                )}
                <ActivityEditor
                  activity={activeActivity}
                  draft={activeActivityDraft}
                  onDraftChange={setActivityDrafts}
                  disabled={!canManageCurrentLesson || isSavingActivity || isDeleting || isSaving || isRevising || isGeneratingActivity}
                />
              </Stack>
            ) : lesson.status === 'failed' ? (
              <Stack spacing={1.5} sx={{ p: { xs: 2, md: 3 } }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <ErrorOutlineOutlinedIcon color="error" />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Generation failed
                  </Typography>
                </Stack>
                <Typography color="text.secondary">
                  {lesson.errorMessage || 'No error message was saved.'}
                </Typography>
              </Stack>
            ) : (
              <Stack sx={{ minHeight: 0, overflow: 'hidden', height: '100%' }}>
                <Box
                  sx={{
                    px: { xs: 1.5, md: 2 },
                    py: 1.5,
                    borderBottom: '1px solid #e8edf5',
                    backgroundColor: isEditing ? hexToRgba(AI_DIGITAL_COLORS.lime, 0.16) : '#fff',
                  }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between' }}
                  >
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      {isEditing ? <EditOutlinedIcon sx={{ color: AI_DIGITAL_COLORS.yvesKleinBlue }} /> : <VisibilityOutlinedIcon sx={{ color: AI_DIGITAL_COLORS.yvesKleinBlue }} />}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                          {isEditing ? 'Editor mode' : 'Reading preview'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {isEditing ? 'Make changes in the rich-text canvas below.' : 'Review generated lesson content as learners will read it.'}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={1}
                      useFlexGap
                      sx={{ flexWrap: 'wrap', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}
                    >
                      <Chip
                        label={`${sourceReferences.length} source${sourceReferences.length === 1 ? '' : 's'} - ${activities.length} activit${activities.length === 1 ? 'y' : 'ies'}`}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          color: AI_DIGITAL_COLORS.yvesKleinBlue,
                          backgroundColor: hexToRgba(AI_DIGITAL_COLORS.skywave, 0.24),
                        }}
                      />

                      <Tooltip title={isRightPanelCollapsed ? 'Show sidebar' : 'Hide sidebar'}>
                        <IconButton
                          size="small"
                          aria-label={isRightPanelCollapsed ? 'Show lesson sidebar' : 'Hide lesson sidebar'}
                          onClick={() => setIsRightPanelCollapsed((prev) => !prev)}
                          sx={{
                            width: 30,
                            height: 30,
                            borderRadius: 1.5,
                            color: isRightPanelCollapsed
                              ? AI_DIGITAL_COLORS.yvesKleinBlue
                              : '#fff',
                            border: `1px solid ${hexToRgba(AI_DIGITAL_COLORS.yvesKleinBlue, 0.22)}`,
                            backgroundColor: isRightPanelCollapsed
                              ? '#fff'
                              : AI_DIGITAL_COLORS.yvesKleinBlue,
                            '&:hover': {
                              backgroundColor: isRightPanelCollapsed
                                ? hexToRgba(AI_DIGITAL_COLORS.skywave, 0.22)
                                : AI_DIGITAL_COLORS.violetPulse,
                            },
                          }}
                        >
                          <ViewSidebarOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Box>

                <Box sx={{ minHeight: 0, flex: '1 1 auto', overflow: 'hidden' }}>
                  <SimpleEditor
                    content={draftHtml}
                    editable={isEditing}
                    onChange={(nextHtml) => setDraftHtml(nextHtml)}
                    onImageUpload={uploadLessonImageAsset}
                    className="lesson-details-editor"
                  />
                </Box>

              </Stack>
            )}
          </Paper>

          {activeView === 'lesson' && isRightPanelVisible && (
            <Stack
              spacing={2}
              sx={{
                minHeight: 0,
                overflow: 'auto',
                pr: 0.5,
              }}
            >
            <DetailPanel
              title="Source materials"
              icon={<SourceOutlinedIcon fontSize="small" />}
              accent={AI_DIGITAL_COLORS.brightAqua}
            >
              {sourceReferences.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No source snapshot found.
                </Typography>
              ) : (
                <Stack spacing={1.25}>
                  {sourceReferences.map((source) => (
                    <Box
                      key={source.id}
                      component={onOpenSourceMaterial ? 'button' : 'div'}
                      type={onOpenSourceMaterial ? 'button' : undefined}
                      onClick={
                        onOpenSourceMaterial
                          ? () => onOpenSourceMaterial(source.id)
                          : undefined
                      }
                      sx={{
                        width: '100%',
                        p: 1,
                        border: `1px solid ${hexToRgba(AI_DIGITAL_COLORS.brightAqua, 0.36)}`,
                        borderRadius: 2,
                        backgroundColor: hexToRgba(AI_DIGITAL_COLORS.brightAqua, 0.08),
                        textAlign: 'left',
                        cursor: onOpenSourceMaterial ? 'pointer' : 'default',
                        font: 'inherit',
                        transition: 'background-color 0.15s ease, border-color 0.15s ease',
                        '&:hover': onOpenSourceMaterial
                          ? {
                              backgroundColor: hexToRgba(AI_DIGITAL_COLORS.brightAqua, 0.16),
                              borderColor: AI_DIGITAL_COLORS.neonAzure,
                            }
                          : undefined,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {source.sourceNumber}. {source.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(source.links?.length || 0) +
                          (source.youtubeUrls?.length || 0)} link(s),{' '}
                        {source.attachments?.length || 0} attachment(s)
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </DetailPanel>

            <DetailPanel
              title="Generation"
              icon={<TuneOutlinedIcon fontSize="small" />}
              accent={AI_DIGITAL_COLORS.digitalLilac}
            >
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                <Chip label={`Depth: ${lesson.depth || 'standard'}`} size="small" />
                <Chip label={`Tone: ${lesson.tone || 'clear'}`} size="small" />
                <Chip label={lesson.desiredFormat || 'structured theoretical lesson'} size="small" />
              </Stack>

              {lesson.userInstructions && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Extra instructions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {lesson.userInstructions}
                  </Typography>
                </>
              )}
            </DetailPanel>

            {lesson.status !== 'failed' && (
              <DetailPanel
                title="Revise lesson"
                icon={<AutoAwesomeOutlinedIcon fontSize="small" />}
                accent={AI_DIGITAL_COLORS.pink}
              >
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Describe what should change. The system will decide how broad the rewrite needs to be.
                    </Typography>
                  </Box>

                  {revisionError && <Alert severity="error">{revisionError}</Alert>}

                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                    {revisionOptions.map((option) => (
                      <Chip
                        key={option.value}
                        label={option.label}
                        clickable
                        color={selectedRevisionOptions.includes(option.value) ? 'primary' : 'default'}
                        variant={selectedRevisionOptions.includes(option.value) ? 'filled' : 'outlined'}
                        onClick={() => handleToggleRevisionOption(option.value)}
                      />
                    ))}
                  </Stack>

                  <TextField
                    label="Revision notes"
                    value={revisionRequest}
                    onChange={(event) => setRevisionRequest(event.target.value)}
                    minRows={4}
                    multiline
                    placeholder="Example: keep the factual content, but make the explanation less course-like and add one clear example for naming conventions."
                    fullWidth
                    disabled={!canManageCurrentLesson || isEditing || isDeleting || isSaving || isRevising}
                  />

                  {lastRevision && (
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: hexToRgba(AI_DIGITAL_COLORS.pink, 0.08),
                        border: `1px solid ${hexToRgba(AI_DIGITAL_COLORS.pink, 0.22)}`,
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', mb: 0.5 }}>
                        Last revision
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        {formatDateTime(lastRevision.revisedAt)} • {lastRevision.revisionBrief?.changeScope || 'substantial'}
                      </Typography>
                      {lastRevision.revisionRequest && (
                        <Typography variant="body2" color="text.secondary">
                          {lastRevision.revisionRequest}
                        </Typography>
                      )}
                    </Box>
                  )}

                  <Button
                    variant="contained"
                    startIcon={<AutoAwesomeOutlinedIcon />}
                    onClick={handleRevise}
                    disabled={!canManageCurrentLesson || isEditing || isDeleting || isSaving || isRevising}
                  >
                    {isRevising ? 'Revising lesson...' : 'Revise lesson'}
                  </Button>
                </Stack>
              </DetailPanel>
            )}

            <DetailPanel
              title="Add asset"
              icon={<AddOutlinedIcon fontSize="small" />}
              accent={AI_DIGITAL_COLORS.brightAqua}
            >
              <Stack spacing={1.25}>
                {assetError && <Alert severity="error">{assetError}</Alert>}
                <TextField
                  label="Link or YouTube URL"
                  value={assetUrl}
                  onChange={(event) => setAssetUrl(event.target.value)}
                  size="small"
                  fullWidth
                  disabled={!canManageCurrentLesson || isAddingAsset || isDeleting}
                />
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<LinkOutlinedIcon />}
                    onClick={handleAddUrlAsset}
                    disabled={!canManageCurrentLesson || isAddingAsset || isDeleting || !assetUrl.trim()}
                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}
                  >
                    {isAddingAsset ? 'Adding...' : 'Add link'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AttachFileOutlinedIcon />}
                    onClick={() => assetFileInputRef.current?.click()}
                    disabled={!canManageCurrentLesson || isAddingAsset || isDeleting}
                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}
                  >
                    File
                  </Button>
                </Stack>
                <Box
                  component="input"
                  type="file"
                  ref={assetFileInputRef}
                  onChange={(event) => handleAddFileAsset(event.target.files?.[0])}
                  sx={{ display: 'none' }}
                />
              </Stack>
            </DetailPanel>

            {hasAssets && (
              <DetailPanel
                title="Assets"
                icon={<LibraryBooksOutlinedIcon fontSize="small" />}
                accent={AI_DIGITAL_COLORS.neonAzure}
              >
                <LessonAttachments
                  attachments={allAssets}
                  onOpenSourceMaterial={onOpenSourceMaterial}
                  layout="column"
                  showTitle={false}
                />
              </DetailPanel>
            )}

            {lesson.status !== 'failed' && (
              <DetailPanel
                title="Generate activity"
                icon={<QuizOutlinedIcon fontSize="small" />}
                accent={AI_DIGITAL_COLORS.lime}
              >
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Create a saved quiz or flashcards from this lesson. Passing flow comes later.
                    </Typography>
                  </Box>

                  {activityError && <Alert severity="error">{activityError}</Alert>}
                  {activitySuccess && <Alert severity="success">{activitySuccess}</Alert>}

                  <FormControl fullWidth size="small">
                    <InputLabel id="activity-type-label">Activity type</InputLabel>
                    <Select
                      labelId="activity-type-label"
                      value={activityType}
                      label="Activity type"
                      onChange={(event) => handleActivityTypeChange(event.target.value)}
                      disabled={!canManageCurrentLesson || isEditing || isDeleting || isSaving || isRevising || isGeneratingActivity}
                    >
                      {activityTypeOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    label={activityType === 'quiz' ? 'Questions' : 'Cards'}
                    type="number"
                    value={activityCount}
                    onChange={(event) => setActivityCount(event.target.value)}
                    size="small"
                    fullWidth
                    slotProps={{
                      htmlInput: {
                        min: activitySettings.min,
                        max: activitySettings.max,
                      },
                    }}
                    helperText={`Allowed: ${activitySettings.min}-${activitySettings.max}`}
                    disabled={!canManageCurrentLesson || isEditing || isDeleting || isSaving || isPublishing || isArchiving || isRevising || isGeneratingActivity}
                  />

                  {activities.length > 0 && (
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: hexToRgba(AI_DIGITAL_COLORS.lime, 0.1),
                        border: `1px solid ${hexToRgba(AI_DIGITAL_COLORS.lime, 0.28)}`,
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', mb: 0.5 }}>
                        Saved activities
                      </Typography>
                      <Stack spacing={0.75}>
                        {activities.slice(0, 3).map((activity) => (
                          <Typography key={activity.id} variant="body2" color="text.secondary">
                            {activity.title || activity.type} - {activity.itemCount} item(s)
                          </Typography>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  <Button
                    variant="contained"
                    startIcon={<QuizOutlinedIcon />}
                    onClick={handleGenerateActivity}
                    disabled={!canManageCurrentLesson || isEditing || isDeleting || isSaving || isPublishing || isArchiving || isRevising || isGeneratingActivity}
                  >
                    {isGeneratingActivity ? 'Generating activity...' : 'Generate activity'}
                  </Button>
                </Stack>
              </DetailPanel>
            )}
            </Stack>
          )}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, md: 3 },
          py: 1.5,
          flex: '0 0 auto',
          borderTop: '1px solid #e4e8f0',
          backgroundColor: '#fff',
        }}
      >
        {isEditing && (
          <Stack direction="row" spacing={1} sx={{ mr: 'auto' }}>
            <Button
              onClick={() => {
                if (isLessonArchived) {
                  handleRestore();
                  return;
                }

                setArchiveError('');
                setIsConfirmArchiveOpen(true);
              }}
              color="inherit"
              startIcon={isLessonArchived ? <UnarchiveOutlinedIcon /> : <ArchiveOutlinedIcon />}
              disabled={!canManageCurrentLesson || (isLessonArchived && lesson.status !== 'ready') || isSaving || isPublishing || isArchiving || isDeleting || isRevising || isGeneratingActivity || isSavingActivity}
              sx={{
                textTransform: 'none',
                fontWeight: 850,
              }}
            >
              {isLessonArchived
                ? isPublishing
                  ? 'Restoring...'
                  : 'Restore lesson'
                : isArchiving
                  ? 'Archiving...'
                  : 'Archive lesson'}
            </Button>
            <Button
              onClick={() => {
                setDeleteError('');
                setIsConfirmDeleteOpen(true);
              }}
              color="error"
              startIcon={<DeleteOutlineOutlinedIcon />}
              disabled={!canManageCurrentLesson || isSaving || isPublishing || isArchiving || isDeleting || isRevising || isGeneratingActivity || isSavingActivity}
              sx={{
                textTransform: 'none',
                fontWeight: 850,
              }}
            >
              Delete lesson
            </Button>
          </Stack>
        )}

        {activeView !== 'lesson' ? (
          <Button
            onClick={handleSaveActivity}
            variant="contained"
            startIcon={<SaveOutlinedIcon />}
            disabled={!canManageCurrentLesson || isDeleting || isSaving || isPublishing || isArchiving || isRevising || isGeneratingActivity || isSavingActivity}
          >
            {isSavingActivity ? 'Saving activity...' : 'Save activity'}
          </Button>
        ) : isEditing ? (
          <>
            <Button onClick={handleCancelEdit} color="inherit" disabled={isSaving || isPublishing || isArchiving || isDeleting || isGeneratingActivity || isSavingActivity}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              startIcon={<SaveOutlinedIcon />}
              disabled={!canManageCurrentLesson || isSaving || isPublishing || isArchiving || isDeleting || isRevising || isGeneratingActivity || isSavingActivity}
            >
              {isSaving ? 'Saving...' : 'Save changes'}
            </Button>
          </>
        ) : (
          lesson.status !== 'failed' && (
            <>
              {canPublishLesson && (
                <Button
                  onClick={handlePublish}
                  variant="contained"
                  color="success"
                  startIcon={<RocketLaunchOutlinedIcon />}
                  disabled={!canManageCurrentLesson || isDeleting || isSaving || isPublishing || isArchiving || isRevising || isGeneratingActivity || isSavingActivity}
                >
                  {isPublishing ? 'Publishing...' : 'Publish lesson'}
                </Button>
              )}
              <Button
                onClick={() => setIsEditing(true)}
                variant="contained"
                startIcon={<EditOutlinedIcon />}
                disabled={!canManageCurrentLesson || isDeleting || isSaving || isPublishing || isArchiving || isRevising || isGeneratingActivity || isSavingActivity}
              >
                Edit lesson
              </Button>
            </>
          )
        )}
        <Button
          onClick={onClose}
          color="inherit"
          startIcon={<LibraryBooksOutlinedIcon />}
          disabled={isSaving || isPublishing || isArchiving || isDeleting || isRevising || isGeneratingActivity || isSavingActivity}
        >
          Close
        </Button>
      </DialogActions>

      <Dialog
        open={isConfirmArchiveOpen}
        onClose={() => {
          if (!isArchiving) {
            setIsConfirmArchiveOpen(false);
          }
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Archive lesson?</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <Typography variant="body1">
              This will archive <strong>{lesson.title}</strong>.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Archived lessons are hidden from published library views and cannot be added to My Lessons until restored.
            </Typography>
            {archiveError && (
              <Alert severity="error">
                {archiveError}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setIsConfirmArchiveOpen(false)}
            color="inherit"
            disabled={isArchiving}
          >
            Cancel
          </Button>
          <Button
            color="warning"
            variant="contained"
            onClick={handleArchive}
            disabled={!canManageCurrentLesson || isArchiving}
          >
            {isArchiving ? 'Archiving...' : 'Archive lesson'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isConfirmDeleteOpen}
        onClose={() => {
          if (!isDeleting) {
            setIsConfirmDeleteOpen(false);
          }
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete lesson?</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <Typography variant="body1">
              This action will permanently remove <strong>{lesson.title}</strong>.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The lesson will be removed from the library and from every user&apos;s My Lessons.
            </Typography>
            {deleteError && (
              <Alert severity="error">
                {deleteError}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setIsConfirmDeleteOpen(false)}
            color="inherit"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={!canManageCurrentLesson || isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
