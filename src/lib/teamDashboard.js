import { db } from './db.js';
import { USER_ROLES } from './auth.js';
import { ensureLessonsSchema } from './lessons.js';
import { ensureRoadmapsSchema } from './roadmaps.js';
import { getAllUsers, getTeams } from './teams.js';

const TEAM_COLORS = ['#0009DC', '#F0348E', '#42B1CF', '#FF642D', '#884DCC', '#229E5A', '#00B5FF', '#0B0B0B'];

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatRelativeTime(value) {
  if (!value) {
    return 'no activity';
  }

  const diffMs = Date.now() - new Date(value).getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) {
    return `${Math.max(1, Math.round(diffMs / minute))} min ago`;
  }

  if (diffMs < day) {
    return `${Math.round(diffMs / hour)} h ago`;
  }

  if (diffMs < 2 * day) {
    return 'yesterday';
  }

  return `${Math.round(diffMs / day)} d ago`;
}

function uniqById(users = []) {
  const seen = new Set();

  return users.filter((user) => {
    if (!user?.id || seen.has(user.id)) {
      return false;
    }

    seen.add(user.id);
    return true;
  });
}

async function getVisibleTeamScope(viewer) {
  const teams = await getTeams();
  const ownTeam = teams.find((team) => team.lead?.id === viewer?.id);

  if (ownTeam) {
    return {
      label: 'My team',
      leadId: ownTeam.lead?.id || '',
      members: uniqById([ownTeam.lead, ...(ownTeam.members || [])]),
    };
  }

  if (viewer?.role === USER_ROLES.ADMIN) {
    const teamMembers = teams.flatMap((team) => team.members || []);

    if (teamMembers.length > 0) {
      return {
        label: 'Organization',
        members: uniqById(teamMembers),
      };
    }

    const users = await getAllUsers();
    return {
      label: 'Organization',
      members: users.filter((user) => user.id !== viewer.id && user.role !== USER_ROLES.ADMIN),
    };
  }

  return {
    label: 'My team',
    members: [],
  };
}

