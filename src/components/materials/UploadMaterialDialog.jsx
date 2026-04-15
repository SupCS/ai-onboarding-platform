'use client';

import { useMemo, useState } from 'react';
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

export default function UploadMaterialDialog({
  open,
  onClose,
  onSave,
  isSaving = false,
}) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const hasAnyContent = useMemo(() => {
    return Boolean(
      form.youtubeUrls.length > 0 ||
        form.links.trim() ||
        form.text.trim() ||
        form.attachments.length > 0
    );
  }, [form]);

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
  };

  const addYoutubeUrl = (rawValue) => {
    const value = rawValue.trim();

    if (!value) {
      return;
    }

    if (!isValidYoutubeUrl(value)) {
      setErrors((prev) => ({
        ...prev,
        youtubeInput: 'Only valid YouTube links are allowed here.',
      }));
      return;
    }

    if (form.youtubeUrls.includes(value)) {
      setErrors((prev) => ({
        ...prev,
        youtubeInput: 'This YouTube link is already added.',
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      youtubeInput: '',
      youtubeUrls: [...prev.youtubeUrls, value],
    }));

    setErrors((prev) => ({
      ...prev,
      youtubeInput: '',
      content: '',
    }));
  };

  const handleYoutubeKeyDown = (event) => {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    addYoutubeUrl(form.youtubeInput);
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

  const validateForm = () => {
    const nextErrors = {};

    if (!form.title.trim()) {
      nextErrors.title = 'Title is required.';
    }

    if (!hasAnyContent) {
      nextErrors.content = 'Add at least one content source.';
    }

    if (form.youtubeInput.trim() && !isValidYoutubeUrl(form.youtubeInput)) {
      nextErrors.youtubeInput = 'Press Enter only with a valid YouTube link.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    onSave(form);
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
              error={Boolean(errors.youtubeInput)}
              helperText={
                errors.youtubeInput ||
                'Add one or multiple YouTube links. Press Enter after each.'
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
