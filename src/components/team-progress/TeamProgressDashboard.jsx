'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import UserAvatar from '../ui/UserAvatar';

const COLORS = {
  ink: '#0B0B0B',
  slate: '#33344A',
  mute: '#80808E',
  blue: '#0009DC',
  blue50: '#F5F5FE',
  blue100: '#E5E5FA',
  blue200: '#C7C7F0',
  orange: '#FF642D',
  success: '#229E5A',
};

const TYPE = {
  sans: 'var(--ff-sans), Inter, Arial, sans-serif',
  display: 'var(--ff-display), "Barlow Semi Condensed", Inter, Arial, sans-serif',
};

const periodOptions = [
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'quarter', label: 'This quarter' },
];

function Avatar({ user, name, bg, size = 36 }) {
  return (
    <UserAvatar
      user={user || { name, avatarColor: bg }}
      sx={{
        width: size,
        height: size,
        flex: '0 0 auto',
        fontSize: Math.round(size * 0.38),
      }}
    />
  );
}

function Widget({ children, sx }) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: `1px solid ${COLORS.blue100}`,
        borderRadius: 2,
        backgroundColor: '#fff',
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}

function ProgressBar({ value, color = COLORS.blue, height = 8 }) {
  return (
    <Box sx={{ width: '100%', height, borderRadius: 999, overflow: 'hidden', backgroundColor: 'rgba(0,9,220,0.08)' }}>
      <Box sx={{ width: `${Math.min(100, Math.max(0, value))}%`, height: '100%', borderRadius: 999, backgroundColor: color }} />
    </Box>
  );
}

function StatusDot({ status }) {
  const map = {
    'not-started': { color: COLORS.mute, label: 'Not started' },
    'in-progress': { color: COLORS.blue, label: 'In progress' },
    done: { color: COLORS.blue, label: 'Completed' },
  };
  const current = map[status] || map['not-started'];

  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: current.color }}>
      <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'currentColor' }} />
      <Typography sx={{ color: 'inherit', fontSize: 12, fontWeight: 700 }}>{current.label}</Typography>
    </Stack>
  );
}

function KpiCard({ label, value, sub, accent }) {
  return (
    <Widget sx={{ p: { xs: 1.75, md: 2.25 }, minHeight: 124 }}>
      <Typography sx={eyebrowSx}>{label}</Typography>
      <Stack direction="row" spacing={0.85} sx={{ alignItems: 'baseline', mt: 1.5 }}>
        <Typography sx={{ color: accent || COLORS.ink, fontFamily: TYPE.display, fontSize: { xs: 38, md: 48 }, fontWeight: 900, lineHeight: 0.95, letterSpacing: 0 }}>
          {value}
        </Typography>
        {sub && <Typography sx={{ color: COLORS.mute, fontSize: 13, fontWeight: 600 }}>{sub}</Typography>}
      </Stack>
    </Widget>
  );
}

