import { getHeyGenVideo } from './heygen';
import { updateLessonContent } from './lessons';

const TEACHER_VIDEO_REFRESH_BUFFER_MS = 6 * 60 * 60 * 1000;
const TEACHER_VIDEO_ACTIVE_STATUSES = new Set(['pending', 'processing', 'generating']);

export function getSignedUrlExpiresAt(url = '') {
  if (!url) {
    return null;
  }

  try {
    const expires = new URL(url).searchParams.get('Expires');
    const expiresSeconds = Number.parseInt(expires || '', 10);

    return Number.isFinite(expiresSeconds) ? expiresSeconds * 1000 : null;
  } catch {
    return null;
  }
}

export function shouldRefreshTeacherVideoUrl(teacherVideo = {}, options = {}) {
  const { force = false, now = Date.now(), bufferMs = TEACHER_VIDEO_REFRESH_BUFFER_MS } = options;

  if (!teacherVideo.videoId) {
    return false;
  }

  if (force || !teacherVideo.videoUrl || TEACHER_VIDEO_ACTIVE_STATUSES.has(teacherVideo.status)) {
    return true;
  }

  const expiresAt = getSignedUrlExpiresAt(teacherVideo.videoUrl);

  return expiresAt !== null && expiresAt <= now + bufferMs;
}

export async function refreshTeacherVideoForLessonIfNeeded(lesson, options = {}) {
  const teacherVideo = lesson?.generationMetadata?.teacherVideo || {};

  if (!lesson || !shouldRefreshTeacherVideoUrl(teacherVideo, options)) {
    return {
      lesson,
      teacherVideo,
      refreshed: false,
    };
  }

  const video = await getHeyGenVideo(teacherVideo.videoId);
  const nextTeacherVideo = {
    ...teacherVideo,
    status: video.status,
    videoUrl: video.videoUrl || teacherVideo.videoUrl || '',
    thumbnailUrl: video.thumbnailUrl || teacherVideo.thumbnailUrl || '',
    duration: video.duration || teacherVideo.duration || null,
    checkedAt: new Date().toISOString(),
    completedAt: video.status === 'completed'
      ? teacherVideo.completedAt || new Date().toISOString()
      : teacherVideo.completedAt || null,
    failedAt: video.status === 'failed'
      ? teacherVideo.failedAt || new Date().toISOString()
      : teacherVideo.failedAt || null,
  };

  const updatedLesson = await updateLessonContent(lesson.id, {
    generationMetadata: {
      ...(lesson.generationMetadata || {}),
      teacherVideo: nextTeacherVideo,
    },
  });

  return {
    lesson: updatedLesson,
    teacherVideo: nextTeacherVideo,
    refreshed: true,
  };
}
