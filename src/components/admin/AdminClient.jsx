'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddModeratorOutlinedIcon from '@mui/icons-material/AddModeratorOutlined';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import EmptyState from '../ui/EmptyState';

function initials(name = '', email = '') {
  const source = name || email;
  return source.charAt(0).toUpperCase();
}

export default function AdminClient({ initialUsers = [] }) {
  const [users, setUsers] = useState(initialUsers);
  const [email, setEmail] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const teamLeads = useMemo(
    () => users.filter((user) => ['admin', 'teamlead'].includes(user.role)),
    [users]
  );
  const admins = useMemo(
    () => users.filter((user) => user.role === 'admin'),
    [users]
  );

  const showToast = (message, severity = 'success') => {
    setToast({
      open: true,
      message,
      severity,
    });
  };

  const refreshUsers = async () => {
    const response = await fetch('/api/admin/team-leads', {
      method: 'GET',
      cache: 'no-store',
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to refresh users.');
    }

    setUsers(data.users || []);
  };

  const assignTeamLead = async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      showToast('Enter an email first.', 'warning');
      return;
    }

    try {
      setPendingAction({ type: 'assign-teamlead' });

      const response = await fetch('/api/admin/team-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign team lead.');
      }

      setEmail('');
      await refreshUsers();
      showToast('Team lead assigned.');
    } catch (error) {
      console.error('Failed to assign team lead:', error);
      showToast(error.message || 'Failed to assign team lead.', 'error');
    } finally {
      setPendingAction(null);
    }
  };

  const removeTeamLead = async (teamLeadEmail) => {
    try {
      setPendingAction({ type: 'remove-teamlead', email: teamLeadEmail });

      const response = await fetch('/api/admin/team-leads', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: teamLeadEmail }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove team lead.');
      }

      await refreshUsers();
      showToast('Team lead removed.');
    } catch (error) {
      console.error('Failed to remove team lead:', error);
      showToast(error.message || 'Failed to remove team lead.', 'error');
    } finally {
      setPendingAction(null);
    }
  };

  const isAssigningTeamLead = pendingAction?.type === 'assign-teamlead';

  return (
    <>
      <Stack spacing={3}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            border: '1px solid #e5e7eb',
            borderRadius: 2,
            backgroundColor: '#fff',
          }}
        >
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Assign team lead
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter a registered user email to grant team lead permissions.
              </Typography>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                type="email"
                label="User email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={Boolean(pendingAction)}
                fullWidth
              />
              <Button
                variant="contained"
                startIcon={
                  isAssigningTeamLead ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <AddModeratorOutlinedIcon />
                  )
                }
                disabled={Boolean(pendingAction)}
                onClick={assignTeamLead}
                sx={{ minWidth: 180 }}
              >
                {isAssigningTeamLead ? 'Assigning...' : 'Assign'}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            border: '1px solid #e5e7eb',
            borderRadius: 2,
            backgroundColor: '#fff',
          }}
        >
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Current team leads
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Admins are listed here too because they can manage teams.
                  Removing a team lead also clears their team membership list.
                </Typography>
              </Box>
              <Chip label={`${teamLeads.length} active`} color="primary" variant="outlined" />
            </Stack>

            <Divider />

            {teamLeads.length === 0 ? (
              <EmptyState
                title="No team leads"
                description="Assign a registered user above to create their team."
              />
            ) : (
              <Stack spacing={1}>
                {teamLeads.map((user) => {
                  const isAdmin = user.role === 'admin';
                  const isRemovingTeamLead =
                    pendingAction?.type === 'remove-teamlead' &&
                    pendingAction.email === user.email;

                  return (
                    <Stack
                      key={user.id}
                      direction="row"
                      spacing={1.5}
                      sx={{
                        alignItems: 'center',
                        p: 1.25,
                        border: '1px solid #eef2f7',
                        borderRadius: 2,
                      }}
                    >
                      <Avatar
                        sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 700 }}
                      >
                        {initials(user.name, user.email)}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                        <Typography sx={{ fontWeight: 800 }} noWrap>
                          {user.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {user.email}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={isAdmin ? 'admin' : 'teamlead'}
                        color={isAdmin ? 'primary' : 'default'}
                        variant="outlined"
                      />
                      {!isAdmin && (
                        <Button
                          color="error"
                          variant="outlined"
                          startIcon={
                            isRemovingTeamLead ? (
                              <CircularProgress size={16} color="inherit" />
                            ) : (
                              <PersonRemoveOutlinedIcon />
                            )
                          }
                          disabled={Boolean(pendingAction)}
                          onClick={() => removeTeamLead(user.email)}
                          sx={{ minWidth: 120 }}
                        >
                          {isRemovingTeamLead ? 'Removing...' : 'Remove'}
                        </Button>
                      )}
                    </Stack>
                  );
                })}
              </Stack>
            )}
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            border: '1px solid #e5e7eb',
            borderRadius: 2,
            backgroundColor: '#fff',
          }}
        >
          <Stack spacing={1}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Admins
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              {admins.map((admin) => (
                <Chip
                  key={admin.id}
                  avatar={
                    <Avatar
                      sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 700 }}
                    >
                      {initials(admin.name, admin.email)}
                    </Avatar>
                  }
                  label={admin.email}
                  color="primary"
                  variant="outlined"
                  sx={{
                    mb: 1,
                    '& .MuiChip-avatar': {
                      bgcolor: 'primary.main',
                      color: '#fff',
                      fontWeight: 700,
                    },
                  }}
                />
              ))}
            </Stack>
          </Stack>
        </Paper>
      </Stack>

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
}
