'use client';

import { useEffect, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
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
};

const sectionLabelSx = {
  mb: 1.25,
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

const actionButtonSx = {
  minHeight: 40,
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

const acceptedFileTypes = [
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
].join(',');

const youtubeChipSx = {
  height: 28,
  borderRadius: 999,
  color: FORM_COLORS.blue,
  fontSize: 12,
  fontWeight: 700,
  border: `1px solid ${FORM_COLORS.blue100}`,
  backgroundColor: FORM_COLORS.blue50,
  '& .MuiChip-label': {
    px: 1.25,
  },
  '& .MuiChip-deleteIcon': {
    color: FORM_COLORS.blue,
  },
  '& .MuiChip-deleteIcon:hover': {
    color: FORM_COLORS.ink,
  },
};

function SectionLabel({ children }) {
  return <Typography sx={sectionLabelSx}>{children}</Typography>;
}

function buildInitialForm(material) {
  return {
    title: material?.title || '',
    description: material?.description || '',
    youtubeInput: '',
    youtubeUrls: material?.youtubeUrls || [],
    links: (material?.links || []).join('\n'),
    text: material?.text || '',
    tags: normalizeLessonTagInput(material?.tags || []),
    existingAttachments: material?.attachments || [],
    newAttachments: [],
  };
}

function isValidYoutubeUrl(url) {
  if (!url.trim()) {
    return false;
  }

  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url.trim());
}

function getYoutubeCandidates(rawValue) {
  return rawValue
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function UploadMaterialDialog({
  open,
  onClose,
  onSave,
  isSaving = false,
  mode = 'create',
  initialMaterial = null,
  resetKey = 0,
}) {
  const [form, setForm] = useState(buildInitialForm(initialMaterial));
  const [errors, setErrors] = useState({});

  const isEditMode = mode === 'edit';

  useEffect(() => {
    setForm(buildInitialForm(initialMaterial));
    setErrors({});
  }, [initialMaterial, resetKey]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: '',
      content: '',
    }));
  };

  const handleTagsChange = (_event, nextTags) => {
    setForm((prev) => ({
      ...prev,
      tags: normalizeLessonTagInput(nextTags),
    }));
  };

  const commitYoutubeInput = (rawValue, existingUrls = form.youtubeUrls) => {
    const candidates = getYoutubeCandidates(rawValue);

    if (candidates.length === 0) {
      return {
        nextYoutubeUrls: existingUrls,
        hasError: false,
      };
    }

    const invalidCandidate = candidates.find((item) => !isValidYoutubeUrl(item));

    if (invalidCandidate) {
      setErrors((prev) => ({
        ...prev,
        youtubeInput: 'Only valid YouTube links are allowed here.',
      }));

      return {
        nextYoutubeUrls: existingUrls,
        hasError: true,
      };
    }

    const uniqueCandidates = candidates.filter(
      (item) => !existingUrls.includes(item)
    );

    if (uniqueCandidates.length === 0) {
      setErrors((prev) => ({
        ...prev,
        youtubeInput: 'This YouTube link is already added.',
      }));

      return {
        nextYoutubeUrls: existingUrls,
        hasError: true,
      };
    }

    const nextYoutubeUrls = [...existingUrls, ...uniqueCandidates];

    setForm((prev) => ({
      ...prev,
      youtubeInput: '',
      youtubeUrls: nextYoutubeUrls,
    }));

    setErrors((prev) => ({
      ...prev,
      youtubeInput: '',
      content: '',
    }));

    return {
      nextYoutubeUrls,
      hasError: false,
    };
  };

  const handleYoutubeInputChange = (event) => {
    const value = event.target.value;

    setForm((prev) => ({
      ...prev,
      youtubeInput: value,
    }));

    setErrors((prev) => ({
      ...prev,
      youtubeInput: '',
      content: '',
    }));

    if (/\s$/.test(value) || /[\r\n]/.test(value)) {
      commitYoutubeInput(value);
    }
  };

  const handleYoutubeKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    commitYoutubeInput(form.youtubeInput);
  };

  const handleYoutubeBlur = () => {
    commitYoutubeInput(form.youtubeInput);
  };

  const handleRemoveYoutubeUrl = (urlToRemove) => {
    setForm((prev) => ({
      ...prev,
      youtubeUrls: prev.youtubeUrls.filter((url) => url !== urlToRemove),
    }));
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    setForm((prev) => ({
      ...prev,
      newAttachments: [...prev.newAttachments, ...selectedFiles],
    }));

    setErrors((prev) => ({
      ...prev,
      attachments: '',
      content: '',
    }));

    event.target.value = '';
  };

  const handleRemoveExistingAttachment = (storageKey) => {
    setForm((prev) => ({
      ...prev,
      existingAttachments: prev.existingAttachments.filter(
        (attachment) => attachment.storageKey !== storageKey
      ),
    }));
  };

  const handleRemoveNewAttachment = (fileToRemove) => {
    setForm((prev) => ({
      ...prev,
      newAttachments: prev.newAttachments.filter((file) => file !== fileToRemove),
    }));
  };

  const validateForm = (formToValidate = form) => {
    const nextErrors = {};

    if (!formToValidate.title.trim()) {
      nextErrors.title = 'Title is required.';
    }

    const hasAnyContent = Boolean(
      formToValidate.youtubeUrls.length > 0 ||
        formToValidate.links.trim() ||
        formToValidate.text.trim() ||
        formToValidate.existingAttachments.length > 0 ||
        formToValidate.newAttachments.length > 0
    );

    if (!hasAnyContent) {
      nextErrors.content = 'Add at least one content source.';
    }

    if (
      formToValidate.youtubeInput.trim() &&
      getYoutubeCandidates(formToValidate.youtubeInput).some(
        (item) => !isValidYoutubeUrl(item)
      )
    ) {
      nextErrors.youtubeInput = 'Only valid YouTube links are allowed here.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    const { nextYoutubeUrls, hasError } = commitYoutubeInput(form.youtubeInput);

    if (hasError) {
      return;
    }

    const nextForm = {
      ...form,
      youtubeInput: '',
      youtubeUrls: nextYoutubeUrls,
    };

    const isValid = validateForm(nextForm);

    if (!isValid) {
      return;
    }

    onSave(nextForm);
  };

  const handleDialogClose = (...args) => {
    if (isSaving) {
      return;
    }

    onClose(...args);
  };

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2.5,
            overflow: 'hidden',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          position: 'relative',
          px: 3,
          py: 2,
          pr: 7,
          color: FORM_COLORS.mute,
          borderBottom: `1px solid ${FORM_COLORS.blue100}`,
          fontSize: 13,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {isEditMode ? 'Edit material' : 'Add material'}
        <IconButton
          aria-label="Close material dialog"
          onClick={handleDialogClose}
          disabled={isSaving}
          sx={{
            position: 'absolute',
            right: 16,
            top: 10,
            width: 32,
            height: 32,
            border: `1px solid ${FORM_COLORS.blue200}`,
            color: FORM_COLORS.slate,
            backgroundColor: '#fff',
            '&:hover': { backgroundColor: FORM_COLORS.blue50 },
          }}
        >
          <CloseOutlinedIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ px: { xs: 2.5, md: 4 }, pt: { xs: 3, md: 4 }, pb: 2.5 }}>
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
            {isEditMode ? 'Edit material' : 'Add material'}
          </Typography>
          <Typography sx={{ mt: 1, color: FORM_COLORS.mute, fontSize: 14, lineHeight: 1.45 }}>
            Add source content for lessons: videos, links, files, images, or text notes.
          </Typography>
        </Box>

        <Stack spacing={3} sx={{ px: { xs: 2.5, md: 4 }, pb: 3 }}>
          <Stack spacing={2}>
            <TextField
              label="Title"
              fullWidth
              value={form.title}
              onChange={handleChange('title')}
              error={Boolean(errors.title)}
              helperText={errors.title}
              sx={fieldSx}
            />

            <TextField
              label="Short Description"
              fullWidth
              multiline
              minRows={2}
              value={form.description}
              onChange={handleChange('description')}
              sx={fieldSx}
            />

            <Autocomplete
              multiple
              freeSolo
              options={suggestedLessonTags}
              value={form.tags}
              onChange={handleTagsChange}
              renderValue={(value, getItemProps) =>
                value.map((tag, index) => {
                  const { key, ...itemProps } = getItemProps({ index });

                  return (
                    <Chip
                      key={key}
                      label={tag}
                      {...itemProps}
                    />
                  );
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tags"
                  placeholder="Add a tag"
                  helperText="Optional categories for filtering and scanning materials."
                  sx={fieldSx}
                />
              )}
            />
          </Stack>

          <Box>
            <SectionLabel>YouTube videos</SectionLabel>

            <TextField
              label="Paste YouTube URL and press Enter"
              fullWidth
              placeholder="https://www.youtube.com/watch?v=..."
              value={form.youtubeInput}
              onChange={handleYoutubeInputChange}
              onKeyDown={handleYoutubeKeyDown}
              onBlur={handleYoutubeBlur}
              error={Boolean(errors.youtubeInput)}
              helperText={
                errors.youtubeInput ||
                'A YouTube link will be added automatically on Enter, space, blur, or save.'
              }
              sx={fieldSx}
            />

            {form.youtubeUrls.length > 0 && (
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                sx={{
                  flexWrap: 'wrap',
                  mt: 1.5,
                }}
              >
                {form.youtubeUrls.map((url) => (
                  <Chip
                    key={url}
                    label={url}
                    onDelete={() => handleRemoveYoutubeUrl(url)}
                    sx={youtubeChipSx}
                  />
                ))}
              </Stack>
            )}
          </Box>

          <Box>
            <SectionLabel>Links</SectionLabel>

            <TextField
              label="One link per line"
              fullWidth
              multiline
              minRows={3}
              placeholder={'https://example.com\nhttps://docs.example.com'}
              value={form.links}
              onChange={handleChange('links')}
              sx={fieldSx}
            />
          </Box>

          <Box>
            <SectionLabel>Text</SectionLabel>

            <TextField
              label="Text Content"
              fullWidth
              multiline
              minRows={5}
              value={form.text}
              onChange={handleChange('text')}
              sx={fieldSx}
            />
          </Box>

          <Box>
            <SectionLabel>Files and images</SectionLabel>

            <Button
              variant="outlined"
              component="label"
              startIcon={<AttachFileOutlinedIcon />}
              sx={{
                ...actionButtonSx,
                borderColor: FORM_COLORS.blue200,
                color: FORM_COLORS.blue,
                backgroundColor: '#fff',
                '&:hover': {
                  borderColor: FORM_COLORS.blue,
                  backgroundColor: FORM_COLORS.blue50,
                },
              }}
            >
              {isEditMode ? 'Add More Files' : 'Choose Files'}
              <input
                hidden
                type="file"
                multiple
                accept={acceptedFileTypes}
                onChange={handleFileChange}
              />
            </Button>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Supported: doc, docx, xls, xlsx, pdf, png, jpg, jpeg, webp
            </Typography>

            {form.existingAttachments.length > 0 && (
              <Stack spacing={1} sx={{ mt: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Existing attachments
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                  {form.existingAttachments.map((attachment) => (
                    <Chip
                      key={attachment.id || attachment.storageKey}
                      label={attachment.name}
                      onDelete={() => handleRemoveExistingAttachment(attachment.storageKey)}
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Stack>
            )}

            {form.newAttachments.length > 0 && (
              <Stack spacing={1} sx={{ mt: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  New attachments
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                  {form.newAttachments.map((file) => (
                    <Chip
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                      label={file.name}
                      onDelete={() => handleRemoveNewAttachment(file)}
                    />
                  ))}
                </Stack>
              </Stack>
            )}
          </Box>

          {errors.content && (
            <Typography variant="body2" color="error">
              {errors.content}
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2.5, md: 3.5 },
          py: 1.75,
          gap: 1,
          borderTop: `1px solid ${FORM_COLORS.blue100}`,
          backgroundColor: FORM_COLORS.bg2,
        }}
      >
        <Button
          onClick={handleDialogClose}
          disabled={isSaving}
          sx={{
            ...actionButtonSx,
            border: `1px solid ${FORM_COLORS.blue200}`,
            color: FORM_COLORS.slate,
            backgroundColor: 'transparent',
            '&:hover': { backgroundColor: '#fff' },
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSaving}
          sx={{
            ...actionButtonSx,
            px: 2.75,
            backgroundColor: FORM_COLORS.blue,
            boxShadow: 'none',
            '&:hover': { backgroundColor: FORM_COLORS.blue, boxShadow: 'none' },
          }}
        >
          {isSaving
            ? isEditMode
              ? 'Saving changes...'
              : 'Saving...'
            : isEditMode
              ? 'Save Changes'
              : 'Save Material'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
