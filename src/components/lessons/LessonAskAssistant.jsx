'use client';

import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import { AI_DIGITAL_COLORS, hexToRgba } from '../../lib/brandColors';

const STARTER_QUESTIONS = [
  'Explain the core idea in simpler words.',
  'What should I remember from this lesson?',
  'Give me an example from the lesson.',
];

export default function LessonAskAssistant({ lessonId }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);

  const trimmedQuestion = question.trim();
  const recentHistory = useMemo(
    () => messages.map(({ role, content }) => ({ role, content })).slice(-8),
    [messages]
  );

  async function askAssistant(nextQuestion = trimmedQuestion) {
    const normalizedQuestion = nextQuestion.trim();

    if (!normalizedQuestion || isLoading) {
      return;
    }

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: normalizedQuestion,
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion('');
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/lessons/${lessonId}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: normalizedQuestion,
          history: recentHistory,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to answer the question.');
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.answer,
          metadata: data.metadata,
        },
      ]);
    } catch (requestError) {
      setError(requestError.message || 'Failed to answer the question.');
      setMessages((current) => current.filter((message) => message.id !== userMessage.id));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    askAssistant();
  }

  function clearChat() {
    setMessages([]);
    setError('');
    setQuestion('');
    inputRef.current?.focus();
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        right: { xs: 16, md: 28 },
        bottom: { xs: 16, md: 28 },
        zIndex: 1300,
      }}
    >
      {!isOpen && (
        <Button
          type="button"
          variant="contained"
          startIcon={<AutoAwesomeOutlinedIcon />}
          onClick={() => setIsOpen(true)}
          sx={{
            minHeight: 54,
            px: 2.25,
            borderRadius: 999,
            fontWeight: 950,
            textTransform: 'none',
            color: '#fff',
            backgroundColor: AI_DIGITAL_COLORS.yvesKleinBlue,
            boxShadow: '0 18px 40px rgba(0, 9, 220, 0.28)',
            '&:hover': {
              backgroundColor: '#0007b8',
              boxShadow: '0 20px 48px rgba(0, 9, 220, 0.34)',
            },
          }}
        >
          Ask AI
        </Button>
      )}

      {isOpen && (
        <Box
          sx={{
            width: { xs: 'calc(100vw - 32px)', sm: 390 },
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: { xs: 'calc(100vh - 32px)', sm: 640 },
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(15, 23, 42, 0.08)',
            borderRadius: { xs: 3, md: 4 },
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            boxShadow: '0 28px 80px rgba(15, 23, 42, 0.22)',
            overflow: 'hidden',
          }}
        >
      <Stack
        direction="row"
        spacing={1.25}
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid #eef2f7',
        }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 2,
              color: AI_DIGITAL_COLORS.yvesKleinBlue,
              backgroundColor: hexToRgba(AI_DIGITAL_COLORS.brightAqua, 0.24),
            }}
          >
            <AutoAwesomeOutlinedIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 950, lineHeight: 1.15 }}>
              Ask AI
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Lesson-aware mini assistant
            </Typography>
          </Box>
        </Stack>

        <Tooltip title="Clear chat">
          <span>
            <IconButton
              size="small"
              onClick={clearChat}
              disabled={messages.length === 0 && !question && !error}
              aria-label="Clear lesson assistant chat"
            >
              <ClearOutlinedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Close chat">
          <IconButton
            size="small"
            onClick={() => setIsOpen(false)}
            aria-label="Close lesson assistant chat"
          >
            <CloseOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Box
        sx={{
          flex: 1,
          minHeight: 260,
          maxHeight: { xs: 'calc(100vh - 260px)', sm: 410 },
          overflowY: 'auto',
          px: 2,
          py: 2,
        }}
      >
        {messages.length === 0 ? (
          <Stack spacing={1.25}>
            <Typography variant="body2" color="text.secondary">
              Ask a question about this lesson. The assistant answers from the lesson and its source assets.
            </Typography>
            {STARTER_QUESTIONS.map((starter) => (
              <Button
                key={starter}
                type="button"
                variant="outlined"
                color="inherit"
                onClick={() => askAssistant(starter)}
                disabled={isLoading}
                sx={{
                  justifyContent: 'flex-start',
                  borderRadius: 2,
                  textAlign: 'left',
                  textTransform: 'none',
                  py: 1,
                  color: '#172033',
                  borderColor: '#dbeafe',
                  backgroundColor: '#f8fbff',
                }}
              >
                {starter}
              </Button>
            ))}
          </Stack>
        ) : (
          <Stack spacing={1.5}>
            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '92%',
                  px: 1.5,
                  py: 1.1,
                  borderRadius: 2,
                  backgroundColor:
                    message.role === 'user'
                      ? AI_DIGITAL_COLORS.yvesKleinBlue
                      : '#f1f5f9',
                  color: message.role === 'user' ? '#fff' : '#172033',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                }}
              >
                <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
                  {message.content}
                </Typography>
              </Box>
            ))}
            {isLoading && (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'text.secondary' }}>
                <CircularProgress size={16} />
                <Typography variant="body2">Reading the lesson context...</Typography>
              </Stack>
            )}
          </Stack>
        )}
      </Box>

      {error && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        </Box>
      )}

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gap: 1,
          p: 2,
          borderTop: '1px solid #eef2f7',
          backgroundColor: '#fff',
        }}
      >
        <TextField
          inputRef={inputRef}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about this lesson..."
          size="small"
          multiline
          maxRows={4}
          disabled={isLoading}
          slotProps={{
            htmlInput: {
              maxLength: 2000,
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: '#f8fafc',
            },
          }}
        />
        <Tooltip title="Send question">
          <span>
            <IconButton
              type="submit"
              disabled={!trimmedQuestion || isLoading}
              aria-label="Send lesson question"
              sx={{
                width: 42,
                height: 42,
                alignSelf: 'flex-end',
                color: '#fff',
                backgroundColor: AI_DIGITAL_COLORS.yvesKleinBlue,
                '&:hover': {
                  backgroundColor: '#0007b8',
                },
                '&.Mui-disabled': {
                  color: '#94a3b8',
                  backgroundColor: '#e2e8f0',
                },
              }}
            >
              {isLoading ? <CircularProgress size={18} color="inherit" /> : <SendOutlinedIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
      </Box>
        </Box>
      )}
    </Box>
  );
}
