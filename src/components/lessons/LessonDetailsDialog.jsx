'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import OndemandVideoOutlinedIcon from '@mui/icons-material/OndemandVideoOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import StyleOutlinedIcon from '@mui/icons-material/StyleOutlined';
import UnarchiveOutlinedIcon from '@mui/icons-material/UnarchiveOutlined';
import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined';
import LessonAttachments, { getSourceAttachments } from './LessonAttachments';
import LessonReader from './LessonReader';
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

const teacherVideoActiveStatuses = new Set(['pending', 'processing', 'generating']);

const LESSON_DIALOG_COLORS = {
  blue: '#0009DC',
  ink: '#0B0B0B',
  slate: '#33344A',
  mute: '#80808E',
  blue50: '#F5F5FE',
  blue100: '#E3E5FF',
  blue200: '#CBD0FF',
  success: '#229E5A',
};

const lessonActionButtonSx = {
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

const lessonSecondaryButtonSx = {
  ...lessonActionButtonSx,
  borderColor: LESSON_DIALOG_COLORS.blue200,
  color: LESSON_DIALOG_COLORS.blue,
  backgroundColor: '#fff',
  '&:hover': {
    borderColor: LESSON_DIALOG_COLORS.blue,
    backgroundColor: LESSON_DIALOG_COLORS.blue50,
  },
};

const lessonPrimaryButtonSx = {
  ...lessonActionButtonSx,
  backgroundColor: LESSON_DIALOG_COLORS.blue,
  color: '#fff',
  boxShadow: '0 8px 18px rgba(0, 9, 220, 0.22)',
  '&:hover': {
    backgroundColor: LESSON_DIALOG_COLORS.blue,
    boxShadow: '0 10px 22px rgba(0, 9, 220, 0.26)',
  },
};

const lessonDarkButtonSx = {
  ...lessonActionButtonSx,
  backgroundColor: LESSON_DIALOG_COLORS.ink,
  color: '#fff',
  boxShadow: 'none',
  '&:hover': {
    backgroundColor: LESSON_DIALOG_COLORS.ink,
    boxShadow: 'none',
  },
};

const lessonDangerButtonSx = {
  ...lessonActionButtonSx,
  borderColor: 'rgba(214, 47, 47, 0.28)',
  color: '#D62F2F',
  backgroundColor: '#fff',
  '&:hover': {
    borderColor: '#D62F2F',
    backgroundColor: 'rgba(214, 47, 47, 0.05)',
  },
};

const activityTextFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 1.5,
    backgroundColor: '#fff',
    '& fieldset': { borderColor: LESSON_DIALOG_COLORS.blue200 },
    '&:hover fieldset': { borderColor: LESSON_DIALOG_COLORS.blue },
    '&.Mui-focused fieldset': { borderColor: LESSON_DIALOG_COLORS.blue },
  },
  '& .MuiInputLabel-root': {
    color: LESSON_DIALOG_COLORS.mute,
    fontSize: 13,
    fontWeight: 700,
  },
  '& .MuiInputBase-input': {
    color: LESSON_DIALOG_COLORS.ink,
    fontSize: 14,
    lineHeight: 1.45,
  },
};

const activityPlainFieldSx = {
  '& .MuiInputLabel-root': {
    color: LESSON_DIALOG_COLORS.mute,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.04em',
  },
  '& .MuiInputBase-root': {
    color: LESSON_DIALOG_COLORS.ink,
    fontSize: 15,
    lineHeight: 1.45,
  },
  '& .MuiInputBase-input': {
    py: 0.75,
  },
  '& .MuiInput-underline:before': {
    borderBottomColor: 'rgba(0, 9, 220, 0.14)',
  },
  '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
    borderBottomColor: 'rgba(0, 9, 220, 0.28)',
  },
  '& .MuiInput-underline:after': {
    borderBottomColor: LESSON_DIALOG_COLORS.blue,
  },
};

const activityCardSx = {
  p: { xs: 1.5, md: 2.25 },
  borderRadius: 1.75,
  border: `1px solid ${LESSON_DIALOG_COLORS.blue100}`,
  backgroundColor: '#fff',
};

