'use client';

import { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Autocomplete,
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
import PermissionMatrixDialog from '../permissions/PermissionMatrixDialog';
import EmptyState from '../ui/EmptyState';

const teamLeadPermissionDenylist = [
  'admin.manage_roles',
  'permissions.manage_teamleads',
  'permissions.manage_team_members',
  'teams.manage_members',
  'learning.assign',
];

function getInitials(name = '', email = '') {
  const source = name || email;
  return source.charAt(0).toUpperCase();
}

export default function TeamsClient({
  initialTeams = [],
  users = [],
  permissions = {},
  permissionDefinitions = [],
  initialPermissionsByUserId = {},
}) {
  const [teams, setTeams] = useState(initialTeams);
  const [availableUsers, setAvailableUsers] = useState(users);
  const [permissionsByUserId, setPermissionsByUserId] = useState(initialPermissionsByUserId);
  const [memberInputByLeadId, setMemberInputByLeadId] = useState({});
  const [selectedMemberByLeadId, setSelectedMemberByLeadId] = useState({});
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
    permissions.canManageTeams &&
    (permissions.canManageAnyTeam || permissions.currentUserId === leadId);

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
    setAvailableUsers(data.users || []);
    setPermissionsByUserId(data.permissionsByUserId || {});
  };

  const handlePermissionSaved = (userId, permissionState) => {
    setPermissionsByUserId((prev) => ({
      ...prev,
      [userId]: permissionState,
    }));
    showToast('Permissions updated.');
  };

  const showToast = (message, severity = 'success') => {
    setToast({
      open: true,
      message,
      severity,
    });
  };

  const addMember = async (leadId) => {
    const selectedMember = selectedMemberByLeadId[leadId] || null;
    const memberInput = (memberInputByLeadId[leadId] || '').trim();

    if (!selectedMember && !memberInput) {
      showToast('Enter a member name or email first.', 'warning');
      return;
    }

    try {
      setPendingAction({ type: 'add-member', leadId });

      const response = await fetch(`/api/teams/${leadId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          selectedMember
            ? { memberId: selectedMember.id }
            : { member: memberInput }
        ),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add team member.');
      }

      setMemberInputByLeadId((prev) => ({
        ...prev,
        [leadId]: '',
      }));
      setSelectedMemberByLeadId((prev) => ({
        ...prev,
        [leadId]: null,
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
            const memberIds = new Set(team.members.map((member) => member.id));
            const memberOptions = availableUsers.filter((user) => user.id !== lead.id);

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
                        <Autocomplete
                          freeSolo
                          autoHighlight
                          size="small"
                          options={memberOptions}
                          value={selectedMemberByLeadId[lead.id] || null}
                          inputValue={memberInputByLeadId[lead.id] || ''}
                          disabled={Boolean(pendingAction)}
                          getOptionLabel={(option) =>
                            typeof option === 'string'
                              ? option
                              : `${option.name || option.email} (${option.email})`
                          }
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                          getOptionDisabled={(option) => memberIds.has(option.id)}
                          onInputChange={(_event, nextInput) =>
                            setMemberInputByLeadId((prev) => ({
                              ...prev,
                              [lead.id]: nextInput,
                            }))
                          }
                          onChange={(_event, nextMember) => {
                            setSelectedMemberByLeadId((prev) => ({
                              ...prev,
                              [lead.id]: typeof nextMember === 'string' ? null : nextMember,
                            }));
                          }}
                          renderOption={(props, option) => {
                            const { key, ...optionProps } = props;

                            return (
                              <Box component="li" key={key} {...optionProps}>
                                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', width: '100%' }}>
                                  <Avatar
                                    sx={{
                                      width: 30,
                                      height: 30,
                                      bgcolor: 'primary.main',
                                      color: '#fff',
                                      fontWeight: 700,
                                      fontSize: 13,
                                    }}
                                  >
                                    {getInitials(option.name, option.email)}
                                  </Avatar>
                                  <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>
                                      {option.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap>
                                      {option.email}
                                    </Typography>
                                  </Box>
                                  <Chip size="small" label={option.role} variant="outlined" />
                                </Stack>
                              </Box>
                            );
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Member name or email"
                              placeholder="Start typing a name or email"
                            />
                          )}
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
                              spacing={1}
                              sx={{
                                p: 1.25,
                                border: '1px solid #eef2f7',
                                borderRadius: 2,
                                backgroundColor: '#fff',
                              }}
                            >
                              <Stack
                                direction="row"
                                spacing={1.5}
                                sx={{ alignItems: 'center' }}
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
                              {canManage &&
                                permissions.canManageTeamMemberPermissions &&
                                member.role === 'member' && (
                                  <PermissionMatrixDialog
                                    buttonLabel="Permissions"
                                    title="Member permissions"
                                    user={member}
                                    permissionDefinitions={permissionDefinitions}
                                    permissionState={permissionsByUserId[member.id]}
                                    disabledKeys={teamLeadPermissionDenylist}
                                    onSaved={handlePermissionSaved}
                                  />
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
