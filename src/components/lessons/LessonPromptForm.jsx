'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { useTaskTray } from '../providers/TaskTrayProvider';
import { SimpleEditor } from '../tiptap/tiptap-templates/simple/simple-editor';
import { normalizeLessonTagInput, suggestedLessonTags } from '../../lib/lessonTags';

const FORM_COLORS = {
  blue: '#0009DC',
  ink: '#0B0B0B',
  slate: '#33344A',
  mute: '#80808E',
  blue50: '#F5F5FE',
  blue100: '#E3E5FF',
  blue200: '#CBD0FF',
  bg2: '#F9F9F9',
  bg3: '#F2F1F3',
};

const depthOptions = [
  { value: 'intro', label: 'Intro' },
  { value: 'standard', label: 'Standard' },
  { value: 'deep', label: 'Deep' },
];

const toneOptions = [
  { value: 'clear', label: 'Clear' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'course-like', label: 'Course-like' },
];

const formatOptions = [
  { value: 'structured theoretical lesson', label: 'Structured Lesson' },
  { value: 'course article', label: 'Course Article' },
  { value: 'internal wiki page', label: 'Internal Wiki Page' },
];

const sectionLabelSx = {
  color: FORM_COLORS.mute,
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '0.08em',
  lineHeight: 1,
  textTransform: 'uppercase',
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 1.5,
    backgroundColor: '#fff',
    '& fieldset': { borderColor: FORM_COLORS.blue100, borderWidth: 1.5 },
    '&:hover fieldset': { borderColor: FORM_COLORS.blue200 },
    '&.Mui-focused fieldset': { borderColor: FORM_COLORS.blue },
  },
  '& .MuiInputLabel-root': {
    color: FORM_COLORS.mute,
    fontSize: 13,
    fontWeight: 700,
  },
  '& .MuiInputBase-input': {
    color: FORM_COLORS.ink,
    fontSize: 14,
  },
  '& .MuiFormHelperText-root': {
    mx: 0,
    color: FORM_COLORS.mute,
    fontSize: 11,
  },
};

function SectionLabel({ children, optional = false }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mb: 1.25 }}>
      <Typography sx={sectionLabelSx}>{children}</Typography>
      {optional && (
        <Typography sx={{ color: FORM_COLORS.mute, fontSize: 11, fontWeight: 600 }}>
          optional
        </Typography>
      )}
    </Stack>
  );
}

function FieldGroup({ label, hint, optional, children }) {
  return (
    <Box>
      <SectionLabel optional={optional}>{label}</SectionLabel>
      {children}
      {hint && (
        <Typography sx={{ mt: 0.75, color: FORM_COLORS.mute, fontSize: 11, lineHeight: 1.4 }}>
          {hint}
        </Typography>
      )}
    </Box>
  );
}