function DashboardSelect({ value, onChange, options, icon }) {
  return (
    <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 190 } }}>
      <Select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        startAdornment={<Box sx={{ mr: 1, color: COLORS.mute, display: 'flex' }}>{icon}</Box>}
        sx={{
          height: 42,
          borderRadius: 999,
          backgroundColor: '#fff',
          color: COLORS.ink,
          fontSize: 13,
          fontWeight: 700,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.blue200 },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.blue },
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.id} value={option.id}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function RoadmapProgress({ roadmaps, scope = 'team' }) {
  return (
    <Widget sx={{ p: { xs: 1.75, md: 2.25 }, height: 286, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography sx={eyebrowSx}>Roadmap progress</Typography>
          <Typography sx={widgetTitleSx}>
            {scope === 'team' ? 'Active roadmaps across team' : 'Assigned roadmaps'}
          </Typography>
        </Box>
        <Tooltip
          arrow
          title={scope === 'team' ? 'Roadmaps currently assigned to people in this team.' : 'Roadmaps assigned to the selected person.'}
        >
          <Chip
            label={`${roadmaps.length} roadmap${roadmaps.length === 1 ? '' : 's'}`}
            size="small"
            sx={{
              height: 26,
              borderRadius: 999,
              color: COLORS.blue,
              backgroundColor: COLORS.blue50,
              fontSize: 11,
              fontWeight: 700,
            }}
          />
        </Tooltip>
      </Stack>
      <Stack spacing={1.5} sx={scrollAreaSx}>
        {roadmaps.length === 0 && <Typography sx={{ color: COLORS.mute, fontSize: 13 }}>No active roadmap assignments yet.</Typography>}
        {roadmaps.map((roadmap) => (
          <Box key={roadmap.id}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
              <Stack direction="row" spacing={1} sx={{ minWidth: 0, alignItems: 'center' }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: roadmap.color }} />
                <Typography noWrap sx={{ color: COLORS.ink, fontSize: 13, fontWeight: 800 }}>{roadmap.name}</Typography>
                <Typography noWrap sx={{ color: COLORS.mute, fontSize: 12 }}>
                  {scope === 'team'
                    ? `${roadmap.learners} learner${roadmap.learners === 1 ? '' : 's'}`
                    : `${roadmap.lessonCount} lesson${roadmap.lessonCount === 1 ? '' : 's'}`}
                </Typography>
              </Stack>
              <Typography sx={{ color: COLORS.slate, fontSize: 12, fontWeight: 800 }}>{roadmap.progress}%</Typography>
            </Stack>
            <ProgressBar value={roadmap.progress} color={roadmap.color} />
          </Box>
        ))}
      </Stack>
    </Widget>
  );
}

function WeeklyChart({ weekly }) {
  const best = weekly.reduce(
    (current, week) => (week.lessons + week.quizzes > current.lessons + current.quizzes ? week : current),
    weekly[0] || { label: 'n/a', lessons: 0, quizzes: 0 }
  );
  const totalLessons = weekly.reduce((total, week) => total + week.lessons, 0);
  const totalQuizzes = weekly.reduce((total, week) => total + week.quizzes, 0);
  const maxSingleValue = Math.max(1, ...weekly.flatMap((week) => [week.lessons, week.quizzes]));

  return (
    <Widget sx={{ p: { xs: 1.75, md: 2.25 }, minHeight: 286 }}>
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', mb: 1.5 }}>
        <Box>
          <Typography sx={eyebrowSx}>Activity over time</Typography>
          <Typography sx={widgetTitleSx}>Last 8 weeks</Typography>
          <Typography sx={{ mt: 0.5, color: COLORS.mute, fontSize: 11 }}>
            Weekly completed lessons and quiz attempts.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Legend color={COLORS.blue} label="Lessons" />
          <Legend color={COLORS.success} label="Quizzes" />
        </Stack>
      </Stack>
      <Box sx={{ height: 148, display: 'flex', alignItems: 'flex-end', gap: 1.25, pt: 0.75 }}>
        {weekly.map((week) => {
          const lessonsHeight = week.lessons === 0 ? 0 : Math.max(5, (week.lessons / maxSingleValue) * 100);
          const quizzesHeight = week.quizzes === 0 ? 0 : Math.max(5, (week.quizzes / maxSingleValue) * 100);
          const total = week.lessons + week.quizzes;
          const isBest = week.label === best.label;

          return (
            <Stack key={week.label} spacing={0.75} sx={{ flex: 1, alignItems: 'center', height: '100%' }}>
              <Tooltip
                arrow
                title={`${week.label}: ${week.lessons} lesson${week.lessons === 1 ? '' : 's'}, ${week.quizzes} ${week.quizzes === 1 ? 'quiz' : 'quizzes'} (${total} total)`}
              >
                <Box
                  sx={{
                    width: '100%',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    gap: 0.5,
                    px: 0.4,
                    borderBottom: isBest ? `2px solid ${COLORS.ink}` : '2px solid transparent',
                  }}
                >
                  <Box sx={{ width: '35%', height: `${lessonsHeight}%`, minHeight: week.lessons ? 4 : 0, borderRadius: '6px 6px 0 0', backgroundColor: COLORS.blue }} />
                  <Box sx={{ width: '35%', height: `${quizzesHeight}%`, minHeight: week.quizzes ? 4 : 0, borderRadius: '6px 6px 0 0', backgroundColor: COLORS.success }} />
                </Box>
              </Tooltip>
              <Typography sx={{ color: isBest ? COLORS.ink : COLORS.mute, fontSize: 11, fontWeight: 800 }}>{week.label.split(' ')[1]}</Typography>
            </Stack>
          );
        })}
      </Box>
      <Typography sx={{ mt: 1.5, pt: 1.25, borderTop: `1px solid ${COLORS.blue100}`, color: COLORS.mute, textAlign: 'center', fontSize: 11 }}>
        Total: <Box component="strong" sx={{ color: COLORS.ink }}>{totalLessons}</Box> lessons + <Box component="strong" sx={{ color: COLORS.ink }}>{totalQuizzes}</Box> quizzes. Best week: <Box component="strong" sx={{ color: COLORS.ink }}>{best.label}</Box>
      </Typography>
    </Widget>
  );
}

function Legend({ color, label }) {
  return (
    <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center' }}>
      <Box sx={{ width: 8, height: 8, borderRadius: 0.5, backgroundColor: color }} />
      <Typography sx={{ color: COLORS.slate, fontSize: 11, fontWeight: 600 }}>{label}</Typography>
    </Stack>
  );
}

function TeamTable({ rows, onOpen }) {
  return (
    <Widget sx={{ overflow: 'hidden' }}>
      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ minWidth: 960 }}>
          <Box sx={tableHeaderSx}>
            {['Member', 'Role', 'Roadmaps', 'Progress', 'Last active', 'Quiz avg', ''].map((heading) => (
              <Typography key={heading} sx={tableHeadingSx}>{heading}</Typography>
            ))}
          </Box>
          {rows.map((member) => (
            <Box key={member.id} sx={tableRowSx}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
                <Avatar user={member} size={36} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ color: COLORS.ink, fontSize: 14, fontWeight: 700 }}>{member.name}</Typography>
                  <StatusDot status={member.status} />
                </Box>
              </Stack>
              <Typography noWrap sx={tableBodySx}>{member.role}</Typography>
              <Typography noWrap sx={tableBodySx}>{member.roadmap}</Typography>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                <ProgressBar
                  value={member.progress}
                  color={member.status === 'done' ? COLORS.success : COLORS.blue}
                  height={7}
                />
                <Typography sx={{ minWidth: 40, textAlign: 'right', color: COLORS.ink, fontSize: 12, fontWeight: 700 }}>{member.progress}%</Typography>
              </Stack>
              <Typography noWrap sx={tableBodySx}>{member.lastActive}</Typography>
              <Typography sx={{ color: member.quiz === null ? COLORS.mute : member.quiz >= 85 ? COLORS.success : member.quiz < 70 ? COLORS.orange : COLORS.ink, fontSize: 13, fontWeight: 700 }}>
                {member.quiz === null ? 'N/A' : `${member.quiz}%`}
              </Typography>
              <Button variant="outlined" size="small" onClick={() => onOpen(member.id)} sx={pillButtonSx}>Open</Button>
            </Box>
          ))}
        </Box>
      </Box>
    </Widget>
  );
}

