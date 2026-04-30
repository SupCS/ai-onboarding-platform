'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTaskTray } from '../providers/TaskTrayProvider';
import { SimpleEditor } from '../tiptap/tiptap-templates/simple/simple-editor';

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

export default function LessonPromptForm({
  materials = [],
  onLessonGenerated,
  onLessonGenerationStarted,
}) {
  const { addTask, updateTask } = useTaskTray();
  const [mode, setMode] = useState('ai');
  const [selectedMaterialIds, setSelectedMaterialIds] = useState([]);
  const [userInstructions, setUserInstructions] = useState('');
  const [depth, setDepth] = useState('standard');
  const [tone, setTone] = useState('clear');
  const [desiredFormat, setDesiredFormat] = useState('structured theoretical lesson');
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to build prompt.');
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
        p: 3,
        borderRadius: 4,
        border: '1px solid #e5e7eb',
        backgroundColor: '#fff',
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.75 }}>
            Create lesson
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generate a lesson with AI, or paste/write a ready lesson without AI changes.
          </Typography>
        </Box>

        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_event, nextMode) => {
            if (nextMode) {
              setMode(nextMode);
              setStatusMessage('');
              setErrorMessage('');
            }
          }}
          color="primary"
          sx={{
            alignSelf: 'flex-start',
            '& .MuiToggleButton-root': {
              px: 2,
              textTransform: 'none',
              fontWeight: 850,
            },
          }}
        >
          <ToggleButton value="ai">Generate with AI</ToggleButton>
          <ToggleButton value="manual">Ready lesson</ToggleButton>
        </ToggleButtonGroup>

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        {statusMessage && <Alert severity="success">{statusMessage}</Alert>}

        {mode === 'manual' ? (
          <Stack spacing={2}>
            <TextField
              label="Title"
              value={manualTitle}
              onChange={(event) => setManualTitle(event.target.value)}
              fullWidth
              required
            />

            <TextField
              label="Description"
              value={manualDescription}
              onChange={(event) => setManualDescription(event.target.value)}
              placeholder="Short summary shown on lesson cards."
              fullWidth
              multiline
              minRows={2}
            />

            <Box
              sx={{
                height: { xs: 520, md: 620 },
                border: '1px solid #e5e7eb',
                borderRadius: 3,
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

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isSubmitting || !canSubmitManual}
              sx={{ alignSelf: 'flex-start' }}
            >
              {isSubmitting && submitAction === 'create-manual'
                ? 'Creating lesson...'
                : 'Create ready lesson'}
            </Button>
          </Stack>
        ) : (
          <>
        <Stack spacing={1.5}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Source materials optional
          </Typography>

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
            {materials.map((material) => (
              <Paper
                key={material.id}
                elevation={0}
                sx={{
                  px: 1.5,
                  py: 1,
                  borderRadius: 3,
                  border: '1px solid #eef2f7',
                  backgroundColor: selectedMaterialIds.includes(material.id)
                    ? '#eff6ff'
                    : '#f8fafc',
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedMaterialIds.includes(material.id)}
                      onChange={() => handleMaterialToggle(material.id)}
                    />
                  }
                  label={
                    <Box component="span" sx={{ display: 'block', minWidth: 0 }}>
                      <Typography
                        component="span"
                        variant="body2"
                        sx={{ display: 'block', fontWeight: 700 }}
                      >
                        {material.title}
                      </Typography>
                      {material.description && (
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                          sx={{
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
                  }
                  sx={{ alignItems: 'flex-start', m: 0, width: '100%' }}
                />
              </Paper>
            ))}
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Chip label={`${selectedMaterials.length} selected`} />
          {selectedMaterials.slice(0, 4).map((material) => (
            <Chip key={material.id} label={material.title} variant="outlined" />
          ))}
        </Stack>

        <TextField
          label="Extra instructions"
          value={userInstructions}
          onChange={(event) => setUserInstructions(event.target.value)}
          placeholder="Example: create a beginner-friendly lesson about Google Ads match types. Explain abbreviations and keep it concise..."
          minRows={4}
          multiline
          fullWidth
        />

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ alignItems: 'stretch' }}
        >
          <FormControl fullWidth>
            <InputLabel id="lesson-depth-label">Depth</InputLabel>
            <Select
              labelId="lesson-depth-label"
              value={depth}
              label="Depth"
              onChange={(event) => setDepth(event.target.value)}
            >
              {depthOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="lesson-tone-label">Tone</InputLabel>
            <Select
              labelId="lesson-tone-label"
              value={tone}
              label="Tone"
              onChange={(event) => setTone(event.target.value)}
            >
              {toneOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="lesson-format-label">Format</InputLabel>
            <Select
              labelId="lesson-format-label"
              value={desiredFormat}
              label="Format"
              onChange={(event) => setDesiredFormat(event.target.value)}
            >
              {formatOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isSubmitting || !canSubmit}
            >
              {isSubmitting && submitAction === 'generate'
                ? 'Generating lesson...'
                : 'Generate lesson'}
            </Button>
          </Stack>
        </Box>
          </>
        )}
      </Stack>
    </Paper>
  );
}
