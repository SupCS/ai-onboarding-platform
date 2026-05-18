const HEYGEN_API_BASE_URL = 'https://api.heygen.com';
const TEACHER_VIDEO_MIN_SECONDS = 45;
const TEACHER_VIDEO_MAX_SECONDS = 60;
const TEACHER_VIDEO_CONTEXT_LIMIT = 6000;

function getHeyGenApiKey() {
  return (process.env.HEYGEN_API_KEY || '').trim();
}

function getHeyGenTeacherAvatarConfig() {
  const avatarId = (
    process.env.HEYGEN_TEACHER_AVATAR_ID ||
    process.env.HEYGEN_AVATAR_ID ||
    process.env.HEYGEN_AVATAR_LOOK_ID ||
    ''
  ).trim();
  const voiceId = (
    process.env.HEYGEN_TEACHER_VOICE_ID ||
    process.env.HEYGEN_VOICE_ID ||
    ''
  ).trim();

  return {
    avatarId,
    voiceId,
  };
}

function compactText(value = '') {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateText(value = '', limit = TEACHER_VIDEO_CONTEXT_LIMIT) {
  const text = compactText(value);

  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit).trim()}...`;
}

function extractErrorMessage(payload = {}) {
  return (
    payload.error?.message ||
    payload.message ||
    payload.detail ||
    'HeyGen request failed.'
  );
}

async function heygenFetch(path, options = {}) {
  const apiKey = getHeyGenApiKey();

  if (!apiKey) {
    throw new Error('HEYGEN_API_KEY is not configured.');
  }

  const response = await fetch(`${HEYGEN_API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload));
  }

  return payload.data || payload;
}

export function buildTeacherVideoPrompt(lesson) {
  const lessonText = truncateText(lesson.contentHtml || lesson.contentMarkdown || '');
  const sourceNames = (lesson.generationMetadata?.preparedMaterials?.sourceReferences || [])
    .map((source) => source.title)
    .filter(Boolean)
    .slice(0, 5);

  return [
    'Create a concise talking-head teacher video for an employee onboarding lesson.',
    `Target duration: ${TEACHER_VIDEO_MIN_SECONDS}-${TEACHER_VIDEO_MAX_SECONDS} seconds. Do not exceed ${TEACHER_VIDEO_MAX_SECONDS} seconds.`,
    'Format: 16:9 landscape video, full frame, clean corporate training style.',
    'Use the selected avatar as the only primary visual subject.',
    'Crop and scale the avatar naturally as a chest-up presenter who fills the landscape frame. Do not place the avatar inside a square photo frame.',
    'Do not use black bars, pillarboxing, letterboxing, black background panels, or a boxed portrait layout.',
    'Do not add subtitles or captions. The video should not display the spoken narration as text.',
    'In any scene where the avatar face is visible, do not add any visual elements at all: no text, subtitles, captions, title cards, lower thirds, labels, icons, cards, charts, diagrams, stickers, animations, or graphics.',
    'Speaking-avatar scenes must contain only the avatar and a clean background. Keep the avatar face and upper body clearly visible.',
    'You may use separate cutaway scenes without the avatar for diagrams, process flows, simple animations, title cards, or media-style inserts when they help explain the topic.',
    'All text or graphics must appear only in those separate no-avatar cutaway scenes.',
    'Cutaway scenes can contain more visual information than presenter shots, but should still stay clean, readable, and focused.',
    'Visual elements must use distinct readable colors and strong contrast against the background. If contrast is uncertain, place text on an opaque light or dark panel.',
    'Prefer a few concise key-point overlays instead of transcript-style text.',
    'Use a bright neutral office or soft studio background behind the presenter.',
    'The final video should look like a professional instructor speaking directly to camera, not a slide deck or marketing explainer.',
    'The teacher should speak in a clear, practical, corporate training tone.',
    'Write the narration as a tight 120-145 word script.',
    'Cover only the most important learning points: what the lesson is about, 3-4 key ideas, and one practical takeaway.',
    'Do not mention that this script was generated from source material.',
    'Use simple spoken English unless the lesson content is clearly in another language.',
    '',
    `Lesson title: ${lesson.title || 'Untitled lesson'}`,
    lesson.description ? `Lesson description: ${lesson.description}` : '',
    sourceNames.length ? `Source material names: ${sourceNames.join(', ')}` : '',
    '',
    'Lesson content:',
    lessonText || 'No lesson content available.',
  ].filter(Boolean).join('\n');
}

export async function createTeacherVideoForLesson(lesson) {
  const prompt = buildTeacherVideoPrompt(lesson);
  const avatarConfig = getHeyGenTeacherAvatarConfig();
  const data = await heygenFetch('/v3/video-agents', {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      orientation: 'landscape',
      ...(avatarConfig.avatarId ? { avatar_id: avatarConfig.avatarId } : {}),
      ...(avatarConfig.voiceId ? { voice_id: avatarConfig.voiceId } : {}),
    }),
  });

  return {
    provider: 'heygen',
    prompt,
    avatarId: avatarConfig.avatarId,
    voiceId: avatarConfig.voiceId,
    sessionId: data.session_id || '',
    videoId: data.video_id || data.id || '',
    status: data.status || 'generating',
    createdAt: new Date().toISOString(),
    durationLimitSeconds: TEACHER_VIDEO_MAX_SECONDS,
  };
}

export async function getHeyGenVideo(videoId) {
  if (!videoId) {
    throw new Error('HeyGen video id is required.');
  }

  const data = await heygenFetch(`/v3/videos/${encodeURIComponent(videoId)}`, {
    method: 'GET',
  });

  return {
    id: data.id || videoId,
    status: data.status || 'unknown',
    videoUrl: data.video_url || '',
    thumbnailUrl: data.thumbnail_url || '',
    duration: data.duration || null,
    raw: data,
  };
}
