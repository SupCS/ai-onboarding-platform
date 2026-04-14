'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';

const initialForm = {
  title: '',
  type: 'document',
  description: '',
  source: '',
};

export default function UploadMaterialDialog({ open, onClose, onSave }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setErrors({});
    }
  }, [open]);

  const isFormValid = useMemo(() => {
    return (
      form.title.trim() &&
      form.type.trim() &&
      form.description.trim() &&
      form.source.trim()
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
    }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.title.trim()) {
      nextErrors.title = 'Title is required.';
    }

    if (!form.description.trim()) {
      nextErrors.description = 'Description is required.';
    }

    if (!form.source.trim()) {
      nextErrors.source = 'Source is required.';
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

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Upload Material</DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Title"
            fullWidth
            value={form.title}
            onChange={handleChange('title')}
            error={Boolean(errors.title)}
            helperText={errors.title}
          />

          <TextField
            label="Material Type"
            select
            fullWidth
            value={form.type}
            onChange={handleChange('type')}
          >
            <MenuItem value="document">Document</MenuItem>
            <MenuItem value="video">Video</MenuItem>
          </TextField>

          <TextField
            label="Description"
            fullWidth
            multiline
            minRows={3}
            value={form.description}
            onChange={handleChange('description')}
            error={Boolean(errors.description)}
            helperText={errors.description}
          />

          <TextField
            label="Source URL or file reference"
            fullWidth
            placeholder="https://... or internal file reference"
            value={form.source}
            onChange={handleChange('source')}
            error={Boolean(errors.source)}
            helperText={errors.source}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!isFormValid}
        >
          Save Material
        </Button>
      </DialogActions>
    </Dialog>
  );
}