async function getMemberStats(memberIds, period, leadId = '') {
  if (memberIds.length === 0) {
    return [];
  }

  const result = await db.query(
    `
      WITH roadmap_summary AS (
        SELECT
          user_roadmaps.user_id,
          COUNT(*)::int AS roadmap_count,
          ARRAY_AGG(roadmaps.id ORDER BY user_roadmaps.enrolled_at DESC) AS roadmap_ids,
          ARRAY_AGG(roadmaps.title ORDER BY user_roadmaps.enrolled_at DESC) AS roadmap_titles
        FROM user_roadmaps
        JOIN roadmaps ON roadmaps.id = user_roadmaps.roadmap_id
        WHERE user_roadmaps.user_id = ANY($1::uuid[])
        GROUP BY user_roadmaps.user_id
      ),
      roadmap_lesson_progress AS (
        SELECT
          roadmap_lessons_for_user.user_id,
          COUNT(roadmap_lessons_for_user.lesson_id)::int AS lesson_count,
          COUNT(user_lessons.lesson_id) FILTER (WHERE user_lessons.completed_at IS NOT NULL)::int AS completed_count
        FROM (
          SELECT DISTINCT user_roadmaps.user_id, roadmap_lessons.lesson_id
          FROM user_roadmaps
          JOIN roadmap_lessons ON roadmap_lessons.roadmap_id = user_roadmaps.roadmap_id
          WHERE user_roadmaps.user_id = ANY($1::uuid[])
        ) roadmap_lessons_for_user
        LEFT JOIN user_lessons
          ON user_lessons.user_id = roadmap_lessons_for_user.user_id
          AND user_lessons.lesson_id = roadmap_lessons_for_user.lesson_id
        GROUP BY roadmap_lessons_for_user.user_id
      ),
      completions AS (
        SELECT
          user_id,
          COUNT(*) FILTER (
            WHERE completed_at IS NOT NULL
              AND completed_at >= NOW() - INTERVAL '7 days'
          )::int AS completed_week,
          COUNT(*) FILTER (
            WHERE completed_at IS NOT NULL
              AND completed_at >= NOW() - INTERVAL '30 days'
          )::int AS completed_month,
          COUNT(*) FILTER (
            WHERE completed_at IS NOT NULL
              AND completed_at >= NOW() - INTERVAL '90 days'
          )::int AS completed_quarter,
          COUNT(*) FILTER (WHERE completed_at IS NULL)::int AS open_assignments,
          MAX(GREATEST(enrolled_at, COALESCE(completed_at, enrolled_at))) AS last_lesson_at
        FROM user_lessons
        WHERE user_id = ANY($1::uuid[])
        GROUP BY user_id
      ),
      quiz_scores AS (
        SELECT
          user_id,
          ROUND(AVG(score) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days'))::int AS avg_score_week,
          ROUND(AVG(score) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'))::int AS avg_score_month,
          ROUND(AVG(score) FILTER (WHERE created_at >= NOW() - INTERVAL '90 days'))::int AS avg_score_quarter,
          MAX(created_at) AS last_quiz_at
        FROM user_lesson_activity_attempts
        WHERE user_id = ANY($1::uuid[])
          AND type = 'quiz'
        GROUP BY user_id
      )
      SELECT
        users.id,
        users.name,
        users.email,
        users.role,
        users.position,
        users.avatar_storage_key,
        users.avatar_color,
        COALESCE(roadmap_summary.roadmap_count, 0)::int AS roadmap_count,
        COALESCE(roadmap_summary.roadmap_ids, ARRAY[]::text[]) AS roadmap_ids,
        COALESCE(roadmap_summary.roadmap_titles, ARRAY[]::text[]) AS roadmap_titles,
        COALESCE(roadmap_lesson_progress.lesson_count, 0)::int AS roadmap_lesson_count,
        COALESCE(roadmap_lesson_progress.completed_count, 0)::int AS roadmap_completed_count,
        COALESCE(completions.completed_week, 0)::int AS completed_week,
        COALESCE(completions.completed_month, 0)::int AS completed_month,
        COALESCE(completions.completed_quarter, 0)::int AS completed_quarter,
        COALESCE(completions.open_assignments, 0)::int AS open_assignments,
        quiz_scores.avg_score_week::int AS avg_quiz_score_week,
        quiz_scores.avg_score_month::int AS avg_quiz_score_month,
        quiz_scores.avg_score_quarter::int AS avg_quiz_score_quarter,
        GREATEST(completions.last_lesson_at, quiz_scores.last_quiz_at) AS last_active_at
      FROM users
      LEFT JOIN roadmap_summary ON roadmap_summary.user_id = users.id
      LEFT JOIN roadmap_lesson_progress ON roadmap_lesson_progress.user_id = users.id
      LEFT JOIN completions ON completions.user_id = users.id
      LEFT JOIN quiz_scores ON quiz_scores.user_id = users.id
      WHERE users.id = ANY($1::uuid[])
      ORDER BY users.name ASC
    `,
    [memberIds]
  );

  return result.rows.map((row, index) => {
    const roadmapTitles = Array.isArray(row.roadmap_titles) ? row.roadmap_titles.filter(Boolean) : [];
    const roadmapIds = Array.isArray(row.roadmap_ids) ? row.roadmap_ids.filter(Boolean) : [];
    const roadmapCount = toNumber(row.roadmap_count);
    const total = toNumber(row.roadmap_lesson_count);
    const completed = toNumber(row.roadmap_completed_count);
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    const hasStarted = completed > 0 || Boolean(row.last_active_at);
    const status = progress >= 100 ? 'done' : hasStarted ? 'in-progress' : 'not-started';

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.position || row.role,
      isTeamLead: row.id === leadId,
      roadmap:
        roadmapCount === 0
          ? 'No roadmap assigned'
          : roadmapCount === 1
            ? roadmapTitles[0]
            : `${roadmapCount} active roadmaps`,
      roadmapId: roadmapIds[0] || '',
      roadmapCount,
      roadmaps: roadmapIds.map((id, roadmapIndex) => ({
        id,
        title: roadmapTitles[roadmapIndex] || 'Untitled roadmap',
      })),
      roadmapLessonCount: total,
      roadmapCompletedCount: completed,
      progress,
      completedInPeriod: toNumber(row[`completed_${period}`]),
      completedByPeriod: {
        week: toNumber(row.completed_week),
        month: toNumber(row.completed_month),
        quarter: toNumber(row.completed_quarter),
      },
      openAssignments: toNumber(row.open_assignments),
      quiz: row[`avg_quiz_score_${period}`] === null ? null : toNumber(row[`avg_quiz_score_${period}`]),
      quizByPeriod: {
        week: row.avg_quiz_score_week === null ? null : toNumber(row.avg_quiz_score_week),
        month: row.avg_quiz_score_month === null ? null : toNumber(row.avg_quiz_score_month),
        quarter: row.avg_quiz_score_quarter === null ? null : toNumber(row.avg_quiz_score_quarter),
      },
      status,
      lastActiveAt: row.last_active_at,
      lastActive: formatRelativeTime(row.last_active_at),
      avatarBg: row.avatar_color || TEAM_COLORS[index % TEAM_COLORS.length],
      avatarStorageKey: row.avatar_storage_key || '',
      avatarColor: row.avatar_color || '',
    };
  });
}

