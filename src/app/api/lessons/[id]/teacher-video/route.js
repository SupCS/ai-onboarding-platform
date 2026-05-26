import { USER_ROLES } from '../../../../../lib/auth';
import { requireApiUser } from '../../../../../lib/apiAuth';
import { createTeacherVideoForLesson } from '../../../../../lib/heygen';
import { getLessonById, updateLessonContent } from '../../../../../lib/lessons';
import { PERMISSIONS, requirePermission } from '../../../../../lib/permissions';
import { refreshTeacherVideoForLessonIfNeeded } from '../../../../../lib/teacherVideos';

export const runtime = 'nodejs';

function canGenerateTeacherVideo(user) {
  return user?.role === USER_ROLES.ADMIN;
}

function withViewerCapabilities(lesson, user) {
  if (!lesson) {
    return lesson;
  }

  return {
    ...lesson,
    viewerCanAccessPrivate: true,
    viewerCanManage: user?.role === USER_ROLES.ADMIN || lesson.createdByUserId === user?.id,
    viewerCanGenerateTeacherVideo: canGenerateTeacherVideo(user),
  };
}

function normalizeStoredTeacherVideo(teacherVideo = {}) {
  return {
    provider: 'heygen',
    ...teacherVideo,
    checkedAt: new Date().toISOString(),
  };
}

async function saveTeacherVideoMetadata(lesson, teacherVideo) {
  const updatedLesson = await updateLessonContent(lesson.id, {
    generationMetadata: {
      ...(lesson.generationMetadata || {}),
      teacherVideo: normalizeStoredTeacherVideo(teacherVideo),
    },
  });

  return updatedLesson;
}

export async function POST(_request, { params }) {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    const forbidden = await requirePermission(user, PERMISSIONS.LESSONS_MANAGE);

    if (forbidden) {
      return forbidden;
    }

    if (!canGenerateTeacherVideo(user)) {
      return Response.json(
        { error: 'Only administrators can generate teacher videos.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id) {
      return Response.json(
        { error: 'Lesson id is required.' },
        { status: 400 }
      );
    }

    const lesson = await getLessonById(id);

    if (!lesson) {
      return Response.json(
        { error: 'Lesson not found.' },
        { status: 404 }
      );
    }

    if (lesson.status !== 'ready') {
      return Response.json(
        { error: 'Only ready lessons can have teacher videos.' },
        { status: 400 }
      );
    }

    if (!lesson.contentHtml?.trim() && !lesson.contentMarkdown?.trim()) {
      return Response.json(
        { error: 'Lesson content is empty.' },
        { status: 400 }
      );
    }

    const existingTeacherVideo = lesson.generationMetadata?.teacherVideo || {};
    const activeStatuses = new Set(['pending', 'processing', 'generating']);

    if (activeStatuses.has(existingTeacherVideo.status)) {
      return Response.json(
        { error: 'A teacher video is already being generated for this lesson.' },
        { status: 409 }
      );
    }

    const teacherVideo = await createTeacherVideoForLesson(lesson);
    const updatedLesson = await saveTeacherVideoMetadata(lesson, teacherVideo);

    return Response.json({
      teacherVideo: normalizeStoredTeacherVideo(teacherVideo),
      lesson: withViewerCapabilities(updatedLesson, user),
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/lessons/[id]/teacher-video failed:', error);

    return Response.json(
      { error: error.message || 'Failed to generate teacher video.' },
      { status: 500 }
    );
  }
}

export async function GET(_request, { params }) {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    const forbidden = await requirePermission(user, PERMISSIONS.LESSONS_MANAGE);

    if (forbidden) {
      return forbidden;
    }

    if (!canGenerateTeacherVideo(user)) {
      return Response.json(
        { error: 'Only administrators can view teacher video generation status.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const lesson = await getLessonById(id);

    if (!lesson) {
      return Response.json(
        { error: 'Lesson not found.' },
        { status: 404 }
      );
    }

    const teacherVideo = lesson.generationMetadata?.teacherVideo || {};

    if (!teacherVideo.videoId) {
      return Response.json(
        { error: 'No teacher video has been requested for this lesson.' },
        { status: 404 }
      );
    }

    const {
      lesson: updatedLesson,
      teacherVideo: nextTeacherVideo,
    } = await refreshTeacherVideoForLessonIfNeeded(lesson, { force: true });

    return Response.json({
      teacherVideo: normalizeStoredTeacherVideo(nextTeacherVideo),
      lesson: withViewerCapabilities(updatedLesson, user),
    });
  } catch (error) {
    console.error('GET /api/lessons/[id]/teacher-video failed:', error);

    return Response.json(
      { error: error.message || 'Failed to load teacher video status.' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    const forbidden = await requirePermission(user, PERMISSIONS.LESSONS_MANAGE);

    if (forbidden) {
      return forbidden;
    }

    if (!canGenerateTeacherVideo(user)) {
      return Response.json(
        { error: 'Only administrators can remove teacher videos.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const lesson = await getLessonById(id);

    if (!lesson) {
      return Response.json(
        { error: 'Lesson not found.' },
        { status: 404 }
      );
    }

    const metadata = { ...(lesson.generationMetadata || {}) };
    delete metadata.teacherVideo;

    const updatedLesson = await updateLessonContent(lesson.id, {
      generationMetadata: metadata,
    });

    return Response.json({
      lesson: withViewerCapabilities(updatedLesson, user),
    });
  } catch (error) {
    console.error('DELETE /api/lessons/[id]/teacher-video failed:', error);

    return Response.json(
      { error: error.message || 'Failed to remove teacher video.' },
      { status: 500 }
    );
  }
}