function IndividualRoadmapGroups({ groups }) {
  const stateMap = {
    completed: { label: 'Completed', color: COLORS.success, bg: 'rgba(34,158,90,0.10)' },
    'in-progress': { label: 'In progress', color: COLORS.blue, bg: COLORS.blue50 },
  };

  return (
    <Widget sx={{ overflow: 'hidden' }}>
      {groups.length === 0 && (
        <Box sx={{ p: 2.5 }}>
          <Typography sx={{ color: COLORS.mute, fontSize: 13 }}>No assigned roadmaps or lessons yet.</Typography>
        </Box>
      )}
      {groups.map((group, groupIndex) => (
        <Box
          key={group.id}
          sx={{
            borderTop: groupIndex === 0 ? 0 : `1px solid ${COLORS.blue100}`,
          }}
        >
          <Box sx={{ p: 2, borderBottom: `1px solid ${COLORS.blue100}`, backgroundColor: '#FAFAFC' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ color: COLORS.ink, fontSize: 16, fontWeight: 700 }}>
                  {group.title}
                </Typography>
                <Typography sx={{ mt: 0.35, color: COLORS.mute, fontSize: 12, fontWeight: 700 }}>
                  {group.completedCount} / {group.lessonCount} lessons completed
                </Typography>
              </Box>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: { xs: '100%', md: 260 } }}>
                <ProgressBar value={group.progress} color={group.progress >= 100 ? COLORS.success : COLORS.blue} height={7} />
                <Typography sx={{ minWidth: 40, color: COLORS.ink, fontSize: 12, fontWeight: 700, textAlign: 'right' }}>
                  {group.progress}%
                </Typography>
              </Stack>
            </Stack>
          </Box>
          <Box sx={individualHeaderSx}>
            {['Lesson', 'State', 'Score', 'When'].map((heading) => (
              <Typography key={heading} sx={tableHeadingSx}>{heading}</Typography>
            ))}
          </Box>
          {group.lessons.map((lesson) => {
            const state = stateMap[lesson.state] || { label: 'Not started', color: COLORS.mute, bg: '#F2F1F3' };

            return (
              <Box key={lesson.id} sx={individualRowSx}>
                <Typography noWrap sx={{ color: COLORS.ink, fontSize: 14, fontWeight: 800 }}>{lesson.title}</Typography>
                <Chip label={state.label} size="small" sx={{ justifySelf: 'start', height: 25, borderRadius: 999, color: state.color, backgroundColor: state.bg, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }} />
                <Typography sx={tableBodySx}>{lesson.score === null ? 'N/A' : `${lesson.score}%`}</Typography>
                <Typography sx={tableBodySx}>{lesson.when}</Typography>
              </Box>
            );
          })}
        </Box>
      ))}
    </Widget>
  );
}

