import { notFound, redirect } from 'next/navigation';
import { Box, Container } from '@mui/material';
import LessonActivityGate from '../../../../components/lessons/LessonActivityGate';
import LessonAttachments from '../../../../components/lessons/LessonAttachments';
import LessonAskAssistant from '../../../../components/lessons/LessonAskAssistant';
import LessonReadingChrome from '../../../../components/lessons/LessonReadingChrome';
import LessonReader from '../../../../components/lessons/LessonReader';
import { getCurrentUser } from '../../../../lib/currentUser';
import { markdownToHtml } from '../../../../lib/lessonContent';
import { getMaterialsByIds } from '../../../../lib/materials';
import { getPreviewUrl } from '../../../../lib/storage';
import {
  getLessonActivitiesForUser,
  getLessonById,
  getLessonEnrollmentForUser,
  getLessonsForUser,
} from '../../../../lib/lessons';
import { getRoadmapContextForLesson } from '../../../../lib/roadmaps';
import { refreshTeacherVideoForLessonIfNeeded } from '../../../../lib/teacherVideos';

export const metadata = {
  title: 'Lesson',
};

async function hydrateSourceReferencesWithMaterials(sourceReferences = [], materialIds = []) {
  const materials = await getMaterialsByIds(materialIds);
  const materialsById = new Map(materials.map((material) => [material.id, material]));

  return Promise.all(sourceReferences.map(async (source) => {
    const material = materialsById.get(source.id);

    if (!material) {
      return source;
    }

    return {
      ...source,
      attachments: await Promise.all((material.attachments || []).map(async (attachment) => {
        const isImage = attachment.kind === 'image' || attachment.mimeType?.startsWith('image/');
        const previewUrl = isImage && attachment.storageKey
          ? await getPreviewUrl(attachment.storageKey, { expiresIn: 60 * 10 })
          : '';

        return {
          id: attachment.id,
          name: attachment.name,
          storageKey: attachment.storageKey,
          mimeType: attachment.mimeType,
          kind: attachment.kind,
          size: attachment.size,
          previewUrl,
          openaiFileId: attachment.openaiFileId,
          openaiFileStatus: attachment.openaiFileStatus,
        };
      })),
    };
  }));
}

export default async function LessonReadPage({ params }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  const enrollment = await getLessonEnrollmentForUser(currentUser.id, id);

  if (!enrollment) {
    notFound();
  }

  let lesson = await getLessonById(id);

  if (!lesson || lesson.status !== 'ready' || !lesson.isPublished) {
    notFound();
  }

  try {
    const result = await refreshTeacherVideoForLessonIfNeeded(lesson);
    lesson = result.lesson;
  } catch (error) {
    console.error('Failed to refresh teacher video URL for lesson reader:', error);
  }

  const html = lesson.contentHtml || markdownToHtml(lesson.contentMarkdown || '');
  const activities = await getLessonActivitiesForUser(lesson.id, currentUser.id);
  const roadmapContext = await getRoadmapContextForLesson(currentUser.id, lesson.id);
  const myLessons = await getLessonsForUser(currentUser.id);
  const currentLessonIndex = myLessons.findIndex((myLesson) => myLesson.id === lesson.id);
  const previousLesson = currentLessonIndex > 0 ? myLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex >= 0 && currentLessonIndex < myLessons.length - 1
    ? myLessons[currentLessonIndex + 1]
    : null;
  const sourceReferences = await hydrateSourceReferencesWithMaterials(
    lesson.generationMetadata?.preparedMaterials?.sourceReferences || [],
    lesson.materialIds || []
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at 12% 0%, rgba(20, 184, 166, 0.18), transparent 32%), radial-gradient(circle at 90% 12%, rgba(245, 158, 11, 0.14), transparent 28%), linear-gradient(180deg, #f8fafc 0%, #eef6f4 100%)',
      }}
    >
      <Container maxWidth={false} disableGutters>
        <LessonReadingChrome
          lesson={{
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            createdBy: lesson.createdBy,
            createdAt: lesson.createdAt ? new Date(lesson.createdAt).toISOString() : '',
            updatedAt: lesson.updatedAt ? new Date(lesson.updatedAt).toISOString() : '',
            publishedAt: lesson.publishedAt ? new Date(lesson.publishedAt).toISOString() : '',
            teacherVideo: lesson.generationMetadata?.teacherVideo || null,
          }}
          roadmapContext={roadmapContext}
          lessonNavigation={{
            previous: previousLesson
              ? { id: previousLesson.id, title: previousLesson.title }
              : null,
            next: nextLesson
              ? { id: nextLesson.id, title: nextLesson.title }
              : null,
          }}
        >
          <LessonReader html={html} />
          <Box sx={{ mt: 5 }}>
            <LessonAttachments sourceReferences={sourceReferences} />
          </Box>
          <LessonActivityGate
            lessonId={lesson.id}
            activities={activities}
            initialIsCompleted={enrollment.isCompleted}
          />
        </LessonReadingChrome>
      </Container>
      <LessonAskAssistant lessonId={lesson.id} />
    </Box>
  );
}
