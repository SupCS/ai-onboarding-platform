'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

const initialForm = {
  title: '',
  description: '',
  youtubeInput: '',
  youtubeUrls: [],
  links: '',
  text: '',
  attachments: [],
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
  color: '#ffffff',
  fontWeight: 600,
  border: '1px solid rgba(29, 78, 216, 0.18)',
  background:
    'linear-gradient(135deg, #2563eb 0%, #1d4ed8 55%, #1e40af 100%)',
  boxShadow: '0 10px 24px rgba(37, 99, 235, 0.18)',
  transition: 'transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease',
  '& .MuiChip-label': {
    px: 1.25,
  },
  '& .MuiChip-deleteIcon': {
    color: 'rgba(255, 255, 255, 0.78)',
    transition: 'color 0.18s ease, transform 0.18s ease',
  },
  '& .MuiChip-deleteIcon:hover': {
    color: '#ffffff',
    transform: 'scale(1.08)',
  },
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 14px 28px rgba(29, 78, 216, 0.28)',
    filter: 'brightness(1.05)',
  },
};

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
}) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

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

  const commitYoutubeInput = (rawValue, existingUrls = form.youtubeUrls) => {
    const candidates = getYoutubeCandidates(rawValue);

    if (candidates.length === 0) {
      return {
        nextYoutubeUrls: existingUrls,
        didCommit: false,
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
        didCommit: false,
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
        didCommit: false,
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
      didCommit: true,
      hasError: false,
    };
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
      attachments: selectedFiles,
    }));

    setErrors((prev) => ({
      ...prev,
      attachments: '',
      content: '',
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
        formToValidate.attachments.length > 0
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

  const handleResetForm = () => {
    setForm(initialForm);
    setErrors({});
  };

  const handleDialogClose = (...args) => {
    if (isSaving) {
      return;
    }

    onClose(...args);
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

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        transition: {
          onExited: handleResetForm,
        },
      }}
    >
      <DialogTitle>Add Material</DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Stack spacing={2}>
            <TextField
              label="Title"
              fullWidth
              value={form.title}
              onChange={handleChange('title')}
              error={Boolean(errors.title)}
              helperText={errors.title}
            />

            <TextField
              label="Short Description"
              fullWidth
              multiline
              minRows={2}
              value={form.description}
              onChange={handleChange('description')}
            />
          </Stack>

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              YouTube Videos
            </Typography>

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
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Links
            </Typography>

            <TextField
              label="One link per line"
              fullWidth
              multiline
              minRows={3}
              placeholder={'https://example.com\nhttps://docs.example.com'}
              value={form.links}
              onChange={handleChange('links')}
            />
          </Box>

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Text
            </Typography>

            <TextField
              label="Text Content"
              fullWidth
              multiline
              minRows={5}
              value={form.text}
              onChange={handleChange('text')}
            />
          </Box>

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Files and Images
            </Typography>

            <Button variant="outlined" component="label">
              Choose Files
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

            {form.attachments.length > 0 && (
              <Stack spacing={0.5} sx={{ mt: 1.5 }}>
                {form.attachments.map((file) => (
                  <Typography key={`${file.name}-${file.size}`} variant="body2">
                    {file.name}
                  </Typography>
                ))}
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

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleDialogClose} color="inherit" disabled={isSaving}>
          Cancel
        </Button>

        <Button variant="contained" onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Material'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
