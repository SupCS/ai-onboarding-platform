import Image from 'next/image';
import { redirect } from 'next/navigation';
import {
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import AddLinkOutlinedIcon from '@mui/icons-material/AddLinkOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined';
import PlayCircleOutlineOutlinedIcon from '@mui/icons-material/PlayCircleOutlineOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import Sidebar from '../components/layout/Sidebar';
import { AI_DIGITAL_COLORS, hexToRgba } from '../lib/brandColors';
import { getCurrentUser } from '../lib/currentUser';

export const metadata = {
  title: 'Welcome',
};

const builderSteps = [
  {
    title: 'Add materials to Library',
    description: 'Collect source files, links, YouTube videos, images, and notes in one place.',
    icon: <AddLinkOutlinedIcon />,
  },
  {
    title: 'Generate or paste a lesson',
    description: 'Create a lesson from selected materials, or add a ready lesson manually.',
    icon: <AutoAwesomeOutlinedIcon />,
  },
  {
    title: 'Edit lesson and add activities',
    description: 'Polish the content, add tags, generate a quiz, and create flashcards.',
    icon: <EditNoteOutlinedIcon />,
  },
  {
    title: 'Publish a learning path',
    description: 'Assemble lessons into roadmaps so the team knows what to complete next.',
    icon: <LibraryBooksOutlinedIcon />,
  },
];

const learnerSteps = [
  {
    title: 'Subscribe to a lesson',
    description: 'Open Library, add relevant lessons to My Lessons, or join a roadmap.',
    icon: <SchoolOutlinedIcon />,
  },
  {
    title: 'Read and ask questions',
    description: 'Study the lesson and use the assistant when a concept needs extra context.',
    icon: <PlayCircleOutlineOutlinedIcon />,
  },
  {
    title: 'Complete activities',
    description: 'Review flashcards, pass quizzes, and track your completion progress.',
    icon: <TaskAltOutlinedIcon />,
  },
];

function StepCard({ step, index, compact = false }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: compact ? 2 : { xs: 2, md: 2.5 },
        borderRadius: 3,
        border: `1px solid ${hexToRgba(AI_DIGITAL_COLORS.yvesKleinBlue, 0.12)}`,
        backgroundColor: '#fff',
        minHeight: compact ? 150 : 182,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            color: AI_DIGITAL_COLORS.yvesKleinBlue,
            backgroundColor: hexToRgba(AI_DIGITAL_COLORS.skywave, 0.24),
            '& .MuiSvgIcon-root': { fontSize: 24 },
          }}
        >
          {step.icon}
        </Box>
        <Chip
          label={index + 1}
          size="small"
          sx={{
            ml: 'auto',
            fontWeight: 950,
            color: AI_DIGITAL_COLORS.midnightCharcoal,
            backgroundColor: AI_DIGITAL_COLORS.lime,
          }}
        />
      </Stack>

      <Box>
        <Typography variant="h6" sx={{ fontWeight: 950, lineHeight: 1.15, mb: 0.75 }}>
          {step.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
          {step.description}
        </Typography>
      </Box>
    </Paper>
  );
}

function FlowSection({ title, subtitle, steps, actionHref, actionLabel, compact = false }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 4,
        border: '1px solid #e5e7eb',
        backgroundColor: 'rgba(255,255,255,0.92)',
      }}
    >
      <Stack spacing={2.5}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          sx={{ alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between' }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 950, mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640 }}>
              {subtitle}
            </Typography>
          </Box>
          <Button
            href={actionHref}
            variant="outlined"
            endIcon={<ArrowForwardOutlinedIcon />}
            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 850 }}
          >
            {actionLabel}
          </Button>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: `repeat(${steps.length}, minmax(0, 1fr))`,
            },
            gap: 1.5,
          }}
        >
          {steps.map((step, index) => (
            <StepCard key={step.title} step={step} index={index} compact={compact} />
          ))}
        </Box>
      </Stack>
    </Paper>
  );
}