export default function LessonPromptForm({
  materials = [],
  onLessonGenerated,
  onLessonGenerationStarted,
}) {
  const { addTask, updateTask } = useTaskTray();
  const [mode, setMode] = useState('ai');
  const [selectedMaterialIds, setSelectedMaterialIds] = useState([]);
  const [materialQuery, setMaterialQuery] = useState('');
  const [userInstructions, setUserInstructions] = useState('');
  const [depth, setDepth] = useState('standard');
  const [tone, setTone] = useState('clear');
  const [desiredFormat, setDesiredFormat] = useState('structured theoretical lesson');
  const [tags, setTags] = useState([]);
  const [manualTitle, setManualTitle] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualContentHtml, setManualContentHtml] = useState('<h1>Lesson title</h1><p>Start writing the lesson here.</p>');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAction, setSubmitAction] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const selectedMaterials = useMemo(() => {
    const selectedIds = new Set(selectedMaterialIds);

    return materials.filter((material) => selectedIds.has(material.id));
  }, [materials, selectedMaterialIds]);

  const filteredMaterials = useMemo(() => {
    const normalizedQuery = materialQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return materials;
    }

    return materials.filter((material) => {
      const searchableText = [
        material.title,
        material.description,
        ...(Array.isArray(material.tags) ? material.tags : []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [materialQuery, materials]);

  const canSubmit = selectedMaterialIds.length > 0 || userInstructions.trim().length > 0;
  const canSubmitManual = manualTitle.trim().length > 0 &&
    manualContentHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length > 0;

  const handleMaterialToggle = (materialId) => {
    setSelectedMaterialIds((prev) => {
      if (prev.includes(materialId)) {
        return prev.filter((id) => id !== materialId);
      }

      return [...prev, materialId];
    });
  };

  const submitLessonRequest = async (action) => {
    setStatusMessage('');
    setErrorMessage('');

    if (!canSubmit) {
      setErrorMessage('Select at least one material or describe what the lesson should be about.');
      return;
    }

    let taskId = null;

    try {
      setIsSubmitting(true);
      setSubmitAction(action);
      taskId = action === 'generate'
        ? addTask({
            title: 'Generating lesson',
            description: selectedMaterials.length
              ? `Preparing ${selectedMaterials.length} source material(s)...`
              : 'Preparing prompt instructions...',
          })
        : null;

      if (action === 'generate') {
        onLessonGenerationStarted?.();
        updateTask(taskId, {
          description: 'Generating lesson with AI...',
        });
      }

      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          materialIds: selectedMaterialIds,
          userInstructions,
          depth,
          tone,
          desiredFormat,
          tags,
        }),
      });

      const responseText = await response.text();
      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = {
          error: responseText,
        };
      }

      if (!response.ok) {
        const fallbackMessage =
          action === 'generate'
            ? 'Failed to generate lesson.'
            : 'Failed to build prompt.';
        const statusPrefix = response.status ? `HTTP ${response.status}` : 'Request failed';
        const detail = typeof data.error === 'string' && data.error.trim()
          ? data.error.trim()
          : fallbackMessage;
        const requestError = new Error(`${statusPrefix}: ${detail}`);

        requestError.lesson = data.lesson || null;

        throw requestError;
      }

      console.group('Theoretical lesson prompt');
      console.log('Prompt version:', data.prompt.version);
      console.log('Prompt cache key:', data.prompt.cacheKey);
      console.log('Instructions first:', data.prompt.instructions);
      console.log('Dynamic input second:', data.prompt.input);
      console.log('Legacy messages preview:', data.prompt.messages);
      console.log('Prepared materials:', data.preparedMaterials);
      if (data.lesson) {
        console.log('Lesson:', data.lesson);
        console.log('Generated lesson HTML:', data.lesson.contentHtml);
      }
      console.log('Full response:', data);
      console.groupEnd();

      setStatusMessage(
        action === 'generate'
          ? 'Lesson generated and saved.'
          : 'Prompt built successfully. Check the browser console.'
      );

      if (action === 'generate' && data.lesson && onLessonGenerated) {
        updateTask(taskId, {
          description: 'Refreshing lesson library...',
        });
        await onLessonGenerated(data.lesson);
        updateTask(taskId, {
          status: 'success',
          description: data.lesson.title
            ? `Lesson ready: ${data.lesson.title}`
            : 'Lesson generated successfully.',
        });
      }
    } catch (error) {
      console.error('Lesson request failed:', error);
      setErrorMessage(error.message || 'Lesson request failed.');
      if (action === 'generate' && error.lesson && onLessonGenerated) {
        await onLessonGenerated(error.lesson);
      }
      if (action === 'generate') {
        updateTask(taskId, {
          status: 'error',
          description: error.message || 'Lesson generation failed.',
        });
      }
    } finally {
      setIsSubmitting(false);
      setSubmitAction('');
    }
  };

  const submitManualLesson = async () => {
    setStatusMessage('');
    setErrorMessage('');

    if (!canSubmitManual) {
      setErrorMessage('Add a title and lesson content before saving.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitAction('create-manual');

      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create-manual',
          title: manualTitle,
          description: manualDescription,
          contentHtml: manualContentHtml,
          tags,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create lesson.');
      }

      setStatusMessage('Lesson created successfully.');
      setManualTitle('');
      setManualDescription('');
      setManualContentHtml('<h1>Lesson title</h1><p>Start writing the lesson here.</p>');
      setTags([]);

      if (data.lesson && onLessonGenerated) {
        await onLessonGenerated(data.lesson);
      }
    } catch (error) {
      console.error('Manual lesson creation failed:', error);
      setErrorMessage(error.message || 'Manual lesson creation failed.');
    } finally {
      setIsSubmitting(false);
      setSubmitAction('');
    }
  };

  const handleGenerateLesson = (event) => {
    event.preventDefault();
    if (mode === 'manual') {
      submitManualLesson();
      return;
    }

    submitLessonRequest('generate');
  };

  return (
    <Paper
      component="form"
      elevation={0}
      onSubmit={handleGenerateLesson}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        maxHeight: { xs: 'calc(100vh - 128px)', md: 'calc(100vh - 112px)' },
        borderRadius: 0,
        backgroundColor: '#fff',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ px: { xs: 2.5, md: 5 }, pt: { xs: 3, md: 4 }, pb: 3 }}>
        <Typography
          component="h2"
          sx={{
            color: FORM_COLORS.ink,
            fontFamily: '"Barlow Semi Condensed", Inter, Arial, sans-serif',
            fontSize: { xs: 34, md: 44 },
            fontWeight: 900,
            letterSpacing: 0,
            lineHeight: 0.95,
          }}
        >
          Create lesson
        </Typography>
        <Typography sx={{ mt: 1, color: FORM_COLORS.mute, fontSize: 14, lineHeight: 1.45 }}>
          Generate a lesson with AI, or paste a ready lesson without AI changes.
        </Typography>

        <Box
          sx={{
            mt: 2.5,
            display: 'inline-flex',
            p: 0.5,
            borderRadius: 999,
            backgroundColor: FORM_COLORS.bg3,
          }}
        >
          {[
            { value: 'ai', label: 'Generate with AI' },
            { value: 'manual', label: 'Ready lesson' },
          ].map((tab) => {
            const isActive = mode === tab.value;

            return (
              <Button
                key={tab.value}
                type="button"
                onClick={() => {
                  setMode(tab.value);
                  setStatusMessage('');
                  setErrorMessage('');
                }}
                sx={{
                  minHeight: 34,
                  px: 2.25,
                  borderRadius: 999,
                  color: isActive ? FORM_COLORS.blue : FORM_COLORS.slate,
                  backgroundColor: isActive ? '#fff' : 'transparent',
                  boxShadow: isActive ? '0 1px 4px rgba(11, 11, 11, 0.08)' : 'none',
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                    boxShadow: isActive ? '0 1px 4px rgba(11, 11, 11, 0.08)' : 'none',
                  },
                }}
              >
                {tab.label}
              </Button>
            );
          })}
        </Box>
      </Box>

      <Stack
        spacing={3.25}
        sx={{
          flex: '1 1 auto',
          minHeight: 0,
          overflow: 'auto',
          px: { xs: 2.5, md: 5 },
          pb: 3,
        }}
      >
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        {statusMessage && <Alert severity="success">{statusMessage}</Alert>}

        {mode === 'manual' ? (
          <Stack spacing={2.5}>
            <FieldGroup label="Lesson title">
              <TextField
                value={manualTitle}
                onChange={(event) => setManualTitle(event.target.value)}
                placeholder="e.g. Performance Max Campaign Setup"
                fullWidth
                required
                sx={fieldSx}
              />
            </FieldGroup>

            <FieldGroup label="Description" optional hint="Short summary shown on lesson cards.">
              <TextField
                value={manualDescription}
                onChange={(event) => setManualDescription(event.target.value)}
                placeholder="Short summary shown on lesson cards."
                fullWidth
                multiline
                minRows={2}
                sx={fieldSx}
              />
            </FieldGroup>

            <FieldGroup label="Tags" optional hint="Optional categories for filtering and scanning lessons.">
              <Autocomplete
                multiple
                freeSolo
                options={suggestedLessonTags}
                value={tags}
                onChange={(_event, nextTags) => setTags(normalizeLessonTagInput(nextTags))}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Type a tag and press Enter"
                    sx={fieldSx}
                  />
                )}
              />
            </FieldGroup>

            <FieldGroup label="Lesson content" hint="Paste or write. Headings, lists and rich formatting are preserved.">
              <Box
                sx={{
                  height: { xs: 500, md: 600 },
                  border: `1.5px solid ${FORM_COLORS.blue100}`,
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  backgroundColor: '#fff',
                }}
              >
                <SimpleEditor
                  content={manualContentHtml}
                  editable
                  onChange={(nextHtml) => setManualContentHtml(nextHtml)}
                  className="manual-lesson-editor"
                />
              </Box>
            </FieldGroup>
          </Stack>
        ) : (
          <>
            <Box>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', mb: 1.5 }}
              >
                <SectionLabel optional>Source materials</SectionLabel>
                <Chip
                  label={`${selectedMaterials.length} selected`}
                  onDelete={selectedMaterials.length > 0 ? () => setSelectedMaterialIds([]) : undefined}
                  sx={{
                    alignSelf: { xs: 'flex-start', sm: 'center' },
                    height: 26,
                    borderRadius: 999,
                    color: selectedMaterials.length > 0 ? '#fff' : FORM_COLORS.mute,
                    backgroundColor: selectedMaterials.length > 0 ? FORM_COLORS.blue : FORM_COLORS.bg3,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    '& .MuiChip-deleteIcon': {
                      color: 'rgba(255,255,255,0.75)',
                      fontSize: 16,
                      '&:hover': { color: '#fff' },
                    },
                  }}
                />
              </Stack>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 1.5,
                  px: 1.75,
                  py: 1.125,
                  borderRadius: 999,
                  border: `1px solid ${FORM_COLORS.blue100}`,
                  backgroundColor: FORM_COLORS.bg2,
                }}
              >
                <SearchOutlinedIcon sx={{ color: FORM_COLORS.mute, fontSize: 18 }} />
                <Box
                  component="input"
                  value={materialQuery}
                  onChange={(event) => setMaterialQuery(event.target.value)}
                  placeholder="Search materials by title..."
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    border: 0,
                    outline: 0,
                    backgroundColor: 'transparent',
                    color: FORM_COLORS.ink,
                    font: 'inherit',
                    fontSize: 13,
                  }}
                />
                <Typography sx={{ color: FORM_COLORS.mute, fontSize: 11, whiteSpace: 'nowrap' }}>
                  {filteredMaterials.length} of {materials.length}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: 'repeat(2, minmax(0, 1fr))',
                  },
                  gap: 1.25,
                }}
              >
                {filteredMaterials.map((material) => {
                  const isSelected = selectedMaterialIds.includes(material.id);

                  return (
                    <Paper
                      key={material.id}
                      component="button"
                      type="button"
                      elevation={0}
                      onClick={() => handleMaterialToggle(material.id)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        width: '100%',
                        minHeight: 82,
                        px: 2,
                        py: 1.5,
                        borderRadius: 1.5,
                        border: `1.5px solid ${isSelected ? FORM_COLORS.blue : FORM_COLORS.blue100}`,
                        backgroundColor: isSelected ? FORM_COLORS.blue50 : '#fff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 120ms ease, border-color 120ms ease',
                        '&:hover': {
                          borderColor: isSelected ? FORM_COLORS.blue : FORM_COLORS.blue200,
                          backgroundColor: isSelected ? FORM_COLORS.blue50 : FORM_COLORS.bg2,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 18,
                          height: 18,
                          flex: '0 0 auto',
                          borderRadius: '5px',
                          border: isSelected ? 'none' : `1.5px solid ${FORM_COLORS.blue200}`,
                          backgroundColor: isSelected ? FORM_COLORS.blue : '#fff',
                          color: '#fff',
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        {isSelected && <CheckOutlinedIcon sx={{ fontSize: 13 }} />}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            color: FORM_COLORS.ink,
                            fontSize: 13,
                            fontWeight: 800,
                            lineHeight: 1.3,
                            display: '-webkit-box',
                            overflow: 'hidden',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {material.title}
                        </Typography>
                        {material.description && (
                          <Typography
                            sx={{
                              mt: 0.25,
                              color: FORM_COLORS.mute,
                              fontSize: 12,
                              lineHeight: 1.35,
                              display: '-webkit-box',
                              overflow: 'hidden',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {material.description}
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            </Box>

            <FieldGroup label="Extra instructions" optional hint="Tell the model anything specific: tone, examples to keep, things to skip.">
              <TextField
                value={userInstructions}
                onChange={(event) => setUserInstructions(event.target.value)}
                placeholder="e.g. Keep the explanation beginner-friendly, expand examples for new joiners..."
                minRows={3}
                multiline
                fullWidth
                sx={fieldSx}
              />
            </FieldGroup>

            <FieldGroup label="Tags" optional hint="Optional categories for filtering and scanning lessons.">
              <Autocomplete
                multiple
                freeSolo
                options={suggestedLessonTags}
                value={tags}
                onChange={(_event, nextTags) => setTags(normalizeLessonTagInput(nextTags))}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Type a tag and press Enter"
                    sx={fieldSx}
                  />
                )}
              />
            </FieldGroup>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                gap: 1.75,
              }}
            >
              <FieldGroup label="Depth">
                <FormControl fullWidth sx={fieldSx}>
                  <Select
                    value={depth}
                    inputProps={{ 'aria-label': 'Depth' }}
                    onChange={(event) => setDepth(event.target.value)}
                  >
                    {depthOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </FieldGroup>

              <FieldGroup label="Tone">
                <FormControl fullWidth sx={fieldSx}>
                  <Select
                    value={tone}
                    inputProps={{ 'aria-label': 'Tone' }}
                    onChange={(event) => setTone(event.target.value)}
                  >
                    {toneOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </FieldGroup>

              <FieldGroup label="Format">
                <FormControl fullWidth sx={fieldSx}>
                  <Select
                    value={desiredFormat}
                    inputProps={{ 'aria-label': 'Format' }}
                    onChange={(event) => setDesiredFormat(event.target.value)}
                  >
                    {formatOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </FieldGroup>
            </Box>
          </>
        )}
      </Stack>

      <Box
        sx={{
          flex: '0 0 auto',
          px: { xs: 2.5, md: 3.5 },
          py: 1.75,
          borderTop: `1px solid ${FORM_COLORS.blue100}`,
          backgroundColor: FORM_COLORS.bg2,
          display: 'flex',
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 1.5,
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: FORM_COLORS.mute }}>
          <InfoOutlinedIcon sx={{ fontSize: 15 }} />
          <Typography sx={{ color: 'inherit', fontSize: 12, lineHeight: 1.35 }}>
            {mode === 'ai'
              ? `${selectedMaterials.length} source${selectedMaterials.length === 1 ? '' : 's'} selected`
              : 'Saved directly, no AI processing'}
          </Typography>
        </Stack>

        <Button
          type="submit"
          variant="contained"
          startIcon={mode === 'ai' ? <AutoAwesomeOutlinedIcon /> : undefined}
          disabled={isSubmitting || (mode === 'manual' ? !canSubmitManual : !canSubmit)}
          sx={{
            alignSelf: { xs: 'stretch', sm: 'center' },
            minHeight: 42,
            px: 2.75,
            borderRadius: 999,
            backgroundColor: FORM_COLORS.blue,
            boxShadow: 'none',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            '&:hover': {
              backgroundColor: FORM_COLORS.blue,
              boxShadow: 'none',
            },
          }}
        >
          {mode === 'manual'
            ? isSubmitting && submitAction === 'create-manual'
              ? 'Creating...'
              : 'Create lesson'
            : isSubmitting && submitAction === 'generate'
              ? 'Generating...'
              : 'Generate lesson'}
        </Button>
      </Box>
    </Paper>
  );
}
