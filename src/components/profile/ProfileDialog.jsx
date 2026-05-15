'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import UserAvatar from '../ui/UserAvatar';
import { AI_DIGITAL_AVATAR_COLORS } from '../../lib/brandColors';

export default function ProfileDialog({
  open,
  user,
  onClose,
  onSaved,
}) {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [avatarStorageKey, setAvatarStorageKey] = useState('');
  const [avatarColor, setAvatarColor] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(user?.name || '');
    setPosition(user?.position || '');
    setAvatarStorageKey(user?.avatarStorageKey || '');
    setAvatarColor(user?.avatarColor || AI_DIGITAL_AVATAR_COLORS[0]);
    setAvatarFile(null);
    setAvatarPreviewUrl('');
    setError('');
  }, [open, user]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreviewUrl('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile]);

  const previewUser = useMemo(
    () => ({
      ...user,
      name,
      position,
      avatarStorageKey,
      avatarColor,
    }),
    [avatarColor, avatarStorageKey, name, position, user]
  );

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0] || null;
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Choose an image file.');
      return;
    }

    setAvatarFile(file);
    setError('');
  };

  const saveProfile = async () => {
    const normalizedName = name.trim();

    if (!normalizedName) {
      setError('Name is required.');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      let nextAvatarStorageKey = avatarStorageKey;

      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);

        const uploadResponse = await fetch('/api/profile/avatar', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || 'Failed to upload avatar.');
        }

        nextAvatarStorageKey = uploadData.storageKey;
      }

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: normalizedName,
          position: position.trim(),
          avatarStorageKey: nextAvatarStorageKey || null,
          avatarColor,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      onSaved?.(data.user);
      onClose?.();
    } catch (saveError) {
      console.error('Failed to save profile:', saveError);
      setError(saveError.message || 'Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={isSaving ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Profile settings</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.25} sx={{ pt: 0.5 }}>
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            {avatarPreviewUrl ? (
              <Box
                component="img"
                src={avatarPreviewUrl}
                alt=""
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
            ) : (
              <UserAvatar user={previewUser} sx={{ width: 72, height: 72, fontSize: 28 }} />
            )}

            <Stack spacing={1} sx={{ minWidth: 0 }}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadOutlinedIcon />}
                disabled={isSaving}
                sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
              >
                Upload avatar
                <Box
                  component="input"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleAvatarChange}
                />
              </Button>
              {(avatarStorageKey || avatarFile) && (
                <Button
                  color="inherit"
                  startIcon={<DeleteOutlineOutlinedIcon />}
                  disabled={isSaving}
                  onClick={() => {
                    setAvatarFile(null);
                    setAvatarStorageKey('');
                  }}
                  sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                >
                  Remove avatar
                </Button>
              )}
            </Stack>
          </Stack>

          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Default avatar color
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              {AI_DIGITAL_AVATAR_COLORS.map((color) => {
                const isSelected = avatarColor === color;

                return (
                  <IconButton
                    key={color}
                    type="button"
                    aria-label={`Use avatar color ${color}`}
                    disabled={isSaving}
                    onClick={() => setAvatarColor(color)}
                    sx={{
                      minWidth: 0,
                      width: 32,
                      height: 32,
                      flex: '0 0 32px',
                      p: 0,
                      borderRadius: '50%',
                      border: isSelected ? '2px solid #0B0B0B' : '1px solid rgba(0, 9, 220, 0.18)',
                      backgroundColor: color,
                      aspectRatio: '1 / 1',
                      boxShadow: isSelected ? '0 0 0 3px rgba(0, 9, 220, 0.12)' : 'none',
                      '&:hover': {
                        backgroundColor: color,
                        boxShadow: '0 0 0 3px rgba(0, 9, 220, 0.12)',
                      },
                    }}
                  />
                );
              })}
            </Stack>
          </Box>

          <TextField
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isSaving}
            fullWidth
            required
          />

          <TextField
            label="Position"
            value={position}
            onChange={(event) => setPosition(event.target.value)}
            disabled={isSaving}
            fullWidth
            placeholder="Product designer, QA engineer, team lead..."
          />

          <Box>
            <Typography variant="caption" color="text.secondary">
              Account role
            </Typography>
            <Typography sx={{ fontWeight: 800, textTransform: 'capitalize' }}>
              {user?.role || 'member'}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={saveProfile}
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