async function getRoadmapStats(memberIds) {
  if (memberIds.length === 0) {
    return [];
  }

  const result = await db.query(
    `
      WITH roadmap_totals AS (
        SELECT roadmap_id, COUNT(*)::int AS lesson_count
        FROM roadmap_lessons
        GROUP BY roadmap_id
      ),
      enrolled AS (
        SELECT
          user_roadmaps.roadmap_id,
          user_roadmaps.user_id,
          COALESCE(roadmap_totals.lesson_count, 0)::int AS lesson_count
        FROM user_roadmaps
        LEFT JOIN roadmap_totals ON roadmap_totals.roadmap_id = user_roadmaps.roadmap_id
        WHERE user_roadmaps.user_id = ANY($1::uuid[])
      ),
      completed AS (
        SELECT
          enrolled.roadmap_id,
          enrolled.user_id,
          COUNT(user_lessons.lesson_id)::int AS completed_count
        FROM enrolled
        JOIN roadmap_lessons ON roadmap_lessons.roadmap_id = enrolled.roadmap_id
        LEFT JOIN user_lessons
          ON user_lessons.user_id = enrolled.user_id
          AND user_lessons.lesson_id = roadmap_lessons.lesson_id
          AND user_lessons.completed_at IS NOT NULL
        GROUP BY enrolled.roadmap_id, enrolled.user_id
      )
      SELECT
        roadmaps.id,
        roadmaps.title,
        COUNT(enrolled.user_id)::int AS learners,
        COALESCE(MAX(enrolled.lesson_count), 0)::int AS lesson_count,
        ROUND(AVG(
          CASE
            WHEN enrolled.lesson_count > 0 THEN (completed.completed_count::numeric / enrolled.lesson_count) * 100
            ELSE 0
          END
        ))::int AS avg_progress
      FROM enrolled
      JOIN roadmaps ON roadmaps.id = enrolled.roadmap_id
      LEFT JOIN completed
        ON completed.roadmap_id = enrolled.roadmap_id
        AND completed.user_id = enrolled.user_id
      GROUP BY roadmaps.id, roadmaps.title
      ORDER BY learners DESC, roadmaps.title ASC
      LIMIT 6
    `,
    [memberIds]
  );

  return result.rows.map((row, index) => ({
    id: row.id,
    name: row.title,
    learners: toNumber(row.learners),
    lessonCount: toNumber(row.lesson_count),
    progress: toNumber(row.avg_progress),
    color: TEAM_COLORS[index % TEAM_COLORS.length],
  }));
}

