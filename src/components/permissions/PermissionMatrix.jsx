'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';

function groupPermissions(definitions = []) {
  return definitions.reduce((groups, permission) => {
    const group = groups.get(permission.group) || [];
    group.push(permission);
    groups.set(permission.group, group);
    return groups;
  }, new Map());
}

export default function PermissionMatrix({
  title = 'Permissions',
  user,
  permissionDefinitions = [],
  permissionState,
  disabledKeys = [],
  onSaved,
}) {
  const [draft, setDraft] = useState(permissionState?.effective || {});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const disabledKeySet = useMemo(() => new Set(disabledKeys), [disabledKeys]);
  const groupedPermissions = useMemo(
    () => groupPermissions(permissionDefinitions),
    [permissionDefinitions]
  );

  useEffect(() => {
    setDraft(permissionState?.effective || {});
  }, [permissionState]);

  const handleToggle = (permissionKey) => {
    setDraft((prev) => ({
      ...prev,
      [permissionKey]: !prev[permissionKey],
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');

      const response = await fetch('/api/permissions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          overrides: draft,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update permissions.');
      }

      onSaved?.(user.id, data.permissions);
    } catch (saveError) {
      console.error('Failed to update permissions:', saveError);
      setError(saveError.message || 'Failed to update permissions.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || !permissionState) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1, sm: 1.5 },
        border: '1px solid #eef2f7',
        borderRadius: 1.5,
        backgroundColor: '#fff',
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between' }}
        >
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user.name || user.email}
            </Typography>
          </Box>
          <Chip size="small" label={user.role} variant="outlined" />
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        {[...groupedPermissions.entries()].map(([group, permissions]) => (
          <Box key={group}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 0.75,
                fontWeight: 900,
                color: 'text.secondary',
              }}
            >
              {group}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                columnGap: 3,
                rowGap: 1,
                alignItems: 'start',
              }}
            >
              {permissions.map((permission) => (
                <FormControlLabel
                  key={permission.key}
                  control={
                    <Checkbox
                      size="small"
                      checked={Boolean(draft[permission.key])}
                      onChange={() => handleToggle(permission.key)}
                      disabled={isSaving || disabledKeySet.has(permission.key)}
                    />
                  }
                  label={
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 750,
                          lineHeight: 1.3,
                        }}
                      >
                        {permission.label}
                      </Typography>
                      {permission.description && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: 'block',
                            mt: 0.25,
                            lineHeight: 1.35,
                          }}
                        >
                          {permission.description}
                        </Typography>
                      )}
                    </Box>
                  }
                  sx={{
                    alignItems: 'center',
                    m: 0,
                    minHeight: 42,
                    display: 'grid',
                    gridTemplateColumns: '30px minmax(0, 1fr)',
                    columnGap: 0.5,
                    '& .MuiFormControlLabel-label': {
                      minWidth: 0,
                      width: '100%',
                    },
                    '& .MuiCheckbox-root': {
                      p: 0.5,
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        ))}

        <Button
          variant="contained"
          size="small"
          startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
          disabled={isSaving}
          onClick={handleSave}
          sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 850 }}
        >
          {isSaving ? 'Saving...' : 'Save permissions'}
        </Button>
      </Stack>
    </Paper>
  );
}
