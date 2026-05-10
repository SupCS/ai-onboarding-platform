'use client';

import { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import EmptyState from '../ui/EmptyState';

function getInitials(name = '', email = '') {
  const source = name || email;
  return source.charAt(0).toUpperCase();
}

export default function TeamsClient({
  initialTeams = [],
  permissions = {},
}) {
  const [teams, setTeams] = useState(initialTeams);
  const [emailByLeadId, setEmailByLeadId] = useState({});
  const [pendingAction, setPendingAction] = useState(null);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) =>
      a.lead.name.localeCompare(b.lead.name, undefined, { sensitivity: 'base' })
    );
  }, [teams]);

  const canManageLead = (leadId) =>
    permissions.canManageAnyTeam || permissions.currentUserId === leadId;

  const refreshTeams = async () => {
    const response = await fetch('/api/teams', {
      method: 'GET',
      cache: 'no-store',
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to load teams.');
    }

    setTeams(data.teams || []);
  };

  const showToast = (message, severity = 'success') => {
    setToast({
      open: true,
      message,
      severity,
    });
  };

  const addMember = async (leadId) => {
    const email = (emailByLeadId[leadId] || '').trim();

    if (!email) {
      showToast('Enter a member email first.', 'warning');
      return;
    }

    try {
      setPendingAction({ type: 'add-member', leadId });

      const response = await fetch(`/api/teams/${leadId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add team member.');
      }

      setEmailByLeadId((prev) => ({
        ...prev,
        [leadId]: '',
      }));
      await refreshTeams();
      showToast('Team member added.');
    } catch (error) {
      console.error('Failed to add team member:', error);
      showToast(error.message || 'Failed to add team member.', 'error');
    } finally {
      setPendingAction(null);
    }
  };

  const removeMember = async (leadId, memberId) => {
    try {
      setPendingAction({ type: 'remove-member', leadId, memberId });

      const response = await fetch(`/api/teams/${leadId}/members`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove team member.');
      }

      await refreshTeams();
      showToast('Team member removed.');
    } catch (error) {
      console.error('Failed to remove team member:', error);
      showToast(error.message || 'Failed to remove team member.', 'error');
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <>
      {sortedTeams.length === 0 ? (
        <EmptyState
          title="No team leads yet"
          description="Admins can add team leads from the Admin tab."
        />
      ) : (
        <Stack spacing={1.5}>
          {sortedTeams.map((team) => {
            const lead = team.lead;
            const canManage = canManageLead(lead.id);
            const isAddingMember =
              pendingAction?.type === 'add-member' && pendingAction.leadId === lead.id;

            return (
              <Accordion
                key={lead.id}
                disableGutters
                elevation={0}
                sx={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px !important',
                  overflow: 'hidden',
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{ alignItems: 'center', minWidth: 0, width: '100%' }}
                  >
                    <Avatar
                      sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 700 }}
                    >
                      {getInitials(lead.name, lead.email)}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Typography sx={{ fontWeight: 900 }} noWrap>
                        {lead.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {lead.email}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      icon={<GroupsOutlinedIcon />}
                      label={`${team.members.length} member${team.members.length === 1 ? '' : 's'}`}
                      variant="outlined"
                    />
                    {lead.role === 'admin' && (
                      <Chip size="small" color="primary" label="admin" />
                    )}
                  </Stack>
                </AccordionSummary>

                <AccordionDetails>
                  <Stack spacing={2}>
                    {canManage && (
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <TextField
                          size="small"
                          type="email"
                          label="Member email"
                          value={emailByLeadId[lead.id] || ''}
                          disabled={Boolean(pendingAction)}
                          onChange={(event) =>
                            setEmailByLeadId((prev) => ({
                              ...prev,
                              [lead.id]: event.target.value,
                            }))
                          }
                          fullWidth
                        />
                        <Button
                          variant="contained"
                          startIcon={
                            isAddingMember ? (
                              <CircularProgress size={18} color="inherit" />
                            ) : (
                              <AddOutlinedIcon />
                            )
                          }
                          disabled={Boolean(pendingAction)}
                          onClick={() => addMember(lead.id)}
                          sx={{ minWidth: 150 }}
                        >
                          {isAddingMember ? 'Adding...' : 'Add'}
                        </Button>
                      </Stack>
                    )}

                    {team.members.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        This team does not have members yet.
                      </Typography>
                    ) : (
                      <Stack spacing={1}>
                        {team.members.map((member) => {
                          const isRemovingMember =
                            pendingAction?.type === 'remove-member' &&
                            pendingAction.leadId === lead.id &&
                            pendingAction.memberId === member.id;

                          return (
                          <Stack
                            key={member.id}
                            direction="row"
                            spacing={1.5}
                            sx={{
                              alignItems: 'center',
                              p: 1.25,
                              border: '1px solid #eef2f7',
                              borderRadius: 2,
                              backgroundColor: '#fff',
                            }}
                          >
                            <Avatar
                              sx={{
                                width: 34,
                                height: 34,
                                bgcolor: 'primary.main',
                                color: '#fff',
                                fontWeight: 700,
                              }}
                            >
                              {getInitials(member.name, member.email)}
                            </Avatar>
                            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>
                                {member.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {member.email}
                              </Typography>
                            </Box>
                            <Chip size="small" label={member.role} variant="outlined" />
                            {canManage && (
                              <Tooltip title="Remove from team">
                                <IconButton
                                  aria-label={`Remove ${member.name} from team`}
                                  disabled={Boolean(pendingAction)}
                                  onClick={() => removeMember(lead.id, member.id)}
                                >
                                  {isRemovingMember ? (
                                    <CircularProgress size={18} color="inherit" />
                                  ) : (
                                    <DeleteOutlineOutlinedIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                          );
                        })}
                      </Stack>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Stack>
      )}

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