async function getWeeklyActivity(memberIds) {
  if (memberIds.length === 0) {
    return [];
  }

  const result = await db.query(
    `
      WITH weeks AS (
        SELECT generate_series(
          date_trunc('week', NOW()) - INTERVAL '7 weeks',
          date_trunc('week', NOW()),
          INTERVAL '1 week'
        ) AS week_start
      ),
      selected_users AS (
        SELECT UNNEST($1::uuid[]) AS user_id
      ),
      lessons AS (
        SELECT user_id, date_trunc('week', completed_at) AS week_start, COUNT(*)::int AS count
        FROM user_lessons
        WHERE user_id = ANY($1::uuid[])
          AND completed_at >= date_trunc('week', NOW()) - INTERVAL '7 weeks'
        GROUP BY user_id, date_trunc('week', completed_at)
      ),
      quizzes AS (
        SELECT user_id, date_trunc('week', created_at) AS week_start, COUNT(*)::int AS count
        FROM user_lesson_activity_attempts
        WHERE user_id = ANY($1::uuid[])
          AND type = 'quiz'
          AND created_at >= date_trunc('week', NOW()) - INTERVAL '7 weeks'
        GROUP BY user_id, date_trunc('week', created_at)
      )
      SELECT
        selected_users.user_id,
        weeks.week_start,
        COALESCE(lessons.count, 0)::int AS lessons,
        COALESCE(quizzes.count, 0)::int AS quizzes
      FROM weeks
      CROSS JOIN selected_users
      LEFT JOIN lessons
        ON lessons.user_id = selected_users.user_id
        AND lessons.week_start = weeks.week_start
      LEFT JOIN quizzes
        ON quizzes.user_id = selected_users.user_id
        AND quizzes.week_start = weeks.week_start
      ORDER BY weeks.week_start ASC, selected_users.user_id ASC
    `,
    [memberIds]
  );

  return result.rows.map((row) => ({
    userId: row.user_id,
    label: new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit' }).format(new Date(row.week_start)),
    lessons: toNumber(row.lessons),
    quizzes: toNumber(row.quizzes),
  }));
}

async function getLowConfidenceLessons(memberIds) {
  if (memberIds.length === 0) {
    return [];
  }

  const result = await db.query(
    `
      SELECT
        lessons.id,
        lessons.title,
        COUNT(user_lesson_activity_attempts.id)::int AS attempts,
        COUNT(DISTINCT user_lesson_activity_attempts.user_id)::int AS learners,
        ROUND(AVG(user_lesson_activity_attempts.score))::int AS avg_score,
        JSONB_AGG(
          JSONB_BUILD_OBJECT(
            'id', user_lesson_activity_attempts.id,
            'userId', users.id,
            'userName', users.name,
            'userEmail', users.email,
            'avatarStorageKey', users.avatar_storage_key,
            'avatarColor', users.avatar_color,
            'activityId', lesson_activities.id,
            'activityTitle', COALESCE(NULLIF(lesson_activities.title, ''), 'Quiz'),
            'attemptNumber', user_lesson_activity_attempts.attempt_number,
            'score', user_lesson_activity_attempts.score,
            'passed', user_lesson_activity_attempts.passed,
            'correctCount', user_lesson_activity_attempts.correct_count,
            'totalCount', user_lesson_activity_attempts.total_count,
            'createdAt', user_lesson_activity_attempts.created_at
          )
          ORDER BY user_lesson_activity_attempts.created_at DESC
        ) AS attempt_items
      FROM user_lesson_activity_attempts
      JOIN lessons ON lessons.id = user_lesson_activity_attempts.lesson_id
      JOIN users ON users.id = user_lesson_activity_attempts.user_id
      JOIN lesson_activities ON lesson_activities.id = user_lesson_activity_attempts.activity_id
      WHERE user_lesson_activity_attempts.user_id = ANY($1::uuid[])
        AND user_lesson_activity_attempts.type = 'quiz'
      GROUP BY lessons.id, lessons.title
      HAVING AVG(user_lesson_activity_attempts.score) < 80
      ORDER BY avg_score ASC, attempts DESC, lessons.title ASC
      LIMIT 4
    `,
    [memberIds]
  );

  return result.rows.map((row) => ({
    id: row.id,
    lesson: row.title,
    attempts: toNumber(row.attempts),
    learners: toNumber(row.learners),
    avgScore: toNumber(row.avg_score),
    attemptItems: Array.isArray(row.attempt_items) ? row.attempt_items : [],
  }));
}

