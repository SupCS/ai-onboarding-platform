'use client';

import {
  Avatar,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';

function getInitials(user) {
  const source = user?.name || user?.email || '?';
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function LearningAssignmentDialog({
  open,
  item,
  itemType = 'lesson',
  users = [],
  selectedUserIds = [],
  isLoading = false,
  isSaving = false,
  onClose,
  onToggleUser,
  onToggleAll,
  onAssign,
}) {
  const allSelected = users.length > 0 && selectedUserIds.length === users.length;
  const title = itemType === 'roadmap' ? 'Assign roadmap' : 'Assign lesson';
  const noun = itemType === 'roadmap' ? 'roadmap' : 'lesson';

  return (
    <Dialog open={open} onClose={isSaving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              Choose team members who should get this {noun} in their learning plan.
            </Typography>
            {item?.title && (
              <Typography variant="subtitle1" sx={{ fontWeight: 850 }}>
                {item.title}
              </Typography>
            )}
          </Stack>

          {users.length > 0 && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={allSelected}
                  indeterminate={selectedUserIds.length > 0 && !allSelected}
                  onChange={onToggleAll}
                />
              }
              label="Select all"
            />
          )}

          {users.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {isLoading ? 'Loading team members...' : 'No assignable team members found.'}
            </Typography>
          ) : (
            <List disablePadding sx={{ border: '1px solid #e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
              {users.map((user) => {
                const checked = selectedUserIds.includes(user.id);

                return (
                  <ListItem key={user.id} disablePadding divider>
                    <ListItemButton onClick={() => onToggleUser(user.id)} disabled={isSaving}>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 34, height: 34, fontSize: 13, fontWeight: 800 }}>
                          {getInitials(user)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.name || user.email}
                        secondary={user.email}
                        slotProps={{
                          primary: {
                            sx: { fontWeight: 750 },
                          },
                        }}
                      />
                      <Checkbox edge="end" checked={checked} tabIndex={-1} disableRipple />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onAssign}
          disabled={isSaving || selectedUserIds.length === 0}
        >
          {isSaving ? 'Assigning...' : `Assign to ${selectedUserIds.length || 0}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
