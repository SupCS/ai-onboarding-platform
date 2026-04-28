export const LESSON_ACTIVITY_PROMPT_VERSION = 'lesson-activity-v1';

export const LESSON_ACTIVITY_LIMITS = {
  quiz: {
    min: 3,
    max: 20,
    defaultCount: 8,
  },
  flashcards: {
    min: 5,
    max: 40,
    defaultCount: 12,
  },
};

const ACTIVITY_LABELS = {
  quiz: 'quiz',
  flashcards: 'flashcards',
};

function stripHtml(value = '') {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clampCount(type, count) {
  const limits = LESSON_ACTIVITY_LIMITS[type] || LESSON_ACTIVITY_LIMITS.quiz;
  const parsedCount = Number.parseInt(count, 10);

  if (Number.isNaN(parsedCount)) {
    return limits.defaultCount;
  }

  return Math.min(limits.max, Math.max(limits.min, parsedCount));
}

export function normalizeActivityRequest(input = {}) {
  const type = ACTIVITY_LABELS[input.type] ? input.type : 'quiz';
  const count = clampCount(type, input.count);

  return {
    type,
    count,
    limits: LESSON_ACTIVITY_LIMITS[type],
  };
}

function getActivityShape(type) {
  if (type === 'flashcards') {
    return [
      '{',
      '  "type": "flashcards",',
      '  "title": "short activity title",',
      '  "cards": [',
      '    {',
      '      "front": "term, concept, abbreviation, or scenario prompt",',
      '      "back": "clear answer and any useful explanation"',
      '    }',
      '  ]',
      '}',
    ].join('\n');
  }

  return [
    '{',
    '  "type": "quiz",',
    '  "title": "short activity title",',
    '  "items": [',
    '    {',
    '      "question": "question text",',
    '      "options": ["answer option A", "answer option B", "answer option C", "answer option D"],',
    '      "correctAnswer": "exact text of the correct option",',
    '      "explanation": "explain why the answer is correct; when useful, explain why other options are wrong"',
    '    }',
    '  ]',
    '}',
  ].join('\n');
}

export function buildLessonActivityPrompt({ lesson, type, count }) {
  const normalizedType = ACTIVITY_LABELS[type] ? type : 'quiz';
  const normalizedCount = clampCount(normalizedType, count);
  const lessonText = stripHtml(lesson.contentHtml || lesson.contentMarkdown || '');
  const shortLessonId = String(lesson.id || 'lesson').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);

  const instructions = [
    'You create practical learning activities from an internal onboarding lesson.',
    'Use only the lesson content as the factual source. Do not invent company-specific rules, metrics, or platform behavior.',
    'Return valid JSON only. Do not wrap the JSON in Markdown fences.',
    `Generate exactly ${normalizedCount} ${normalizedType === 'quiz' ? 'quiz questions' : 'flashcards'}.`,
    '',
    normalizedType === 'quiz'
      ? [
          'Quiz requirements:',
          '- Make questions varied and useful for checking understanding.',
          '- Include a mix of definitions, terminology, applied situations, conceptual distinctions, correct sequence/order questions, and common mistake checks when the lesson supports them.',
          '- Each question must have 4 answer options.',
          '- The correctAnswer must exactly match one of the options.',
          '- Explanation should be helpful, not just a quote. It may explain the whole concept or use elimination logic to say why wrong options do not fit.',
          '- Avoid trick questions and avoid multiple correct answers.',
        ].join('\n')
      : [
          'Flashcard requirements:',
          '- Focus on terms, abbreviations, key concepts, platform mechanics, useful distinctions, and compact scenario prompts from the lesson.',
          '- Front should be short enough to study from.',
          '- Back should be concise but complete. Include the explanation directly in the back text when it helps retention.',
          '- Do not make cards that are just vague trivia.',
        ].join('\n'),
    '',
    'Return this exact JSON shape:',
    getActivityShape(normalizedType),
  ].join('\n');

  const input = [
    'Lesson title:',
    lesson.title || 'Untitled lesson',
    '',
    'Lesson content:',
    lessonText || 'No lesson content found.',
  ].join('\n');

  return {
    version: LESSON_ACTIVITY_PROMPT_VERSION,
    cacheKey: `${LESSON_ACTIVITY_PROMPT_VERSION}:${shortLessonId}:${normalizedType}:${normalizedCount}`,
    instructions,
    input,
  };
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeQuizPayload(rawPayload, expectedCount) {
  const items = Array.isArray(rawPayload.items) ? rawPayload.items : [];
  const normalizedItems = items
    .map((item) => {
      const question = normalizeString(item.question);
      const options = Array.isArray(item.options)
        ? item.options.map(normalizeString).filter(Boolean).slice(0, 4)
        : [];
      const correctAnswer = normalizeString(item.correctAnswer);
      const explanation = normalizeString(item.explanation);

      if (!question || options.length !== 4 || !correctAnswer || !options.includes(correctAnswer)) {
        return null;
      }

      return {
        question,
        options,
        correctAnswer,
        explanation,
      };
    })
    .filter(Boolean);

  if (normalizedItems.length === 0) {
    throw new Error('OpenAI returned an invalid quiz.');
  }

  return {
    type: 'quiz',
    title: normalizeString(rawPayload.title) || 'Lesson quiz',
    items: normalizedItems.slice(0, expectedCount),
  };
}

function normalizeFlashcardsPayload(rawPayload, expectedCount) {
  const cards = Array.isArray(rawPayload.cards) ? rawPayload.cards : [];
  const normalizedCards = cards
    .map((card) => {
      const front = normalizeString(card.front);
      const back = normalizeString(card.back);
      const explanation = normalizeString(card.explanation);

      if (!front || !back) {
        return null;
      }

      return {
        front,
        back,
        explanation,
      };
    })
    .filter(Boolean);

  if (normalizedCards.length === 0) {
    throw new Error('OpenAI returned invalid flashcards.');
  }

  return {
    type: 'flashcards',
    title: normalizeString(rawPayload.title) || 'Lesson flashcards',
    cards: normalizedCards.slice(0, expectedCount),
  };
}

export function normalizeGeneratedActivityPayload(rawPayload, { type, count }) {
  if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) {
    throw new Error('OpenAI returned an invalid activity.');
  }

  if (type === 'flashcards') {
    return normalizeFlashcardsPayload(rawPayload, count);
  }

  return normalizeQuizPayload(rawPayload, count);
}
