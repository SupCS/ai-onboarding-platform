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
  if (status === 'error') {
    return <ErrorOutlineOutlinedIcon sx={{ color: '#dc2626' }} />;
  }

  return <HourglassTopOutlinedIcon sx={{ color: AI_DIGITAL_COLORS.yvesKleinBlue }} />;
}

function getStatusLabel(status) {
  if (status === 'error') {
    return 'Failed';
  }

  return 'In progress';
}

function TaskTray({ tasks, onDismiss, onDismissCompleted }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasTasks = tasks.length > 0;
  const activeCount = tasks.filter((task) => task.status === 'running').length;
  const errorCount = tasks.filter((task) => task.status === 'error').length;

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
        width: { xs: 'calc(100vw - 32px)', sm: isExpanded ? 320 : 260 },
        overflow: 'hidden',
        borderRadius: 2,
        border: `1px solid ${hexToRgba(errorCount > 0 ? '#dc2626' : AI_DIGITAL_COLORS.yvesKleinBlue, 0.16)}`,
        backgroundColor: '#fff',
        boxShadow: `0 16px 42px ${hexToRgba(AI_DIGITAL_COLORS.midnightCharcoal, 0.14)}`,
        transition: 'width 0.18s ease',
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{
          px: 1.25,
          py: 0.9,
          alignItems: 'center',
          backgroundColor: errorCount > 0 ? '#7f1d1d' : AI_DIGITAL_COLORS.midnightCharcoal,
          color: '#fff',
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 900, lineHeight: 1.2 }}>
            {errorCount > 0 ? 'Task failed' : 'Working...'}
          </Typography>
          <Typography variant="caption" noWrap sx={{ display: 'block', color: 'rgba(255,255,255,0.72)' }}>
            {errorCount > 0
              ? `${errorCount} error${errorCount === 1 ? '' : 's'}`
              : `${activeCount} running`}
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

      {!isExpanded && activeCount > 0 && errorCount === 0 && (
        <LinearProgress
          sx={{
            height: 3,
            backgroundColor: hexToRgba(AI_DIGITAL_COLORS.skywave, 0.28),
            '& .MuiLinearProgress-bar': {
              backgroundColor: AI_DIGITAL_COLORS.yvesKleinBlue,
            },
          }}
        />
      )}

      <Collapse in={isExpanded}>
        <Stack spacing={0} sx={{ maxHeight: 280, overflow: 'auto' }}>
          {tasks.map((task) => (
            <Box
              key={task.id}
              sx={{
                px: 1.25,
                py: 1,
                borderTop: '1px solid #eef2f7',
                backgroundColor:
                  task.status === 'error'
                    ? '#fff7f7'
                    : '#fff',
              }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                <Box sx={{ pt: 0.15 }}>{getTaskIcon(task.status)}</Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 900, flex: 1, minWidth: 0 }}>
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
                      sx={{
                        display: '-webkit-box',
                        mt: 0.25,
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        WebkitLineClamp: task.status === 'error' ? 3 : 1,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {task.description}
                    </Typography>
                  )}

                  {task.status === 'running' && (
                    <LinearProgress
                      sx={{
                        mt: 0.75,
                        height: 4,
                        borderRadius: 999,
                        backgroundColor: hexToRgba(AI_DIGITAL_COLORS.skywave, 0.28),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: AI_DIGITAL_COLORS.yvesKleinBlue,
                        },
                      }}
                    />
                  )}
                </Box>

                <IconButton
                  aria-label={task.status === 'running' ? 'Hide task' : 'Dismiss task'}
                  size="small"
                  onClick={() => onDismiss(task.id)}
                  sx={{ mt: -0.5 }}
                >
                  <CloseOutlinedIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Box>
          ))}
        </Stack>

        {tasks.some((task) => task.status === 'error') && (
          <Box sx={{ px: 1.25, py: 0.75, borderTop: '1px solid #eef2f7' }}>
            <Button size="small" onClick={onDismissCompleted} sx={{ textTransform: 'none', fontWeight: 800 }}>
              Clear errors
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
        hidden: false,
        createdAt: Date.now(),
      },
      ...prev,
    ].slice(0, 8));

    return id;
  }, []);

  const updateTask = useCallback((id, patch) => {
    setTasks((prev) => {
      if (patch.status === 'success') {
        return prev.filter((task) => task.id !== id);
      }

      return prev.map((task) =>
        task.id === id
          ? {
              ...task,
              ...patch,
              hidden: patch.status === 'error' ? false : task.hidden,
            }
          : task
      );
    });
  }, []);

  const dismissTask = useCallback((id) => {
    setTasks((prev) =>
      prev
        .map((task) =>
          task.id === id && task.status === 'running'
            ? { ...task, hidden: true }
            : task
        )
        .filter((task) => task.id !== id || task.status === 'running')
    );
  }, []);

  const dismissCompleted = useCallback(() => {
    setTasks((prev) => prev.filter((task) => task.status !== 'error'));
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
        tasks={tasks.filter((task) => !task.hidden)}
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