export default async function HomePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  return (
    <>
      <Sidebar currentUser={currentUser} />
      <Box
        sx={{
          minHeight: '100vh',
          pl: '96px',
          pr: 3,
          py: 3,
          background:
            'linear-gradient(180deg, #f8fafc 0%, #eef6ff 58%, #f8fafc 100%)',
        }}
      >
        <Container maxWidth={false} disableGutters>
          <Stack spacing={3}>
            <Paper
              elevation={0}
              sx={{
                position: 'relative',
                overflow: 'hidden',
                p: { xs: 3, md: 5 },
                borderRadius: 5,
                border: `1px solid ${hexToRgba(AI_DIGITAL_COLORS.yvesKleinBlue, 0.12)}`,
                background:
                  'linear-gradient(135deg, #ffffff 0%, #eef6ff 54%, #f4fff1 100%)',
              }}
            >
              <Stack
                direction={{ xs: 'column', lg: 'row' }}
                spacing={4}
                sx={{ alignItems: { xs: 'flex-start', lg: 'center' }, justifyContent: 'space-between' }}
              >
                <Stack spacing={2} sx={{ maxWidth: 760 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Image
                      src="/aidlogo.png"
                      alt="AI Onboarding"
                      width={44}
                      height={44}
                      priority
                      style={{ borderRadius: 10 }}
                    />
                    <Chip
                      label={`Welcome, ${currentUser.name}`}
                      sx={{
                        fontWeight: 850,
                        color: AI_DIGITAL_COLORS.yvesKleinBlue,
                        backgroundColor: hexToRgba(AI_DIGITAL_COLORS.skywave, 0.28),
                      }}
                    />
                  </Stack>

                  <Box>
                    <Typography
                      variant="h2"
                      sx={{
                        fontWeight: 950,
                        lineHeight: 0.98,
                        letterSpacing: 0,
                        color: AI_DIGITAL_COLORS.midnightCharcoal,
                        mb: 1.5,
                      }}
                    >
                      Build onboarding once, then let people learn it clearly.
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 700, lineHeight: 1.7 }}>
                      Use the platform either as a team lead creating structured lessons, or as a team member completing assigned learning.
                    </Typography>
                  </Box>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                    <Button
                      href="/library"
                      variant="contained"
                      size="large"
                      startIcon={<LibraryBooksOutlinedIcon />}
                      sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
                    >
                      Open Library
                    </Button>
                    <Button
                      href="/lessons"
                      variant="outlined"
                      size="large"
                      startIcon={<SchoolOutlinedIcon />}
                      sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
                    >
                      My Lessons
                    </Button>
                  </Stack>
                </Stack>

                <Paper
                  elevation={0}
                  sx={{
                    width: { xs: '100%', lg: 360 },
                    p: 2,
                    borderRadius: 4,
                    border: `1px solid ${hexToRgba(AI_DIGITAL_COLORS.yvesKleinBlue, 0.12)}`,
                    backgroundColor: 'rgba(255,255,255,0.72)',
                  }}
                >
                  <Stack spacing={1.25}>
                    {[
                      ['Library', 'Source materials and generated lessons'],
                      ['Lessons', 'Your personal learning queue'],
                      ['Roadmaps', 'Guided learning paths'],
                    ].map(([label, description]) => (
                      <Box
                        key={label}
                        sx={{
                          p: 1.5,
                          borderRadius: 2.5,
                          backgroundColor: '#fff',
                          border: '1px solid #eef2f7',
                        }}
                      >
                        <Typography sx={{ fontWeight: 900 }}>{label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {description}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Stack>
            </Paper>

            <FlowSection
              title="For learners"
              subtitle="Focus on learning: subscribe to lessons, read them, complete activities, and keep progress visible."
              steps={learnerSteps}
              actionHref="/lessons"
              actionLabel="Start learning"
              compact
            />

            <FlowSection
              title="For lesson creators"
              subtitle="Create the learning content: start from raw materials, generate lessons, refine them, and add activities."
              steps={builderSteps}
              actionHref="/library"
              actionLabel="Create content"
            />
          </Stack>
        </Container>
      </Box>
    </>
  );
}
