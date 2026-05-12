'use client';

import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
} from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import PermissionMatrix from './PermissionMatrix';

export default function PermissionMatrixDialog({
  buttonLabel = 'Permissions',
  title = 'Permissions',
  user,
  permissionDefinitions = [],
  permissionState,
  disabledKeys = [],
  onSaved,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSaved = (userId, permissions) => {
    onSaved?.(userId, permissions);
    setIsOpen(false);
  };

  if (!user || !permissionState) {
    return null;
  }

  return (
    <>
      <Tooltip title={buttonLabel}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<SettingsOutlinedIcon />}
          disabled={disabled}
          onClick={() => setIsOpen(true)}
          sx={{ minWidth: 128, textTransform: 'none', fontWeight: 850 }}
        >
          {buttonLabel}
        </Button>
      </Tooltip>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ pr: 7 }}>
          {title}
          <IconButton
            aria-label="Close permissions dialog"
            onClick={() => setIsOpen(false)}
            sx={{ position: 'absolute', right: 16, top: 12 }}
          >
            <CloseOutlinedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <PermissionMatrix
            title={title}
            user={user}
            permissionDefinitions={permissionDefinitions}
            permissionState={permissionState}
            disabledKeys={disabledKeys}
            onSaved={handleSaved}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