const activityBadgeSx = {
  height: 28,
  borderRadius: 999,
  px: 1.25,
  color: LESSON_DIALOG_COLORS.blue,
  backgroundColor: LESSON_DIALOG_COLORS.blue50,
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

function getActivityTypeSettings(type) {
  return activityTypeOptions.find((option) => option.value === type) || activityTypeOptions[0];
}

function DetailPanel({ title, children }) {
  return (
    <Box>
      <Typography
        sx={{
          mb: 1.25,
          color: LESSON_DIALOG_COLORS.mute,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.08em',
          lineHeight: 1,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Typography>

      <Box
        sx={{
          p: 1.25,
          borderRadius: 1.25,
          border: `1px solid ${LESSON_DIALOG_COLORS.blue200}`,
          backgroundColor: '#fff',
        }}
      >
        {children}
      </Box>
    </Box>
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
  const itemCount = isFlashcards ? draft.cards.length : draft.items.length;

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
    <Stack sx={{ minHeight: 0, height: '100%', backgroundColor: '#fff' }}>
      <Box
        sx={{
          px: { xs: 2, md: 3.5 },
          py: 2.25,
          borderBottom: `1px solid ${LESSON_DIALOG_COLORS.blue100}`,
          backgroundColor: '#fff',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                color: LESSON_DIALOG_COLORS.blue,
                backgroundColor: LESSON_DIALOG_COLORS.blue50,
              }}
            >
              {isFlashcards ? (
                <StyleOutlinedIcon fontSize="small" />
              ) : (
                <QuizOutlinedIcon fontSize="small" />
              )}
            </Box>
            <Box>
              <Typography
                sx={{
                  color: LESSON_DIALOG_COLORS.blue,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  lineHeight: 1,
                  mb: 0.75,
                  textTransform: 'uppercase',
                }}
              >
                Activity editor
              </Typography>
              <Typography sx={{ color: LESSON_DIALOG_COLORS.ink, fontSize: 24, fontWeight: 900, lineHeight: 1 }}>
                {isFlashcards ? 'Flashcards editor' : 'Quiz editor'}
              </Typography>
            </Box>
          </Stack>

          <Chip
            label={`${itemCount} item${itemCount === 1 ? '' : 's'}`}
            size="small"
            sx={{
              ...activityBadgeSx,
              alignSelf: { xs: 'flex-start', md: 'center' },
            }}
          />
        </Stack>
      </Box>

      <Box
        sx={{
          flex: '1 1 auto',
          minHeight: 0,
          overflow: 'auto',
          p: { xs: 2, md: 3.5 },
          backgroundColor: '#fff',
        }}
      >
        <Stack spacing={2.25}>
          <TextField
            label={isFlashcards ? 'Flashcards title' : 'Quiz title'}
            value={draft.title}
            onChange={(event) => updateDraft((currentDraft) => ({
              ...currentDraft,
              title: event.target.value,
            }))}
            disabled={disabled}
            fullWidth
            sx={activityTextFieldSx}
          />

          {isFlashcards ? (
            <>
              {draft.cards.map((card, cardIndex) => (
                <Paper key={`card-${cardIndex}`} elevation={0} sx={activityCardSx}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip label={`Card ${cardIndex + 1}`} size="small" sx={activityBadgeSx} />
                      <IconButton
                        aria-label="Remove flashcard"
                        size="small"
                        disabled={disabled || draft.cards.length <= 1}
                        onClick={() => updateDraft((currentDraft) => ({
                          ...currentDraft,
                          cards: currentDraft.cards.filter((_, index) => index !== cardIndex),
                        }))}
                        sx={{
                          color: '#D62F2F',
                          '&.Mui-disabled': { color: LESSON_DIALOG_COLORS.mute },
                        }}
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
                      sx={activityTextFieldSx}
                    />
                    <TextField
                      label="Back"
                      value={card.back}
                      onChange={(event) => updateCard(cardIndex, { ...card, back: event.target.value })}
                      disabled={disabled}
                      multiline
                      minRows={2}
                      fullWidth
                      sx={activityTextFieldSx}
                    />
                    <TextField
                      label="Explanation"
                      value={card.explanation}
                      onChange={(event) => updateCard(cardIndex, { ...card, explanation: event.target.value })}
                      disabled={disabled}
                      multiline
                      minRows={2}
                      fullWidth
                      sx={activityTextFieldSx}
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
                sx={{ ...lessonSecondaryButtonSx, alignSelf: 'flex-start' }}
              >
                Add card
              </Button>
            </>
          ) : (
            <>
              {draft.items.map((item, itemIndex) => (
                <Paper key={`question-${itemIndex}`} elevation={0} sx={activityCardSx}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip label={`Question ${itemIndex + 1}`} size="small" sx={activityBadgeSx} />
                      <IconButton
                        aria-label="Remove question"
                        size="small"
                        disabled={disabled || draft.items.length <= 1}
                        onClick={() => updateDraft((currentDraft) => ({
                          ...currentDraft,
                          items: currentDraft.items.filter((_, index) => index !== itemIndex),
                        }))}
                        sx={{
                          color: '#D62F2F',
                          '&.Mui-disabled': { color: LESSON_DIALOG_COLORS.mute },
                        }}
                      >
                        <DeleteOutlineOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                    <TextField
                      label="Question"
                      value={item.question}
                      onChange={(event) => updateQuizItem(itemIndex, { ...item, question: event.target.value })}
                      disabled={disabled}
                      variant="standard"
                      multiline
                      minRows={2}
                      fullWidth
                      sx={activityPlainFieldSx}
                    />
                    <Stack spacing={0.75}>
                      {item.options.map((option, optionIndex) => {
                        const isCorrectOption = item.correctAnswer === option && Boolean(option);

                        return (
                          <Box
                            key={`option-${optionIndex}`}
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: 'auto minmax(0, 1fr)',
                              gap: 1,
                              alignItems: 'center',
                              px: 1.25,
                              py: 0.75,
                              borderRadius: 999,
                              border: isCorrectOption ? `1.5px solid ${LESSON_DIALOG_COLORS.blue}` : '1.5px solid transparent',
                              backgroundColor: isCorrectOption ? LESSON_DIALOG_COLORS.blue50 : '#fff',
                            }}
                          >
                            <Radio
                              checked={isCorrectOption}
                              disabled={disabled || !option}
                              onChange={() => updateQuizItem(itemIndex, { ...item, correctAnswer: option })}
                              size="small"
                              sx={{
                                color: LESSON_DIALOG_COLORS.blue200,
                                '&.Mui-checked': { color: LESSON_DIALOG_COLORS.blue },
                              }}
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
                              variant="standard"
                              size="small"
                              fullWidth
                              sx={activityPlainFieldSx}
                            />
                          </Box>
                        );
                      })}
                    </Stack>
                    <TextField
                      label="Explanation"
                      value={item.explanation}
                      onChange={(event) => updateQuizItem(itemIndex, { ...item, explanation: event.target.value })}
                      disabled={disabled}
                      variant="standard"
                      multiline
                      minRows={2}
                      fullWidth
                      sx={activityPlainFieldSx}
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
                sx={{ ...lessonSecondaryButtonSx, alignSelf: 'flex-start' }}
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
  const [teacherVideoError, setTeacherVideoError] = useState('');
  const [teacherVideoSuccess, setTeacherVideoSuccess] = useState('');
  const [isGeneratingTeacherVideo, setIsGeneratingTeacherVideo] = useState(false);
  const [isCheckingTeacherVideo, setIsCheckingTeacherVideo] = useState(false);
  const [activeView, setActiveView] = useState('lesson');
  const [activityDrafts, setActivityDrafts] = useState({});
  const [activitySaveError, setActivitySaveError] = useState('');
  const [activitySaveSuccess, setActivitySaveSuccess] = useState('');
  const [isSavingActivity, setIsSavingActivity] = useState(false);
  const [assetUrl, setAssetUrl] = useState('');
  const [assetError, setAssetError] = useState('');
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const assetFileInputRef = useRef(null);
  const coverFileInputRef = useRef(null);
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
  const [draftCoverImage, setDraftCoverImage] = useState(() => ({
    storageKey: lesson?.coverImageStorageKey || '',
    originalName: lesson?.coverImageOriginalName || '',
    mimeType: lesson?.coverImageMimeType || '',
  }));
  const [coverError, setCoverError] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const teacherVideoPollingStatus = lesson?.generationMetadata?.teacherVideo?.status;
  const teacherVideoPollingVideoId = lesson?.generationMetadata?.teacherVideo?.videoId;

  useEffect(() => {
    setIsEditing(false);
    setIsConfirmDeleteOpen(false);
    setIsConfirmArchiveOpen(false);
    setDeleteError('');
    setArchiveError('');
    setDraftHtml(initialHtml);
    setDraftTitle(lesson?.title || '');
    setDraftTags(normalizeLessonTagInput(lesson?.tags || []));
    setDraftCoverImage({
      storageKey: lesson?.coverImageStorageKey || '',
      originalName: lesson?.coverImageOriginalName || '',
      mimeType: lesson?.coverImageMimeType || '',
    });
    setCoverError('');
    setIsUploadingCover(false);
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
    setTeacherVideoError('');
    setTeacherVideoSuccess('');
    setIsGeneratingTeacherVideo(false);
    setIsCheckingTeacherVideo(false);
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
      setIsRightPanelCollapsed(false);
    }
  }, [isEditing]);

  useEffect(() => {
    if (
      !open ||
      !teacherVideoPollingVideoId ||
      !teacherVideoActiveStatuses.has(teacherVideoPollingStatus)
    ) {
      return undefined;
    }

    let isCancelled = false;

    const refreshTeacherVideo = async () => {
      try {
        setIsCheckingTeacherVideo(true);
        const response = await fetch(`/api/lessons/${lesson.id}/teacher-video`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to refresh teacher video.');
        }

        if (!isCancelled) {
          await onLessonUpdated?.(data.lesson, { silent: true });
          if (data.teacherVideo?.status === 'completed') {
            setTeacherVideoSuccess('Teacher video is ready.');
          }
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to refresh teacher video:', error);
          setTeacherVideoError(error.message || 'Failed to refresh teacher video.');
        }
      } finally {
        if (!isCancelled) {
          setIsCheckingTeacherVideo(false);
        }
      }
    };

    const intervalId = window.setInterval(refreshTeacherVideo, 10000);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [
    lesson?.id,
    onLessonUpdated,
    open,
    teacherVideoPollingStatus,
    teacherVideoPollingVideoId,
  ]);

  useEffect(() => {
    const nextActivities = Array.isArray(lesson?.activities) ? lesson.activities : [];
    const canOpenActivities = Boolean(lesson?.viewerCanManage);
    const hasQuiz = nextActivities.some((activity) => activity.type === 'quiz');
    const hasFlashcards = nextActivities.some((activity) => activity.type === 'flashcards');

    if (
      ((activeView === 'quiz' || activeView === 'flashcards') && !canOpenActivities) ||
      (activeView === 'quiz' && !hasQuiz) ||
      (activeView === 'flashcards' && !hasFlashcards)
    ) {
      setActiveView('lesson');
    }
  }, [activeView, lesson?.activities, lesson?.viewerCanManage]);

  if (!lesson) {
    return null;
  }

  const metadata = lesson.generationMetadata || {};
  const teacherVideo = metadata.teacherVideo || {};
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
  const canManageCurrentLesson = Boolean(lesson.viewerCanManage);
  const canGenerateTeacherVideo = Boolean(lesson.viewerCanGenerateTeacherVideo);
  const quizActivity = activities.find((activity) => activity.type === 'quiz') || null;
  const flashcardsActivity = activities.find((activity) => activity.type === 'flashcards') || null;
  const activeActivity = canManageCurrentLesson && activeView === 'quiz'
    ? quizActivity
    : canManageCurrentLesson && activeView === 'flashcards'
      ? flashcardsActivity
      : null;
  const activeActivityDraft = activeActivity
    ? activityDrafts[activeActivity.id] || createActivityDraft(activeActivity)
    : null;
  const activitySettings = getActivityTypeSettings(activityType);
  const hasAssets = allAssets.length > 0;
  const isRightPanelVisible = !isRightPanelCollapsed;
  const isLessonArchived = lesson.isArchived || lesson.publicationStatus === 'archived';
  const canPublishLesson =
    lesson.status === 'ready' &&
    !lesson.isPublished &&
    !isLessonArchived &&
    canManageCurrentLesson;
  const lastEditedAt = lesson.updatedAt || lesson.createdAt;
  const lastEditedLabel = lastEditedAt
    ? `Edited ${formatDateTime(lastEditedAt)}`
    : 'Edited date unknown';
  const visibleTags = isEditing ? draftTags : normalizeLessonTagInput(lesson.tags || []);
  const coverPreviewSrc = draftCoverImage.storageKey
    ? `/api/files/object?storageKey=${encodeURIComponent(draftCoverImage.storageKey)}`
    : '';
  const isTeacherVideoActive = teacherVideoActiveStatuses.has(teacherVideo.status);
  const teacherVideoStatusLabel = teacherVideo.status
    ? teacherVideo.status.replace(/_/g, ' ')
    : 'not generated';


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
          coverImageStorageKey: draftCoverImage.storageKey,
          coverImageOriginalName: draftCoverImage.originalName,
          coverImageMimeType: draftCoverImage.mimeType,
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
    setDraftCoverImage({
      storageKey: lesson.coverImageStorageKey || '',
      originalName: lesson.coverImageOriginalName || '',
      mimeType: lesson.coverImageMimeType || '',
    });
    setCoverError('');
    setIsEditing(false);
  };

  const handleCoverImageChange = async (file) => {
    if (!file) {
      return;
    }

    if (!file.type?.startsWith('image/')) {
      setCoverError('Choose an image file.');
      if (coverFileInputRef.current) {
        coverFileInputRef.current.value = '';
      }
      return;
    }

    try {
      setIsUploadingCover(true);
      setCoverError('');

      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const uploadResponse = await fetch('/api/lessons/upload-file', {
        method: 'POST',
        body: uploadFormData,
      });
      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || `Failed to upload cover image: ${file.name}`);
      }

      setDraftCoverImage({
        storageKey: uploadData.storageKey,
        originalName: file.name,
        mimeType: file.type || 'image/*',
      });
    } catch (error) {
      console.error('Failed to upload lesson cover image:', error);
      setCoverError(error.message || 'Failed to upload cover image.');
    } finally {
      setIsUploadingCover(false);
      if (coverFileInputRef.current) {
        coverFileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveCoverImage = () => {
    setDraftCoverImage({
      storageKey: '',
      originalName: '',
      mimeType: '',
    });
    setCoverError('');
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

  const handleGenerateTeacherVideo = async () => {
    try {
      setIsGeneratingTeacherVideo(true);
      setTeacherVideoError('');
      setTeacherVideoSuccess('');

      const response = await fetch(`/api/lessons/${lesson.id}/teacher-video`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate teacher video.');
      }

      setTeacherVideoSuccess('Teacher video generation started. Status will refresh automatically.');
      await onLessonUpdated?.(data.lesson, { silent: true });
    } catch (error) {
      console.error('Failed to generate teacher video:', error);
      setTeacherVideoError(error.message || 'Failed to generate teacher video.');
    } finally {
      setIsGeneratingTeacherVideo(false);
    }
  };

  const handleRefreshTeacherVideo = async () => {
    if (!teacherVideo.videoId) {
      return;
    }

    try {
      setIsCheckingTeacherVideo(true);
      setTeacherVideoError('');

      const response = await fetch(`/api/lessons/${lesson.id}/teacher-video`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refresh teacher video.');
      }

      if (data.teacherVideo?.status === 'completed') {
        setTeacherVideoSuccess('Teacher video is ready.');
      }
      await onLessonUpdated?.(data.lesson, { silent: true });
    } catch (error) {
      console.error('Failed to refresh teacher video:', error);
      setTeacherVideoError(error.message || 'Failed to refresh teacher video.');
    } finally {
      setIsCheckingTeacherVideo(false);
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
            width: 'calc(100vw - 40px)',
            maxWidth: 1180,
            height: 'calc(100vh - 50px)',
            maxHeight: 760,
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
            backgroundColor: '#fff',
            border: 0,
            boxShadow: '0 40px 80px rgba(11, 11, 11, 0.25)',
          },
        },
      }}
    >
      <DialogContent
        dividers
        sx={{
          flex: '1 1 auto',
          height: 0,
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          p: 0,
          borderColor: LESSON_DIALOG_COLORS.blue100,
          backgroundColor: '#fff',
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
            gap: 0,
            alignItems: 'stretch',
            flex: '1 1 auto',
            height: '100%',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              borderRadius: 0,
              border: 0,
              backgroundColor: '#fff',
              minHeight: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'none',
            }}
          >
            <Box
              sx={{
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: { xs: 2, md: 3.5 },
                py: 2.5,
                minHeight: 76,
                borderBottom: `1px solid ${LESSON_DIALOG_COLORS.blue100}`,
                backgroundColor: '#fff',
              }}
            >
              <Tabs
                value={activeView}
                onChange={(_event, nextView) => {
                  setActiveView(nextView);
                  setActivitySaveError('');
                  setActivitySaveSuccess('');
                }}
                variant="scrollable"
                scrollButtons={false}
                sx={{
                  minHeight: 32,
                  '& .MuiTabs-indicator': { display: 'none' },
                  '& .MuiTabs-flexContainer': { gap: 0.5 },
                  '& .MuiTab-root': {
                    minHeight: 32,
                    minWidth: 0,
                    px: 1.75,
                    py: 1,
                    borderRadius: 999,
                    color: LESSON_DIALOG_COLORS.mute,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    lineHeight: 1,
                    textTransform: 'uppercase',
                    transition: 'background-color 120ms ease, color 120ms ease',
                  },
                  '& .Mui-selected': {
                    color: LESSON_DIALOG_COLORS.blue,
                    backgroundColor: LESSON_DIALOG_COLORS.blue50,
                  },
                }}
              >
                <Tab value="lesson" label="Reading" />
                {flashcardsActivity && (
                  <Tab
                    value="flashcards"
                    label="Flashcards"
                    disabled={!canManageCurrentLesson}
                  />
                )}
                {quizActivity && (
                  <Tab
                    value="quiz"
                    label="Quiz"
                    disabled={!canManageCurrentLesson}
                  />
                )}
              </Tabs>

              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{
                    display: { xs: 'none', sm: 'flex' },
                    alignItems: 'center',
                    gap: 1,
                    minHeight: 30,
                    px: 1.5,
                    borderRadius: 999,
                    color: LESSON_DIALOG_COLORS.success,
                    backgroundColor: hexToRgba(LESSON_DIALOG_COLORS.success, 0.1),
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      flex: '0 0 auto',
                      borderRadius: '50%',
                      backgroundColor: LESSON_DIALOG_COLORS.success,
                    }}
                  />
                  <Typography
                    component="span"
                    sx={{
                      color: LESSON_DIALOG_COLORS.success,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      lineHeight: 1,
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {lastEditedLabel}
                  </Typography>
                </Box>

                {isEditing && (
                  <>
                    <Tooltip title={coverError || (coverPreviewSrc ? 'Replace cover image' : 'Upload cover image')}>
                      <span>
                        <IconButton
                          size="small"
                          aria-label={coverPreviewSrc ? 'Replace lesson cover image' : 'Upload lesson cover image'}
                          onClick={() => coverFileInputRef.current?.click()}
                          disabled={!canManageCurrentLesson || isUploadingCover || isSaving || isDeleting}
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: 999,
                            color: coverPreviewSrc ? '#fff' : LESSON_DIALOG_COLORS.blue,
                            border: `1px solid ${LESSON_DIALOG_COLORS.blue200}`,
                            backgroundColor: coverPreviewSrc ? LESSON_DIALOG_COLORS.blue : '#fff',
                            backgroundImage: coverPreviewSrc ? `url("${coverPreviewSrc}")` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            boxShadow: coverPreviewSrc ? 'inset 0 0 0 999px rgba(0, 9, 220, 0.28)' : 'none',
                            '&:hover': {
                              color: '#fff',
                              backgroundColor: LESSON_DIALOG_COLORS.blue,
                              boxShadow: coverPreviewSrc
                                ? 'inset 0 0 0 999px rgba(0, 9, 220, 0.38)'
                                : 'none',
                            },
                            '&.Mui-disabled': {
                              color: LESSON_DIALOG_COLORS.mute,
                              backgroundColor: '#fff',
                              backgroundImage: 'none',
                            },
                          }}
                        >
                          <ImageOutlinedIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                    {coverPreviewSrc && (
                      <Tooltip title="Remove cover image">
                        <span>
                          <IconButton
                            size="small"
                            aria-label="Remove lesson cover image"
                            onClick={handleRemoveCoverImage}
                            disabled={!canManageCurrentLesson || isUploadingCover || isSaving || isDeleting}
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: 999,
                              color: '#D62F2F',
                              border: '1px solid rgba(214, 47, 47, 0.28)',
                              backgroundColor: '#fff',
                              '&:hover': {
                                borderColor: '#D62F2F',
                                backgroundColor: 'rgba(214, 47, 47, 0.05)',
                              },
                              '&.Mui-disabled': {
                                color: LESSON_DIALOG_COLORS.mute,
                                backgroundColor: '#fff',
                              },
                            }}
                          >
                            <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                    <Box
                      component="input"
                      type="file"
                      accept="image/*"
                      ref={coverFileInputRef}
                      onChange={(event) => handleCoverImageChange(event.target.files?.[0])}
                      sx={{ display: 'none' }}
                    />
                  </>
                )}

                <Tooltip title={isRightPanelCollapsed ? 'Show sidebar' : 'Hide sidebar'}>
                  <IconButton
                    size="small"
                    aria-label={isRightPanelCollapsed ? 'Show lesson sidebar' : 'Hide lesson sidebar'}
                    onClick={() => setIsRightPanelCollapsed((prev) => !prev)}
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: 999,
                      color: isRightPanelCollapsed ? LESSON_DIALOG_COLORS.blue : '#fff',
                      border: `1px solid ${LESSON_DIALOG_COLORS.blue200}`,
                      backgroundColor: isRightPanelCollapsed ? '#fff' : LESSON_DIALOG_COLORS.blue,
                      '&:hover': {
                        backgroundColor: isRightPanelCollapsed
                          ? LESSON_DIALOG_COLORS.blue50
                          : LESSON_DIALOG_COLORS.blue,
                      },
                    }}
                  >
                    <ViewSidebarOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Close">
                  <IconButton
                    size="small"
                    aria-label="Close lesson details"
                    onClick={onClose}
                    disabled={isSaving || isPublishing || isArchiving || isDeleting || isRevising || isGeneratingActivity || isSavingActivity || isUploadingCover}
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: 999,
                      color: LESSON_DIALOG_COLORS.ink,
                      border: `1px solid ${LESSON_DIALOG_COLORS.blue200}`,
                      backgroundColor: '#fff',
                      '&:hover': {
                        color: LESSON_DIALOG_COLORS.blue,
                        backgroundColor: LESSON_DIALOG_COLORS.blue50,
                      },
                      '&.Mui-disabled': {
                        color: LESSON_DIALOG_COLORS.mute,
                        backgroundColor: '#fff',
                      },
                    }}
                  >
                    <CloseOutlinedIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>

            {activeView !== 'lesson' && canManageCurrentLesson ? (
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
                    minHeight: 0,
                    flex: '1 1 auto',
                    overflow: isEditing ? 'hidden' : 'auto',
                    display: isEditing ? 'flex' : 'block',
                    flexDirection: isEditing ? 'column' : undefined,
                    backgroundColor: '#fff',
                    cursor: isEditing ? 'text' : 'default',
                  }}
                >
                  <Box
                    sx={{
                      flex: '0 0 auto',
                      maxWidth: isEditing
                        ? 'calc(100% - 64px)'
                        : isRightPanelVisible
                          ? 860
                          : 'none',
                      mx: 0,
                      px: { xs: 3, md: isEditing ? 5 : 7 },
                      pt: { xs: 3, md: isEditing ? 4 : 7 },
                      pb: 0,
                    }}
                  >
                    <Typography
                      sx={{
                        mb: 1.25,
                        color: LESSON_DIALOG_COLORS.blue,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        lineHeight: 1.1,
                        textTransform: 'uppercase',
                      }}
                    >
                      Lesson - Preview
                    </Typography>

                    {isEditing ? (
                      <Box
                        component="input"
                        value={draftTitle}
                        onChange={(event) => setDraftTitle(event.target.value)}
                        placeholder="Lesson title"
                        sx={{
                          display: 'block',
                          width: '100%',
                          border: `1px dashed ${LESSON_DIALOG_COLORS.blue200}`,
                          outline: 0,
                          borderRadius: 1,
                          px: 1.5,
                          py: 1,
                          color: LESSON_DIALOG_COLORS.ink,
                          backgroundColor: LESSON_DIALOG_COLORS.blue50,
                          fontFamily: '"Barlow Semi Condensed", Inter, Arial, sans-serif',
                          fontSize: { xs: 28, md: 34 },
                          fontWeight: 900,
                          lineHeight: 1.02,
                          letterSpacing: 0,
                          '&::placeholder': { color: LESSON_DIALOG_COLORS.mute },
                          '&:focus': { borderColor: LESSON_DIALOG_COLORS.blue },
                        }}
                      />
                    ) : (
                      <Typography
                        component="h1"
                        sx={{
                          m: 0,
                          maxWidth: isRightPanelVisible ? 760 : 1180,
                          color: LESSON_DIALOG_COLORS.ink,
                          fontFamily: '"Barlow Semi Condensed", Inter, Arial, sans-serif',
                          fontSize: { xs: 52, md: 82 },
                          fontWeight: 900,
                          letterSpacing: 0,
                          lineHeight: 0.92,
                          wordBreak: 'break-word',
                        }}
                      >
                        {draftTitle || lesson.title}
                      </Typography>
                    )}

                    {!isEditing && lesson.description && (
                      <Typography
                        sx={{
                          maxWidth: 660,
                          mt: 1.5,
                          color: '#4C5065',
                          fontSize: { xs: 18, md: 23 },
                          lineHeight: 1.38,
                        }}
                      >
                        {lesson.description}
                      </Typography>
                    )}
                  </Box>

                  {isEditing ? (
                    <SimpleEditor
                      content={draftHtml}
                      editable
                      onChange={(nextHtml) => setDraftHtml(nextHtml)}
                      onImageUpload={uploadLessonImageAsset}
                      className="lesson-details-editor"
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        maxWidth: isRightPanelVisible ? 860 : 'none',
                        px: { xs: 3, md: 7 },
                        py: { xs: 3, md: 6 },
                      }}
                    >
                      <LessonReader html={draftHtml} />
                    </Box>
                  )}
                </Box>
              </Stack>
            )}
          </Paper>

          {activeView === 'lesson' && isRightPanelVisible && (
            <Stack
              spacing={2.5}
              sx={{
                minHeight: 0,
                overflow: 'auto',
                px: 3,
                py: 3,
                borderLeft: `1px solid ${LESSON_DIALOG_COLORS.blue100}`,
                backgroundColor: '#F9F9F9',
              }}
            >
            <Box>
              <Typography
                sx={{
                  mb: 1.25,
                  color: LESSON_DIALOG_COLORS.mute,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  lineHeight: 1,
                  textTransform: 'uppercase',
                }}
              >
                Source material
              </Typography>

              {sourceReferences.length === 0 ? (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1.25,
                    border: `1px solid ${LESSON_DIALOG_COLORS.blue200}`,
                    backgroundColor: '#fff',
                  }}
                >
                  <Typography sx={{ color: LESSON_DIALOG_COLORS.mute, fontSize: 12, fontWeight: 600 }}>
                    No source snapshot found.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1}>
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
                        display: 'grid',
                        gridTemplateColumns: '36px minmax(0, 1fr)',
                        gap: 1.25,
                        alignItems: 'center',
                        p: 1.25,
                        border: `1px solid ${LESSON_DIALOG_COLORS.blue200}`,
                        borderRadius: 1.25,
                        backgroundColor: '#fff',
                        textAlign: 'left',
                        cursor: onOpenSourceMaterial ? 'pointer' : 'default',
                        font: 'inherit',
                        transition: 'border-color 120ms ease, background-color 120ms ease',
                        '&:hover': onOpenSourceMaterial
                          ? {
                              borderColor: LESSON_DIALOG_COLORS.blue,
                              backgroundColor: LESSON_DIALOG_COLORS.blue50,
                            }
                          : undefined,
                      }}
                    >
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          display: 'grid',
                          placeItems: 'center',
                          borderRadius: 1,
                          color: LESSON_DIALOG_COLORS.blue,
                          backgroundColor: LESSON_DIALOG_COLORS.blue50,
                          fontSize: 13,
                          fontWeight: 900,
                        }}
                      >
                        {source.sourceNumber}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            color: LESSON_DIALOG_COLORS.ink,
                            fontSize: 13,
                            fontWeight: 700,
                            lineHeight: 1.25,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {source.title}
                        </Typography>
                        <Typography sx={{ mt: 0.35, color: LESSON_DIALOG_COLORS.mute, fontSize: 11, fontWeight: 600 }}>
                          {(source.links?.length || 0) +
                            (source.youtubeUrls?.length || 0)} link(s) - {source.attachments?.length || 0} attachment(s)
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>

            <Box>
              <Typography
                sx={{
                  mb: 1.25,
                  color: LESSON_DIALOG_COLORS.mute,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  lineHeight: 1,
                  textTransform: 'uppercase',
                }}
              >
                Assets
              </Typography>

              <Box
                sx={{
                  p: 1.25,
                  borderRadius: 1.25,
                  border: `1px solid ${LESSON_DIALOG_COLORS.blue200}`,
                  backgroundColor: '#fff',
                }}
              >
                <Stack spacing={1.5}>
                  {hasAssets && (
                    <Box
                      sx={{
                        '& > *': {
                          borderRadius: 1.25,
                        },
                      }}
                    >
                      <LessonAttachments
                        attachments={allAssets}
                        onOpenSourceMaterial={onOpenSourceMaterial}
                        layout="list"
                        showTitle={false}
                      />
                    </Box>
                  )}

                  {hasAssets && (
                    <Box sx={{ height: 1, backgroundColor: LESSON_DIALOG_COLORS.blue100 }} />
                  )}

                  {assetError && <Alert severity="error">{assetError}</Alert>}
                  <TextField
                    placeholder="Link or YouTube URL"
                    value={assetUrl}
                    onChange={(event) => setAssetUrl(event.target.value)}
                    size="small"
                    fullWidth
                    disabled={!canManageCurrentLesson || isAddingAsset || isDeleting}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.25,
                        backgroundColor: '#fff',
                        '& fieldset': { borderColor: LESSON_DIALOG_COLORS.blue200 },
                        '&:hover fieldset': { borderColor: LESSON_DIALOG_COLORS.blue },
                        '&.Mui-focused fieldset': { borderColor: LESSON_DIALOG_COLORS.blue },
                      },
                      '& .MuiInputBase-input': {
                        fontSize: 13,
                      },
                    }}
                  />
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<LinkOutlinedIcon />}
                      onClick={handleAddUrlAsset}
                      disabled={!canManageCurrentLesson || isAddingAsset || isDeleting || !assetUrl.trim()}
                      sx={{
                        height: 32,
                        borderRadius: 999,
                        boxShadow: 'none',
                        backgroundColor: LESSON_DIALOG_COLORS.blue,
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        '&:hover': { backgroundColor: LESSON_DIALOG_COLORS.blue, boxShadow: 'none' },
                      }}
                    >
                      {isAddingAsset ? 'Adding...' : 'Add link'}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AttachFileOutlinedIcon />}
                      onClick={() => assetFileInputRef.current?.click()}
                      disabled={!canManageCurrentLesson || isAddingAsset || isDeleting}
                      sx={{
                        height: 32,
                        borderRadius: 999,
                        borderColor: LESSON_DIALOG_COLORS.blue200,
                        color: LESSON_DIALOG_COLORS.blue,
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        '&:hover': {
                          borderColor: LESSON_DIALOG_COLORS.blue,
                          backgroundColor: LESSON_DIALOG_COLORS.blue50,
                        },
                      }}
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
              </Box>
            </Box>

            <Box>
              <Typography
                sx={{
                  mb: 1.25,
                  color: LESSON_DIALOG_COLORS.mute,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  lineHeight: 1,
                  textTransform: 'uppercase',
                }}
              >
                Tags
              </Typography>

              <Box
                sx={{
                  p: 1.25,
                  borderRadius: 1.25,
                  border: `1px solid ${LESSON_DIALOG_COLORS.blue200}`,
                  backgroundColor: '#fff',
                }}
              >
                {isEditing ? (
                  <Autocomplete
                    multiple
                    freeSolo
                    options={suggestedLessonTags}
                    value={draftTags}
                    onChange={(_event, nextTags) => setDraftTags(normalizeLessonTagInput(nextTags))}
                    disabled={!canManageCurrentLesson || isSaving || isDeleting}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        alignItems: 'flex-start',
                        minHeight: 42,
                        p: 0.5,
                        borderRadius: 1.25,
                        color: LESSON_DIALOG_COLORS.ink,
                        backgroundColor: '#fff',
                        '& fieldset': { borderColor: 'transparent' },
                        '&:hover fieldset': { borderColor: 'transparent' },
                        '&.Mui-focused fieldset': { borderColor: LESSON_DIALOG_COLORS.blue },
                      },
                      '& .MuiInputBase-input': {
                        minWidth: '120px',
                        py: '7px !important',
                        color: LESSON_DIALOG_COLORS.ink,
                        fontSize: 13,
                      },
                      '& .MuiChip-root': {
                        height: 28,
                        borderRadius: 999,
                        color: LESSON_DIALOG_COLORS.blue,
                        backgroundColor: LESSON_DIALOG_COLORS.blue50,
                        fontSize: 12,
                        fontWeight: 700,
                      },
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder={draftTags.length > 0 ? 'Add a tag' : 'Add tags'}
                        size="small"
                      />
                    )}
                  />
                ) : visibleTags.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {visibleTags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        sx={{
                          height: 28,
                          borderRadius: 999,
                          color: LESSON_DIALOG_COLORS.blue,
                          backgroundColor: LESSON_DIALOG_COLORS.blue50,
                          fontSize: 12,
                          fontWeight: 700,
                          '& .MuiChip-label': { px: 1.25 },
                        }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography sx={{ color: LESSON_DIALOG_COLORS.mute, fontSize: 12, fontWeight: 600 }}>
                    No tags yet.
                  </Typography>
                )}
              </Box>
            </Box>

            {lesson.status !== 'failed' && (
              <DetailPanel
                title="Revise lesson"
                icon={<AutoAwesomeOutlinedIcon fontSize="small" />}
                accent={AI_DIGITAL_COLORS.pink}
              >
                <Stack spacing={1.5}>
                  <Box>
                    <Typography sx={{ color: LESSON_DIALOG_COLORS.slate, fontSize: 13, lineHeight: 1.45 }}>
                      Describe what exactly and how should change.
                    </Typography>
                  </Box>

                  {revisionError && <Alert severity="error">{revisionError}</Alert>}

                  <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
                    {revisionOptions.map((option) => {
                      const isSelected = selectedRevisionOptions.includes(option.value);

                      return (
                        <Chip
                          key={option.value}
                          label={option.label}
                          clickable
                          onClick={() => handleToggleRevisionOption(option.value)}
                          sx={{
                            height: 28,
                            borderRadius: 999,
                            border: `1px solid ${isSelected ? LESSON_DIALOG_COLORS.blue : LESSON_DIALOG_COLORS.blue200}`,
                            color: isSelected ? '#fff' : LESSON_DIALOG_COLORS.blue,
                            backgroundColor: isSelected ? LESSON_DIALOG_COLORS.blue : LESSON_DIALOG_COLORS.blue50,
                            fontSize: 12,
                            fontWeight: 700,
                            '& .MuiChip-label': { px: 1.25 },
                            '&:hover': {
                              backgroundColor: isSelected ? LESSON_DIALOG_COLORS.blue : '#fff',
                            },
                          }}
                        />
                      );
                    })}
                  </Stack>

                  <TextField
                    value={revisionRequest}
                    onChange={(event) => setRevisionRequest(event.target.value)}
                    minRows={4}
                    multiline
                    placeholder="Example: keep the factual content, but make the explanation less course-like and add one clear example for naming conventions."
                    fullWidth
                    disabled={!canManageCurrentLesson || isDeleting || isSaving || isRevising}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        backgroundColor: '#fff',
                        '& fieldset': { borderColor: LESSON_DIALOG_COLORS.blue200 },
                        '&:hover fieldset': { borderColor: LESSON_DIALOG_COLORS.blue },
                        '&.Mui-focused fieldset': { borderColor: LESSON_DIALOG_COLORS.blue },
                      },
                      '& .MuiInputBase-input': {
                        color: LESSON_DIALOG_COLORS.ink,
                        fontSize: 13,
                        lineHeight: 1.5,
                      },
                    }}
                  />

                  {lastRevision && (
                    <Box
                      sx={{
                        p: 1.25,
                        borderRadius: 1.25,
                        backgroundColor: LESSON_DIALOG_COLORS.blue50,
                        border: `1px solid ${LESSON_DIALOG_COLORS.blue100}`,
                      }}
                    >
                      <Typography sx={{ color: LESSON_DIALOG_COLORS.blue, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.5 }}>
                        Last revision
                      </Typography>
                      <Typography sx={{ color: LESSON_DIALOG_COLORS.mute, fontSize: 11, fontWeight: 700, mb: 0.5 }}>
                        {formatDateTime(lastRevision.revisedAt)} • {lastRevision.revisionBrief?.changeScope || 'substantial'}
                      </Typography>
                      {lastRevision.revisionRequest && (
                        <Typography sx={{ color: LESSON_DIALOG_COLORS.slate, fontSize: 12, lineHeight: 1.4 }}>
                          {lastRevision.revisionRequest}
                        </Typography>
                      )}
                    </Box>
                  )}

                  <Button
                    variant="contained"
                    startIcon={<AutoAwesomeOutlinedIcon />}
                    onClick={handleRevise}
                    disabled={!canManageCurrentLesson || isDeleting || isSaving || isRevising}
                    sx={{
                      alignSelf: 'flex-start',
                      minHeight: 36,
                      px: 2.25,
                      borderRadius: 999,
                      boxShadow: 'none',
                      backgroundColor: LESSON_DIALOG_COLORS.blue,
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      '&:hover': { backgroundColor: LESSON_DIALOG_COLORS.blue, boxShadow: 'none' },
                    }}
                  >
                    {isRevising ? 'Revising...' : 'Revise lesson'}
                  </Button>
                </Stack>
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
                    <Typography sx={{ color: LESSON_DIALOG_COLORS.slate, fontSize: 13, lineHeight: 1.45 }}>
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
                      disabled={!canManageCurrentLesson || isDeleting || isSaving || isRevising || isGeneratingActivity}
                      sx={{
                        borderRadius: 1.5,
                        fontSize: 13,
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: LESSON_DIALOG_COLORS.blue200 },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: LESSON_DIALOG_COLORS.blue },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: LESSON_DIALOG_COLORS.blue },
                      }}
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
                    disabled={!canManageCurrentLesson || isDeleting || isSaving || isPublishing || isArchiving || isRevising || isGeneratingActivity}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        '& fieldset': { borderColor: LESSON_DIALOG_COLORS.blue200 },
                        '&:hover fieldset': { borderColor: LESSON_DIALOG_COLORS.blue },
                        '&.Mui-focused fieldset': { borderColor: LESSON_DIALOG_COLORS.blue },
                      },
                      '& .MuiInputBase-input': { fontSize: 13 },
                      '& .MuiFormHelperText-root': {
                        color: LESSON_DIALOG_COLORS.mute,
                        fontSize: 11,
                        fontWeight: 600,
                        mx: 0,
                      },
                    }}
                  />

                  {activities.length > 0 && (
                    <Box
                      sx={{
                        p: 1.25,
                        borderRadius: 1.25,
                        backgroundColor: LESSON_DIALOG_COLORS.blue50,
                        border: `1px solid ${LESSON_DIALOG_COLORS.blue100}`,
                      }}
                    >
                      <Typography sx={{ color: LESSON_DIALOG_COLORS.blue, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.75 }}>
                        Saved activities
                      </Typography>
                      <Stack spacing={0.75}>
                        {activities.slice(0, 3).map((activity) => (
                          <Typography key={activity.id} sx={{ color: LESSON_DIALOG_COLORS.slate, fontSize: 12, fontWeight: 600 }}>
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
                    disabled={!canManageCurrentLesson || isDeleting || isSaving || isPublishing || isArchiving || isRevising || isGeneratingActivity}
                    sx={{
                      alignSelf: 'flex-start',
                      minHeight: 36,
                      px: 2.25,
                      borderRadius: 999,
                      boxShadow: 'none',
                      backgroundColor: LESSON_DIALOG_COLORS.blue,
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      '&:hover': { backgroundColor: LESSON_DIALOG_COLORS.blue, boxShadow: 'none' },
                    }}
                  >
                    {isGeneratingActivity ? 'Generating...' : 'Generate activity'}
                  </Button>
                </Stack>
              </DetailPanel>
            )}

            {isEditing && canGenerateTeacherVideo && lesson.status !== 'failed' && (
              <DetailPanel title="Teacher video">
                <Stack spacing={1.25}>
                  <Typography sx={{ color: LESSON_DIALOG_COLORS.slate, fontSize: 13, lineHeight: 1.45 }}>
                    Generate a short 45-60 second teacher avatar summary for this lesson.
                  </Typography>

                  {teacherVideoError && <Alert severity="error">{teacherVideoError}</Alert>}
                  {teacherVideoSuccess && <Alert severity="success">{teacherVideoSuccess}</Alert>}

                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: 1.25,
                      backgroundColor: LESSON_DIALOG_COLORS.blue50,
                      border: `1px solid ${LESSON_DIALOG_COLORS.blue100}`,
                    }}
                  >
                    <Typography sx={{ color: LESSON_DIALOG_COLORS.blue, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.5 }}>
                      Status
                    </Typography>
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                      {(isTeacherVideoActive || isCheckingTeacherVideo) && (
                        <CircularProgress size={14} thickness={5} sx={{ color: LESSON_DIALOG_COLORS.blue }} />
                      )}
                      <Typography sx={{ color: LESSON_DIALOG_COLORS.slate, fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>
                        {isCheckingTeacherVideo
                          ? 'Checking status...'
                          : isTeacherVideoActive
                            ? `${teacherVideoStatusLabel}...`
                            : teacherVideoStatusLabel}
                      </Typography>
                    </Stack>
                    {isTeacherVideoActive && (
                      <Typography sx={{ mt: 0.5, color: LESSON_DIALOG_COLORS.mute, fontSize: 11, fontWeight: 600, lineHeight: 1.35 }}>
                        Rendering can take a few minutes. You can close this lesson and come back later.
                      </Typography>
                    )}
                    {teacherVideo.duration && (
                      <Typography sx={{ mt: 0.35, color: LESSON_DIALOG_COLORS.mute, fontSize: 11, fontWeight: 600 }}>
                        Duration: {Math.round(teacherVideo.duration)} sec
                      </Typography>
                    )}
                    {teacherVideo.videoUrl && (
                      <Button
                        href={teacherVideo.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        size="small"
                        sx={{
                          mt: 1,
                          minHeight: 28,
                          px: 1.25,
                          borderRadius: 999,
                          color: LESSON_DIALOG_COLORS.blue,
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Open video
                      </Button>
                    )}
                  </Box>

                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      startIcon={<OndemandVideoOutlinedIcon />}
                      onClick={handleGenerateTeacherVideo}
                      disabled={
                        !canGenerateTeacherVideo ||
                        !canManageCurrentLesson ||
                        isDeleting ||
                        isSaving ||
                        isPublishing ||
                        isArchiving ||
                        isRevising ||
                        isGeneratingActivity ||
                        isGeneratingTeacherVideo ||
                        isTeacherVideoActive
                      }
                      sx={{
                        minHeight: 36,
                        px: 2.25,
                        borderRadius: 999,
                        boxShadow: 'none',
                        backgroundColor: LESSON_DIALOG_COLORS.blue,
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        '&:hover': { backgroundColor: LESSON_DIALOG_COLORS.blue, boxShadow: 'none' },
                      }}
                    >
                      {isGeneratingTeacherVideo
                        ? 'Starting...'
                        : teacherVideo.videoId
                          ? 'Regenerate video'
                          : 'Generate video'}
                    </Button>

                    {teacherVideo.videoId && (
                      <Button
                        variant="outlined"
                        onClick={handleRefreshTeacherVideo}
                        disabled={isCheckingTeacherVideo || isGeneratingTeacherVideo}
                        sx={lessonSecondaryButtonSx}
                      >
                        Refresh
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </DetailPanel>
            )}
            </Stack>
          )}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, md: 3.5 },
          py: 1.75,
          flex: '0 0 auto',
          gap: 1,
          flexWrap: 'wrap',
          borderTop: `1px solid ${LESSON_DIALOG_COLORS.blue100}`,
          backgroundColor: '#fff',
        }}
      >
        {isEditing && (
          <Stack direction="row" spacing={1} useFlexGap sx={{ mr: 'auto', flexWrap: 'wrap' }}>
            <Button
              onClick={() => {
                if (isLessonArchived) {
                  handleRestore();
                  return;
                }

                setArchiveError('');
                setIsConfirmArchiveOpen(true);
              }}
              variant="outlined"
              startIcon={isLessonArchived ? <UnarchiveOutlinedIcon /> : <ArchiveOutlinedIcon />}
              disabled={!canManageCurrentLesson || (isLessonArchived && lesson.status !== 'ready') || isSaving || isPublishing || isArchiving || isDeleting || isRevising || isGeneratingActivity || isSavingActivity || isUploadingCover}
              sx={lessonSecondaryButtonSx}
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
              variant="outlined"
              startIcon={<DeleteOutlineOutlinedIcon />}
              disabled={!canManageCurrentLesson || isSaving || isPublishing || isArchiving || isDeleting || isRevising || isGeneratingActivity || isSavingActivity || isUploadingCover}
              sx={lessonDangerButtonSx}
            >
              Delete lesson
            </Button>
          </Stack>
        )}

        {activeView !== 'lesson' && canManageCurrentLesson ? (
          <Button
            onClick={handleSaveActivity}
            variant="contained"
            startIcon={<SaveOutlinedIcon />}
            disabled={!canManageCurrentLesson || isDeleting || isSaving || isPublishing || isArchiving || isRevising || isGeneratingActivity || isSavingActivity || isUploadingCover}
            sx={lessonPrimaryButtonSx}
          >
            {isSavingActivity ? 'Saving activity...' : 'Save activity'}
          </Button>
        ) : isEditing ? (
          <>
            <Button
              onClick={handleCancelEdit}
              variant="outlined"
              disabled={isSaving || isPublishing || isArchiving || isDeleting || isGeneratingActivity || isSavingActivity || isUploadingCover}
              sx={lessonSecondaryButtonSx}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              startIcon={<SaveOutlinedIcon />}
              disabled={!canManageCurrentLesson || isSaving || isPublishing || isArchiving || isDeleting || isRevising || isGeneratingActivity || isSavingActivity || isUploadingCover}
              sx={lessonPrimaryButtonSx}
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
                  startIcon={<RocketLaunchOutlinedIcon />}
                  disabled={!canManageCurrentLesson || isDeleting || isSaving || isPublishing || isArchiving || isRevising || isGeneratingActivity || isSavingActivity || isUploadingCover}
                  sx={lessonDarkButtonSx}
                >
                  {isPublishing ? 'Publishing...' : 'Publish lesson'}
                </Button>
              )}
              <Button
                onClick={() => setIsEditing(true)}
                variant="contained"
                startIcon={<EditOutlinedIcon />}
                disabled={!canManageCurrentLesson || isDeleting || isSaving || isPublishing || isArchiving || isRevising || isGeneratingActivity || isSavingActivity || isUploadingCover}
                sx={lessonPrimaryButtonSx}
              >
                Edit lesson
              </Button>
            </>
          )
        )}
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