function LowConfidenceLessons({ lessons }) {
  const [selectedLesson, setSelectedLesson] = useState(null);

  return (
    <>
      <Widget sx={{ p: { xs: 1.75, md: 2.25 }, height: 330, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Typography sx={eyebrowSx}>Needs review</Typography>
        <Typography sx={widgetTitleSx}>Low quiz confidence</Typography>
        <Stack spacing={1.25} sx={{ ...scrollAreaSx, mt: 2 }}>
          {lessons.length === 0 && <Typography sx={{ color: COLORS.mute, fontSize: 13 }}>No low-confidence quiz results yet.</Typography>}
          {lessons.map((item) => (
            <Stack key={item.id} direction="row" spacing={1.25} sx={{ alignItems: 'center', p: 1.25, borderRadius: 1.25, border: `1px solid ${COLORS.blue100}`, backgroundColor: '#FAFAFC' }}>
              <Box sx={{ width: 38, height: 38, borderRadius: 1.25, display: 'grid', placeItems: 'center', color: COLORS.orange, backgroundColor: 'rgba(255,100,45,0.12)' }}>
                <ErrorOutlineOutlinedIcon fontSize="small" />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography noWrap sx={{ color: COLORS.ink, fontSize: 13, fontWeight: 700 }}>{item.lesson}</Typography>
                <Typography sx={{ color: COLORS.mute, fontSize: 12 }}>
                  {item.attempts} attempt{item.attempts === 1 ? '' : 's'} - avg quiz {item.avgScore}%
                </Typography>
              </Box>
              <Button size="small" variant="outlined" onClick={() => setSelectedLesson(item)} sx={pillButtonSx}>Review</Button>
            </Stack>
          ))}
        </Stack>
      </Widget>

      <QuizAttemptsDialog
        lesson={selectedLesson}
        open={Boolean(selectedLesson)}
        onClose={() => setSelectedLesson(null)}
      />
    </>
  );
}

function QuizAttemptsDialog({ lesson, open, onClose }) {
  const [personFilter, setPersonFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const attempts = useMemo(() => lesson?.attemptItems || [], [lesson]);
  const people = useMemo(() => {
    const peopleById = new Map();

    attempts.forEach((attempt) => {
      peopleById.set(attempt.userId, {
        id: attempt.userId,
        name: attempt.userName,
      });
    });

    return [...peopleById.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [attempts]);
  const filteredAttempts = attempts.filter((attempt) => {
    const personMatches = personFilter === 'all' || attempt.userId === personFilter;
    const resultMatches =
      resultFilter === 'all' ||
      (resultFilter === 'passed' && attempt.passed) ||
      (resultFilter === 'failed' && !attempt.passed);

    return personMatches && resultMatches;
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pr: 7 }}>
        <Typography sx={{ color: COLORS.mute, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Quiz review
        </Typography>
        <Typography sx={{ color: COLORS.ink, fontSize: 22, fontWeight: 700, lineHeight: 1.15 }}>
          {lesson?.lesson || 'Quiz attempts'}
        </Typography>
        <IconButton aria-label="Close quiz review" onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12 }}>
          <CloseOutlinedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <FormControl size="small" sx={{ minWidth: 190 }}>
                <Select value={personFilter} onChange={(event) => setPersonFilter(event.target.value)}>
                  <MenuItem value="all">All people</MenuItem>
                  {people.map((person) => (
                    <MenuItem key={person.id} value={person.id}>{person.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 170 }}>
                <Select value={resultFilter} onChange={(event) => setResultFilter(event.target.value)}>
                  <MenuItem value="all">All results</MenuItem>
                  <MenuItem value="passed">Passed</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <Typography sx={{ color: COLORS.mute, fontSize: 12, fontWeight: 700, alignSelf: { xs: 'flex-start', sm: 'center' } }}>
              {filteredAttempts.length} of {attempts.length} attempts
            </Typography>
          </Stack>

          <Stack spacing={1}>
            {filteredAttempts.length === 0 && (
              <Typography sx={{ color: COLORS.mute, fontSize: 13, py: 2 }}>
                No attempts match these filters.
              </Typography>
            )}
            {filteredAttempts.map((attempt) => (
              <Stack
                key={attempt.id}
                direction={{ xs: 'column', md: 'row' }}
                spacing={1.25}
                sx={{
                  alignItems: { xs: 'stretch', md: 'center' },
                  p: 1.5,
                  border: `1px solid ${COLORS.blue100}`,
                  borderRadius: 1.25,
                  backgroundColor: '#FAFAFC',
                }}
              >
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0, flex: 1 }}>
                  <Avatar
                    user={{
                      name: attempt.userName,
                      avatarStorageKey: attempt.avatarStorageKey,
                      avatarColor: attempt.avatarColor,
                    }}
                    size={34}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ color: COLORS.ink, fontSize: 14, fontWeight: 700 }}>
                      {attempt.userName}
                    </Typography>
                    <Typography noWrap sx={{ color: COLORS.mute, fontSize: 12 }}>
                      {attempt.activityTitle} - attempt {attempt.attemptNumber}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                  <Chip
                    label={attempt.passed ? 'Passed' : 'Failed'}
                    size="small"
                    sx={{
                      height: 25,
                      borderRadius: 999,
                      color: attempt.passed ? COLORS.success : COLORS.orange,
                      backgroundColor: attempt.passed ? 'rgba(34,158,90,0.10)' : 'rgba(255,100,45,0.12)',
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  />
                  <Typography sx={{ minWidth: 54, color: attempt.score >= 80 ? COLORS.success : COLORS.orange, fontSize: 15, fontWeight: 700, textAlign: 'right' }}>
                    {attempt.score}%
                  </Typography>
                  <Typography sx={{ minWidth: 70, color: COLORS.mute, fontSize: 12, fontWeight: 700 }}>
                    {attempt.correctCount}/{attempt.totalCount}
                  </Typography>
                  <Typography sx={{ minWidth: 82, color: COLORS.mute, fontSize: 12, fontWeight: 700 }}>
                    {formatDateShort(attempt.createdAt)}
                  </Typography>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function ActivityFeed({ activity }) {
  const [range, setRange] = useState('24h');
  const filtered = activity.filter((item) => {
    if (range === '30d') return true;
    if (range === '7d') return item.when.includes('min') || item.when.includes('h') || item.when === 'yesterday' || item.when.includes('d');
    return item.when.includes('min') || item.when.includes('h');
  });

  return (
    <Widget sx={{ p: { xs: 1.75, md: 2.25 }, height: 330, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography sx={eyebrowSx}>Recent activity</Typography>
          <Typography sx={widgetTitleSx}>{range === '24h' ? 'Last 24 hours' : range === '7d' ? 'Last 7 days' : 'Last 30 days'}</Typography>
        </Box>
        <Stack direction="row" sx={{ p: 0.4, borderRadius: 999, backgroundColor: '#F2F1F3' }}>
          {[
            ['24h', '24h'],
            ['7d', '7 days'],
            ['30d', '30 days'],
          ].map(([id, label]) => (
            <Button key={id} onClick={() => setRange(id)} sx={{ minWidth: 0, px: 1.4, py: 0.55, borderRadius: 999, color: range === id ? COLORS.blue : COLORS.slate, backgroundColor: range === id ? '#fff' : 'transparent', fontSize: 11, fontWeight: 700, textTransform: 'none', boxShadow: range === id ? '0 1px 4px rgba(11,11,11,0.08)' : 'none' }}>
              {label}
            </Button>
          ))}
        </Stack>
      </Stack>
      <Stack spacing={0.5} sx={scrollAreaSx}>
        {filtered.length === 0 && <Typography sx={{ color: COLORS.mute, fontSize: 13 }}>No activity in this window.</Typography>}
        {filtered.map((item) => {
          const quizPassed = item.passed ?? item.score >= 80;
          const activityColor = item.kind === 'quiz'
            ? quizPassed
              ? COLORS.success
              : COLORS.orange
            : COLORS.blue;
          const activityBg = item.kind === 'quiz' && !quizPassed ? 'rgba(255,100,45,0.12)' : '#F2F1F3';

          return (
            <Stack key={item.id} direction="row" spacing={1.25} sx={{ py: 1, borderBottom: `1px dashed ${COLORS.blue100}` }}>
              <Avatar
                user={{
                  name: item.who,
                  avatarStorageKey: item.avatarStorageKey,
                  avatarColor: item.avatarColor,
                }}
                size={30}
              />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography component="div" sx={{ color: COLORS.ink, fontSize: 13, lineHeight: 1.45 }}>
                  <Box component="strong" sx={{ fontWeight: 700 }}>{item.who}</Box>{' '}
                  <Box component="span" sx={{ color: COLORS.mute }}>{item.action}</Box>{' '}
                  <Chip icon={item.kind === 'quiz' ? <QuizOutlinedIcon /> : <RouteOutlinedIcon />} label={item.what} size="small" sx={{ maxWidth: '100%', height: 23, borderRadius: 999, color: activityColor, backgroundColor: activityBg, fontSize: 12, fontWeight: 800, verticalAlign: 'middle', '& .MuiChip-icon': { color: 'inherit', fontSize: 14 } }} />
                </Typography>
                <Typography sx={{ mt: 0.4, color: COLORS.mute, fontSize: 11 }}>{item.when}</Typography>
              </Box>
            </Stack>
          );
        })}
      </Stack>
    </Widget>
  );
}

function formatQuizScore(score) {
  return score === null || score === undefined ? 'N/A' : `${score}%`;
}

function formatDateShort(value) {
  if (!value) {
    return 'n/a';
  }

  try {
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: '2-digit',
    }).format(new Date(value));
  } catch {
    return 'n/a';
  }
}

function averageQuizScore(members) {
  const scores = members
    .map((member) => member.quiz)
    .filter((score) => score !== null && score !== undefined);

  if (scores.length === 0) {
    return null;
  }

  return Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
}

function buildRoadmapProgressFromMembers(members, groupsByMemberId = {}) {
  const roadmapsById = new Map();
  const colors = ['#0009DC', '#F0348E', '#42B1CF', '#FF642D', '#229E5A', '#42B1CF'];

  members.forEach((member) => {
    (member.roadmaps || []).forEach((roadmap) => {
      const roadmapGroup = (groupsByMemberId[member.id] || []).find((group) => group.id === roadmap.id);

      if (!roadmapsById.has(roadmap.id)) {
        roadmapsById.set(roadmap.id, {
          id: roadmap.id,
          name: roadmap.title,
          learners: 0,
          progressTotal: 0,
          lessonCount: 0,
        });
      }

      const current = roadmapsById.get(roadmap.id);
      current.learners += 1;
      current.progressTotal += roadmapGroup?.progress || 0;
      current.lessonCount += roadmapGroup?.lessonCount || 0;
    });
  });

  return [...roadmapsById.values()].map((roadmap, index) => ({
    ...roadmap,
    progress: roadmap.learners > 0 ? Math.round(roadmap.progressTotal / roadmap.learners) : 0,
    color: colors[index % colors.length],
  }));
}

function aggregateWeeklyActivity(weeklyRows = [], members = []) {
  const visibleUserIds = new Set(members.map((member) => member.id));
  const totalsByLabel = new Map();

  weeklyRows.forEach((row) => {
    if (!visibleUserIds.has(row.userId)) {
      return;
    }

    const current = totalsByLabel.get(row.label) || {
      label: row.label,
      lessons: 0,
      quizzes: 0,
    };

    current.lessons += row.lessons;
    current.quizzes += row.quizzes;
    totalsByLabel.set(row.label, current);
  });

  return [...totalsByLabel.values()];
}

function buildLowConfidenceLessonsForMembers(lessons = [], members = []) {
  const visibleUserIds = new Set(members.map((member) => member.id));

  return lessons
    .map((lesson) => {
      const attemptItems = (lesson.attemptItems || []).filter((attempt) => visibleUserIds.has(attempt.userId));

      if (attemptItems.length === 0) {
        return null;
      }

      const avgScore = Math.round(
        attemptItems.reduce((total, attempt) => total + Number(attempt.score || 0), 0) / attemptItems.length
      );

      if (avgScore >= 80) {
        return null;
      }

      return {
        ...lesson,
        attempts: attemptItems.length,
        learners: new Set(attemptItems.map((attempt) => attempt.userId)).size,
        avgScore,
        attemptItems,
      };
    })
    .filter(Boolean);
}

export default function TeamProgressDashboard({ initialData }) {
  const [scope, setScope] = useState('team');
  const [period, setPeriod] = useState('month');
  const [includeTeamLead, setIncludeTeamLead] = useState(false);
  const data = initialData;
  const allMembers = useMemo(
    () =>
      (data.members || []).map((member) => ({
        ...member,
        completedInPeriod: member.completedByPeriod?.[period] ?? member.completedInPeriod,
        quiz: member.quizByPeriod?.[period] ?? member.quiz,
      })),
    [data.members, period]
  );
  const hasTeamLead = allMembers.some((member) => member.isTeamLead);
  const members = useMemo(
    () => allMembers.filter((member) => includeTeamLead || !member.isTeamLead),
    [allMembers, includeTeamLead]
  );
  const selectedMember = members.find((member) => member.id === scope);
  const isTeam = scope === 'team';
  const scopeOptions = useMemo(() => [{ id: 'team', label: 'Whole team' }, ...members.map((member) => ({ id: member.id, label: member.name }))], [members]);
  const periodLabel = periodOptions.find((item) => item.id === period)?.label.toLowerCase();
  const teamAverageQuizScore = averageQuizScore(members);
  const learnersInProgress = members.filter((member) => member.status === 'in-progress').length;
  const activeRoadmapCount = new Set(members.flatMap((member) => member.roadmaps.map((roadmap) => roadmap.id))).size;
  const visibleUserIds = useMemo(() => new Set(members.map((member) => member.id)), [members]);
  const displayedWeekly = useMemo(() => aggregateWeeklyActivity(data.weekly || [], members), [data.weekly, members]);
  const displayedLowConfidenceLessons = useMemo(
    () => buildLowConfidenceLessonsForMembers(data.lowConfidenceLessons || [], members),
    [data.lowConfidenceLessons, members]
  );
  const displayedRecentActivity = useMemo(
    () => (data.recentActivity || []).filter((item) => visibleUserIds.has(item.userId)),
    [data.recentActivity, visibleUserIds]
  );
  const kpis = isTeam
    ? [
        { label: 'Roadmaps in progress', value: activeRoadmapCount, sub: 'across team' },
        { label: 'Lessons completed', value: members.reduce((total, member) => total + member.completedInPeriod, 0), sub: periodLabel },
        {
          label: 'Avg quiz score',
          value: formatQuizScore(teamAverageQuizScore),
          sub: teamAverageQuizScore === null ? 'no attempts yet' : undefined,
          accent: teamAverageQuizScore === null ? COLORS.mute : COLORS.success,
        },
        { label: 'Learners in progress', value: learnersInProgress, sub: 'started learning', accent: COLORS.blue },
      ]
    : [
        { label: 'Active roadmaps', value: selectedMember?.roadmapCount || 0, sub: 'assigned' },
        { label: 'Lessons completed', value: selectedMember?.roadmapCompletedCount || 0, sub: `/ ${selectedMember?.roadmapLessonCount || 0} across roadmaps` },
        { label: 'Avg quiz score', value: formatQuizScore(selectedMember?.quiz), sub: selectedMember?.quiz === null ? 'no attempts yet' : undefined, accent: (selectedMember?.quiz || 0) >= 85 ? COLORS.success : COLORS.ink },
        { label: 'Learning status', value: selectedMember?.status === 'done' ? 'Done' : selectedMember?.status === 'in-progress' ? 'Active' : 'New', sub: selectedMember?.lastActive || '', accent: COLORS.blue },
      ];
  const visibleRoadmapGroups = selectedMember ? data.individualRoadmapsByMemberId?.[selectedMember.id] || [] : [];
  const visibleLessonCount = visibleRoadmapGroups.reduce((total, group) => total + group.lessonCount, 0);
  const displayedRoadmaps = isTeam
    ? buildRoadmapProgressFromMembers(members, data.individualRoadmapsByMemberId)
    : visibleRoadmapGroups
        .filter((group) => group.id !== 'standalone-lessons')
        .map((group, index) => ({
          id: group.id,
          name: group.title,
          learners: 1,
          lessonCount: group.lessonCount,
          progress: group.progress,
          color: ['#0009DC', '#F0348E', '#42B1CF', '#FF642D'][index % 4],
        }));
  return (
    <Box sx={{ minHeight: 'calc(100vh - 48px)', color: COLORS.ink, fontFamily: TYPE.sans }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.25} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', lg: 'flex-start' }, mb: 2.5 }}>
        <Box>
          <Typography sx={{ color: COLORS.blue, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1 }}>
            Team progress - {data.teamName}
          </Typography>
          <Typography component="h1" sx={{ color: COLORS.ink, fontFamily: TYPE.display, fontSize: { xs: 48, md: 72 }, fontWeight: 900, letterSpacing: 0, lineHeight: 0.92 }}>
            {isTeam ? 'How the team is doing' : selectedMember?.name}
          </Typography>
          <Typography sx={{ mt: 1.25, color: COLORS.slate, fontSize: 15, lineHeight: 1.5 }}>
            {isTeam ? `${members.length} learners across ${activeRoadmapCount} active roadmaps.` : `${selectedMember?.role || 'Member'} - ${selectedMember?.roadmap || 'No roadmap assigned'}`}
          </Typography>
        </Box>
        <Stack spacing={1.25} sx={{ alignItems: { xs: 'stretch', lg: 'flex-end' } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <DashboardSelect value={scope} onChange={setScope} options={scopeOptions} icon={isTeam ? <GroupsOutlinedIcon fontSize="small" /> : <PersonOutlineOutlinedIcon fontSize="small" />} />
            <DashboardSelect value={period} onChange={setPeriod} options={periodOptions} icon={<CalendarMonthOutlinedIcon fontSize="small" />} />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            {hasTeamLead && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeTeamLead}
                    onChange={(event) => {
                      const shouldInclude = event.target.checked;

                      if (!shouldInclude && selectedMember?.isTeamLead) {
                        setScope('team');
                      }

                      setIncludeTeamLead(shouldInclude);
                    }}
                    size="small"
                  />
                }
                label="Include me"
                sx={{
                  height: 42,
                  mx: 0,
                  px: 1.5,
                  border: `1px solid ${COLORS.blue200}`,
                  borderRadius: 999,
                  backgroundColor: '#fff',
                  color: COLORS.slate,
                  '& .MuiFormControlLabel-label': {
                    fontSize: 12,
                    fontWeight: 700,
                  },
                }}
              />
            )}
            <Button variant="contained" startIcon={<AddOutlinedIcon />} href="/roadmaps" sx={primaryButtonSx}>Assign roadmap</Button>
          </Stack>
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 1.5, mb: 2 }}>
        {kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' }, gap: 1.5, mb: 2 }}>
        <RoadmapProgress roadmaps={displayedRoadmaps} scope={isTeam ? 'team' : 'person'} />
        <WeeklyChart weekly={displayedWeekly} />
      </Box>
      <Box sx={{ mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', mb: 1.25, px: 0.5 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
            {!isTeam && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<ArrowBackOutlinedIcon />}
                onClick={() => setScope('team')}
                sx={backButtonSx}
              >
                Team
              </Button>
            )}
            <Box sx={{ minWidth: 0 }}>
              <Typography component="h2" sx={{ color: COLORS.ink, fontSize: 18, fontWeight: 700 }}>
                {isTeam ? 'Team members' : 'Roadmaps and lessons'}
              </Typography>
              {!isTeam && (
                <Typography noWrap sx={{ color: COLORS.mute, fontSize: 12, fontWeight: 700 }}>
                  {selectedMember?.name}
                </Typography>
              )}
            </Box>
          </Stack>
          <Typography sx={{ color: COLORS.mute, fontSize: 12 }}>
            {isTeam ? `${members.length} members` : `${visibleRoadmapGroups.length} roadmap${visibleRoadmapGroups.length === 1 ? '' : 's'} - ${visibleLessonCount} lessons total`}
          </Typography>
        </Stack>
        {isTeam ? <TeamTable rows={members} onOpen={setScope} /> : <IndividualRoadmapGroups groups={visibleRoadmapGroups} />}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1.5 }}>
        <LowConfidenceLessons lessons={displayedLowConfidenceLessons} />
        <ActivityFeed activity={displayedRecentActivity} />
      </Box>
    </Box>
  );
}

const eyebrowSx = { color: COLORS.mute, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' };
const widgetTitleSx = { mt: 0.5, color: COLORS.ink, fontSize: 16, fontWeight: 700 };
const tableHeaderSx = { display: 'grid', gridTemplateColumns: '2fr 1.1fr 1.55fr 1.6fr 1fr 0.75fr 0.65fr', gap: 1.5, alignItems: 'center', px: 2.25, py: 1.35, borderBottom: `1px solid ${COLORS.blue100}`, backgroundColor: '#FAFAFC' };
const tableRowSx = { display: 'grid', gridTemplateColumns: '2fr 1.1fr 1.55fr 1.6fr 1fr 0.75fr 0.65fr', gap: 1.5, alignItems: 'center', px: 2.25, py: 1.45, borderBottom: `1px solid ${COLORS.blue100}`, '&:last-of-type': { borderBottom: 0 } };
const individualHeaderSx = { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 1.5, alignItems: 'center', px: 2.25, py: 1.35, borderBottom: `1px solid ${COLORS.blue100}`, backgroundColor: '#FAFAFC' };
const individualRowSx = { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 1.5, alignItems: 'center', px: 2.25, py: 1.45, borderBottom: `1px solid ${COLORS.blue100}`, '&:last-of-type': { borderBottom: 0 } };
const tableHeadingSx = { color: COLORS.mute, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' };
const tableBodySx = { color: COLORS.slate, fontSize: 13, fontWeight: 600 };
const scrollAreaSx = { flex: '1 1 auto', minHeight: 0, overflowY: 'auto', pr: 0.5 };
const pillButtonSx = { justifySelf: 'end', minWidth: 74, borderRadius: 999, borderColor: COLORS.blue200, color: COLORS.blue, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', '&:hover': { borderColor: COLORS.blue, backgroundColor: COLORS.blue50 } };
const backButtonSx = { flexShrink: 0, minHeight: 32, borderRadius: 999, borderColor: COLORS.blue200, color: COLORS.blue, px: 1.25, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', '&:hover': { borderColor: COLORS.blue, backgroundColor: COLORS.blue50 } };
const primaryButtonSx = { minHeight: 42, borderRadius: 999, backgroundColor: COLORS.blue, px: 2.25, boxShadow: 'none', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', '&:hover': { backgroundColor: COLORS.blue, boxShadow: 'none' } };
