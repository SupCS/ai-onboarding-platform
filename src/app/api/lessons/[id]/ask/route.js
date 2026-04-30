import { requireApiUser } from '../../../../../lib/apiAuth';
import {
  getLessonById,
  getLessonEnrollmentForUser,
} from '../../../../../lib/lessons';
import { loadAndPrepareMaterialsForLesson, prepareMaterialsForLesson } from '../../../../../lib/materialPreparation';
import {
  answerLessonQuestion,
  buildLessonAssistantPrompt,
} from '../../../../../lib/lessonAssistant';

export const runtime = 'nodejs';

function normalizeHistory(history = []) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((message) => ['user', 'assistant'].includes(message.role))
    .map((message) => ({
      role: message.role,
      content: String(message.content || '').slice(0, 4000),
    }));
}

export async function POST(request, { params }) {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    const { id } = await params;
    const body = await request.json();
    const question = String(body.question || '').trim();
    const history = normalizeHistory(body.history);

    if (!id) {
      return Response.json(
        { error: 'Lesson id is required.' },
        { status: 400 }
      );
    }

    if (!question) {
      return Response.json(
        { error: 'Question is required.' },
        { status: 400 }
      );
    }

    if (question.length > 2000) {
      return Response.json(
        { error: 'Question is too long.' },
        { status: 400 }
      );
    }

    const enrollment = await getLessonEnrollmentForUser(user.id, id);

    if (!enrollment) {
      return Response.json(
        { error: 'Lesson not found.' },
        { status: 404 }
      );
    }

    const lesson = await getLessonById(id);

    if (!lesson || lesson.status !== 'ready') {
      return Response.json(
        { error: 'Lesson not found.' },
        { status: 404 }
      );
    }

    const preparedMaterials = lesson.materialIds?.length
      ? await loadAndPrepareMaterialsForLesson(lesson.materialIds)
      : prepareMaterialsForLesson([]);
    const prompt = buildLessonAssistantPrompt({
      lesson,
      preparedMaterials,
      question,
      history,
    });
    const result = await answerLessonQuestion(prompt);

    return Response.json({
      answer: result.answer,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error('POST /api/lessons/[id]/ask failed:', error);

    return Response.json(
      { error: error.message || 'Failed to answer lesson question.' },
      { status: 500 }
    );
  }
}
