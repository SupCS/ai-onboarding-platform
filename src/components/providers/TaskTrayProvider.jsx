'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Collapse,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined';
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import HourglassTopOutlinedIcon from '@mui/icons-material/HourglassTopOutlined';
import { AI_DIGITAL_COLORS, hexToRgba } from '../../lib/brandColors';

const TaskTrayContext = createContext(null);

function createTaskId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getTaskIcon(status) {
  if (status === 'success') {
    return <CheckCircleOutlineOutlinedIcon sx={{ color: '#16a34a' }} />;
  }

  if (status === 'error') {
    return <ErrorOutlineOutlinedIcon sx={{ color: '#dc2626' }} />;
  }

  return <HourglassTopOutlinedIcon sx={{ color: AI_DIGITAL_COLORS.yvesKleinBlue }} />;
}

function getStatusLabel(status) {
  if (status === 'success') {
    return 'Done';
  }

  if (status === 'error') {
    return 'Failed';
  }

  return 'In progress';
}

function TaskTray({ tasks, onDismiss, onDismissCompleted }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasTasks = tasks.length > 0;
  const activeCount = tasks.filter((task) => task.status === 'running').length;

  if (!hasTasks) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        right: 24,
        bottom: 24,
        zIndex: 1500,
        width: { xs: 'calc(100vw - 32px)', sm: 380 },
        overflow: 'hidden',
        borderRadius: 2,
        border: `1px solid ${hexToRgba(AI_DIGITAL_COLORS.yvesKleinBlue, 0.16)}`,
        backgroundColor: '#fff',
        boxShadow: `0 24px 72px ${hexToRgba(AI_DIGITAL_COLORS.midnightCharcoal, 0.18)}`,
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{
          px: 2,
          py: 1.25,
          alignItems: 'center',
          backgroundColor: AI_DIGITAL_COLORS.midnightCharcoal,
          color: '#fff',
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
            Background tasks
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.72)' }}>
            {activeCount > 0 ? `${activeCount} running` : 'All caught up'}
          </Typography>
        </Box>

        <IconButton
          aria-label={isExpanded ? 'Collapse task tray' : 'Expand task tray'}
          size="small"
          onClick={() => setIsExpanded((prev) => !prev)}
          sx={{ color: '#fff' }}
        >
          {isExpanded ? <ExpandMoreOutlinedIcon /> : <ExpandLessOutlinedIcon />}
        </IconButton>
      </Stack>

      <Collapse in={isExpanded}>
        <Stack spacing={0} sx={{ maxHeight: 360, overflow: 'auto' }}>
          {tasks.map((task) => (
            <Box
              key={task.id}
              sx={{
                px: 2,
                py: 1.5,
                borderTop: '1px solid #eef2f7',
                backgroundColor:
                  task.status === 'error'
                    ? '#fff7f7'
                    : task.status === 'success'
                      ? '#f7fff9'
                      : '#fff',
              }}
            >
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
                <Box sx={{ pt: 0.15 }}>{getTaskIcon(task.status)}</Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 900, flex: 1, minWidth: 0 }}>
                      {task.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        flex: '0 0 auto',
                        color:
                          task.status === 'error'
                            ? '#dc2626'
                            : task.status === 'success'
                              ? '#15803d'
                              : AI_DIGITAL_COLORS.yvesKleinBlue,
                        fontWeight: 850,
                      }}
                    >
                      {getStatusLabel(task.status)}
                    </Typography>
                  </Stack>

                  {task.description && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.35, lineHeight: 1.35 }}
                    >
                      {task.description}
                    </Typography>
                  )}

                  {task.status === 'running' && (
                    <LinearProgress
                      sx={{
                        mt: 1,
                        height: 5,
                        borderRadius: 999,
                        backgroundColor: hexToRgba(AI_DIGITAL_COLORS.skywave, 0.28),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: AI_DIGITAL_COLORS.yvesKleinBlue,
                        },
                      }}
                    />
                  )}
                </Box>

                {task.status !== 'running' && (
                  <IconButton
                    aria-label="Dismiss task"
                    size="small"
                    onClick={() => onDismiss(task.id)}
                    sx={{ mt: -0.5 }}
                  >
                    <CloseOutlinedIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
            </Box>
          ))}
        </Stack>

        {tasks.some((task) => task.status !== 'running') && (
          <Box sx={{ px: 2, py: 1.25, borderTop: '1px solid #eef2f7' }}>
            <Button size="small" onClick={onDismissCompleted}>
              Clear completed
            </Button>
          </Box>
        )}
      </Collapse>
    </Paper>
  );
}

export function TaskTrayProvider({ children }) {
  const [tasks, setTasks] = useState([]);

  const addTask = useCallback((task) => {
    const id = createTaskId();

    setTasks((prev) => [
      {
        id,
        title: task.title || 'Task',
        description: task.description || '',
        status: task.status || 'running',
        createdAt: Date.now(),
      },
      ...prev,
    ].slice(0, 8));

    return id;
  }, []);

  const updateTask = useCallback((id, patch) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              ...patch,
            }
          : task
      )
    );
  }, []);

  const dismissTask = useCallback((id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  const dismissCompleted = useCallback(() => {
    setTasks((prev) => prev.filter((task) => task.status === 'running'));
  }, []);

  const value = useMemo(
    () => ({
      addTask,
      updateTask,
      dismissTask,
    }),
    [addTask, updateTask, dismissTask]
  );

  return (
    <TaskTrayContext.Provider value={value}>
      {children}
      <TaskTray
        tasks={tasks}
        onDismiss={dismissTask}
        onDismissCompleted={dismissCompleted}
      />
    </TaskTrayContext.Provider>
  );
}

export function useTaskTray() {
  const context = useContext(TaskTrayContext);

  if (!context) {
    throw new Error('useTaskTray must be used inside TaskTrayProvider.');
  }

  return context;
}