async function getRecentActivity(memberIds) {
  if (memberIds.length === 0) {
    return [];
  }

  const result = await db.query(
    `
      SELECT *
      FROM (
        SELECT
          'lesson' AS kind,
          user_lessons.completed_at AS happened_at,
          users.id AS user_id,
          users.name AS who,
          users.avatar_storage_key,
          users.avatar_color,
          lessons.title AS what,
          NULL::numeric AS score,
          NULL::boolean AS passed
        FROM user_lessons
        JOIN users ON users.id = user_lessons.user_id
        JOIN lessons ON lessons.id = user_lessons.lesson_id
        WHERE user_lessons.user_id = ANY($1::uuid[])
          AND user_lessons.completed_at IS NOT NULL
        UNION ALL
        SELECT
          'quiz' AS kind,
          user_lesson_activity_attempts.created_at AS happened_at,
          users.id AS user_id,
          users.name AS who,
          users.avatar_storage_key,
          users.avatar_color,
          lesson_activities.title AS what,
          user_lesson_activity_attempts.score,
          user_lesson_activity_attempts.passed
        FROM user_lesson_activity_attempts
        JOIN users ON users.id = user_lesson_activity_attempts.user_id
        JOIN lesson_activities ON lesson_activities.id = user_lesson_activity_attempts.activity_id
        WHERE user_lesson_activity_attempts.user_id = ANY($1::uuid[])
          AND user_lesson_activity_attempts.type = 'quiz'
      ) activity
      ORDER BY happened_at DESC
      LIMIT 12
    `,
    [memberIds]
  );

  const fallbackColorByUserId = new Map();

  return result.rows.map((row, index) => {
    if (!fallbackColorByUserId.has(row.user_id)) {
      fallbackColorByUserId.set(row.user_id, TEAM_COLORS[fallbackColorByUserId.size % TEAM_COLORS.length]);
    }

    return {
      id: `${row.kind}-${index}-${new Date(row.happened_at).getTime()}`,
      userId: row.user_id,
      who: row.who,
      action: row.kind === 'quiz' ? 'scored' : 'finished',
      what: row.kind === 'quiz' ? `${toNumber(row.score)}% on ${row.what || 'quiz'}` : row.what,
      when: formatRelativeTime(row.happened_at),
      kind: row.kind,
      score: row.score === null ? null : toNumber(row.score),
      passed: row.passed,
      avatarBg: row.avatar_color || fallbackColorByUserId.get(row.user_id),
      avatarStorageKey: row.avatar_storage_key || '',
      avatarColor: row.avatar_color || '',
    };
  });
}

async function getIndividualRoadmapDetails(memberId) {
  if (!memberId) {
    return [];
  }

  const result = await db.query(
    `
      SELECT
        roadmaps.id AS roadmap_id,
        roadmaps.title AS roadmap_title,
        user_roadmaps.enrolled_at AS roadmap_enrolled_at,
        roadmap_lessons.sort_order,
        lessons.id,
        lessons.title,
        user_lessons.completed_at,
        user_lessons.enrolled_at,
        ROUND(AVG(user_lesson_activity_attempts.score))::int AS avg_score,
        MAX(user_lesson_activity_attempts.created_at) AS last_quiz_at
      FROM user_roadmaps
      JOIN roadmaps ON roadmaps.id = user_roadmaps.roadmap_id
      JOIN roadmap_lessons ON roadmap_lessons.roadmap_id = roadmaps.id
      JOIN lessons ON lessons.id = roadmap_lessons.lesson_id
      LEFT JOIN user_lessons
        ON user_lessons.user_id = user_roadmaps.user_id
        AND user_lessons.lesson_id = lessons.id
      LEFT JOIN user_lesson_activity_attempts
        ON user_lesson_activity_attempts.lesson_id = lessons.id
        AND user_lesson_activity_attempts.user_id = user_roadmaps.user_id
        AND user_lesson_activity_attempts.type = 'quiz'
      WHERE user_roadmaps.user_id = $1
      GROUP BY
        roadmaps.id,
        roadmaps.title,
        user_roadmaps.enrolled_at,
        roadmap_lessons.sort_order,
        lessons.id,
        lessons.title,
        user_lessons.completed_at,
        user_lessons.enrolled_at
      ORDER BY user_roadmaps.enrolled_at DESC, roadmap_lessons.sort_order ASC
    `,
    [memberId]
  );

  const groupsByRoadmapId = new Map();

  for (const row of result.rows) {
    if (!groupsByRoadmapId.has(row.roadmap_id)) {
      groupsByRoadmapId.set(row.roadmap_id, {
        id: row.roadmap_id,
        title: row.roadmap_title,
        enrolledAt: row.roadmap_enrolled_at,
        lessons: [],
      });
    }

    groupsByRoadmapId.get(row.roadmap_id).lessons.push({
      id: row.id,
      title: row.title,
      state: row.completed_at ? 'completed' : 'in-progress',
      score: row.avg_score === null ? null : toNumber(row.avg_score),
      when: formatRelativeTime(row.completed_at || row.last_quiz_at || row.enrolled_at || row.roadmap_enrolled_at),
    });
  }

  const standaloneResult = await db.query(
    `
      SELECT
        lessons.id,
        lessons.title,
        user_lessons.completed_at,
        user_lessons.enrolled_at,
        ROUND(AVG(user_lesson_activity_attempts.score))::int AS avg_score,
        MAX(user_lesson_activity_attempts.created_at) AS last_quiz_at
      FROM user_lessons
      JOIN lessons ON lessons.id = user_lessons.lesson_id
      LEFT JOIN user_lesson_activity_attempts
        ON user_lesson_activity_attempts.lesson_id = lessons.id
        AND user_lesson_activity_attempts.user_id = user_lessons.user_id
        AND user_lesson_activity_attempts.type = 'quiz'
      WHERE user_lessons.user_id = $1
        AND NOT EXISTS (
          SELECT 1
          FROM user_roadmaps
          JOIN roadmap_lessons ON roadmap_lessons.roadmap_id = user_roadmaps.roadmap_id
          WHERE user_roadmaps.user_id = user_lessons.user_id
            AND roadmap_lessons.lesson_id = user_lessons.lesson_id
        )
      GROUP BY lessons.id, lessons.title, user_lessons.completed_at, user_lessons.enrolled_at
      ORDER BY user_lessons.completed_at ASC NULLS FIRST, user_lessons.enrolled_at DESC
    `,
    [memberId]
  );

  const groups = [...groupsByRoadmapId.values()];

  if (standaloneResult.rows.length > 0) {
    groups.push({
      id: 'standalone-lessons',
      title: 'Individual lessons',
      enrolledAt: null,
      lessons: standaloneResult.rows.map((row) => ({
        id: row.id,
        title: row.title,
        state: row.completed_at ? 'completed' : 'in-progress',
        score: row.avg_score === null ? null : toNumber(row.avg_score),
        when: formatRelativeTime(row.completed_at || row.last_quiz_at || row.enrolled_at),
      })),
    });
  }

  return groups.map((group) => {
    const lessonCount = group.lessons.length;
    const completedCount = group.lessons.filter((lesson) => lesson.state === 'completed').length;

    return {
      ...group,
      lessonCount,
      completedCount,
      progress: lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0,
    };
  });
}

export async function getTeamDashboardData(viewer, period = 'month') {
  await ensureRoadmapsSchema();
  await ensureLessonsSchema();

  const teamScope = await getVisibleTeamScope(viewer);
  const members = teamScope.members;
  const memberIds = members.map((member) => member.id);
  const [memberStats, roadmaps, weekly, lowConfidenceLessons, recentActivity] = await Promise.all([
    getMemberStats(memberIds, period, teamScope.leadId),
    getRoadmapStats(memberIds),
    getWeeklyActivity(memberIds),
    getLowConfidenceLessons(memberIds),
    getRecentActivity(memberIds),
  ]);
  const individualRoadmapsByMemberId = Object.fromEntries(
    await Promise.all(memberIds.map(async (memberId) => [memberId, await getIndividualRoadmapDetails(memberId)]))
  );
  const quizScores = memberStats
    .map((member) => member.quiz)
    .filter((score) => score !== null && score !== undefined);
  const avgQuizScore =
    quizScores.length > 0
      ? Math.round(quizScores.reduce((total, score) => total + score, 0) / quizScores.length)
      : null;
  const activeRoadmaps = new Set(
    memberStats.flatMap((member) => member.roadmaps.map((roadmap) => roadmap.id)).filter(Boolean)
  );

  return {
    teamName: teamScope.label,
    refreshedAt: new Date().toISOString(),
    members: memberStats,
    roadmaps,
    weekly,
    lowConfidenceLessons,
    recentActivity,
    individualRoadmapsByMemberId,
    kpis: {
      activeRoadmaps: activeRoadmaps.size,
      lessonsCompleted: memberStats.reduce((total, member) => total + member.completedInPeriod, 0),
      avgQuizScore,
    },
  };
}
