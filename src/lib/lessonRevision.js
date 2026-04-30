import { LESSON_INSTRUCTIONS } from './lessonPrompt.js';
import { buildOpenAIPromptCacheKey } from './openaiCache.js';

export const LESSON_REVISION_PLANNER_VERSION = 'lesson-revision-planner-v1';
export const LESSON_REVISION_WRITER_VERSION = 'lesson-revision-writer-v1';

const REVISION_OPTION_LABELS = {
  simpler: 'Make the explanation simpler and easier to follow.',
  deeper: 'Add more depth and useful theoretical detail.',
  examples: 'Add examples only where they genuinely improve understanding.',
  structured: 'Improve structure and flow.',
  shorter: 'Shorten the lesson and remove unnecessary wording.',
};

function normalizeText(value = '') {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function formatSourceMaterial(material) {
  const youtubeTranscriptSections = (material.youtubeTranscripts || []).map((transcript) => {
    const label = transcript.wasCondensed
      ? 'Condensed YouTube transcript, filler removed'
      : 'YouTube transcript';

    if (transcript.preparedText) {
      return [
        `${label} for ${transcript.url}:`,
        transcript.preparedText,
      ].join('\n');
    }

    return [
      `YouTube transcript unavailable for ${transcript.url}.`,
      transcript.error ? `Reason: ${transcript.error}` : '',
    ].filter(Boolean).join('\n');
  });
  const linkContextSections = (material.linkAssets || []).map((linkAsset, index) => {
    const label = linkAsset.title || `Web link ${index + 1}`;
    const parts = [
      `Web source: ${label}`,
      `URL: ${linkAsset.url}`,
      linkAsset.siteName ? `Site: ${linkAsset.siteName}` : '',
      linkAsset.description ? `Description:\n${linkAsset.description}` : '',
      linkAsset.extractedText ? `Extracted page text:\n${linkAsset.extractedText}` : '',
      linkAsset.metadataError ? `Link parsing note: ${linkAsset.metadataError}` : '',
    ];

    return parts.filter(Boolean).join('\n');
  });
  const sections = [
    `Source ${material.sourceNumber}: ${material.title}`,
    material.description ? `Description:\n${material.description}` : '',
    material.text ? `Extracted text:\n${material.text}` : '',
    material.youtubeUrls.length
      ? `YouTube URLs:\n${material.youtubeUrls.map((url) => `- ${url}`).join('\n')}`
      : '',
    youtubeTranscriptSections.length
      ? `YouTube transcript context:\n${youtubeTranscriptSections.join('\n\n')}`
      : '',
    material.links.length
      ? `Links:\n${material.links.map((url) => `- ${url}`).join('\n')}`
      : '',
    linkContextSections.length
      ? `Parsed web link context:\n${linkContextSections.join('\n\n')}`
      : '',
    material.attachments.length
      ? `Attachments, metadata only:\n${material.attachments
          .map((attachment) => `- ${attachment.name} (${attachment.kind})`)
          .join('\n')}`
      : '',
  ];

  return sections.filter(Boolean).join('\n\n');
}

function buildRevisionOptionsText(selectedOptions = []) {
  if (selectedOptions.length === 0) {
    return 'No preset revision options selected.';
  }

  return selectedOptions
    .map((option) => `- ${REVISION_OPTION_LABELS[option] || option}`)
    .join('\n');
}

function serializeRevisionBrief(brief) {
  return JSON.stringify(brief, null, 2);
}

export function buildLessonRevisionPlannerPrompt({
  lesson,
  preparedMaterials,
  revisionRequest = '',
  selectedOptions = [],
}) {
  const sourceText = preparedMaterials.materials.map(formatSourceMaterial).join('\n\n---\n\n');
  const normalizedRequest = normalizeText(revisionRequest);
  const hasSourceMaterials = preparedMaterials.materials.length > 0;

  const instructions = [
    'You analyze user feedback for an existing lesson and prepare a revision brief for another model.',
    'Do not rewrite the lesson yourself.',
    'Infer from the user request whether the lesson needs light edits, a substantial rewrite of many parts, or a near-complete rewrite.',
    'Preserve the user intent exactly and avoid adding your own product ideas.',
    'Base preservation requirements on the current lesson and the provided source materials.',
    'Return valid JSON only. Do not wrap it in Markdown fences.',
    '',
    'Return this exact JSON shape:',
    '{',
    '  "changeScope": "targeted" | "substantial" | "near-complete",',
    '  "userIntent": "short string",',
    '  "editInstructions": ["string"],',
    '  "preserveRules": ["string"],',
    '  "riskNotes": ["string"]',
    '}',
    '',
    'Rules:',
    '- "changeScope" should reflect how much of the lesson likely needs to change to satisfy the request.',
    '- "editInstructions" should be concrete writing instructions for the revising model.',
    '- "preserveRules" should capture what must stay accurate, present, or consistent unless the user explicitly asks otherwise.',
    '- "riskNotes" should mention contradictions, unsupported requests, or factual risks when relevant.',
  ].join('\n');

  const input = [
    'Current lesson title:',
    lesson.title || 'Untitled lesson',
    '',
    'Current lesson HTML:',
    lesson.contentHtml || '',
    '',
    'Original lesson settings:',
    `- Depth: ${lesson.depth || 'standard'}`,
    `- Tone: ${lesson.tone || 'clear'}`,
    `- Desired format: ${lesson.desiredFormat || 'structured theoretical lesson'}`,
    lesson.userInstructions
      ? `- Original extra instructions: ${lesson.userInstructions}`
      : '- Original extra instructions: none',
    '',
    'Selected preset revision options:',
    buildRevisionOptionsText(selectedOptions),
    '',
    'User revision request:',
    normalizedRequest || 'No freeform comment provided.',
    '',
    hasSourceMaterials
      ? 'Current linked source materials:'
      : 'Current linked source materials: none. Use the original lesson and revision request as the main context.',
    hasSourceMaterials ? sourceText : '',
  ].join('\n');

  return {
    version: LESSON_REVISION_PLANNER_VERSION,
    cacheKey: buildOpenAIPromptCacheKey('lesson-revision-plan', [
      LESSON_REVISION_PLANNER_VERSION,
      lesson.id || 'unknown-lesson',
    ]),
    instructions,
    input,
  };
}

export function buildLessonRevisionWriterPrompt({
  lesson,
  preparedMaterials,
  revisionRequest = '',
  selectedOptions = [],
  revisionBrief,
}) {
  const sourceText = preparedMaterials.materials.map(formatSourceMaterial).join('\n\n---\n\n');
  const hasSourceMaterials = preparedMaterials.materials.length > 0;
  const normalizedRequest = normalizeText(revisionRequest);

  const instructions = [
    LESSON_INSTRUCTIONS,
    '',
    'Revision mode:',
    '- You are revising an existing lesson, not generating a fresh lesson from scratch unless the revision brief clearly requires a near-complete rewrite.',
    '- Apply the requested edits from the user request and revision brief.',
    '- Decide how much of the lesson to change based on the revision brief, not by default.',
    '- Keep the lesson aligned with the current lesson unless the revision brief requires broader replacement.',
    '- Preserve factual content, useful caveats, and source-backed nuance unless the user explicitly asks to remove or replace them.',
    '- If the user request conflicts with the sources, keep the lesson source-grounded and handle the conflict carefully.',
    '- Return HTML only. Do not include commentary, JSON, or explanations outside the lesson HTML.',
  ].join('\n');

  const input = [
    'Revise the current lesson using the revision brief.',
    '',
    'Current lesson title:',
    lesson.title || 'Untitled lesson',
    '',
    'Current lesson HTML:',
    lesson.contentHtml || '',
    '',
    'Revision brief:',
    serializeRevisionBrief(revisionBrief),
    '',
    'Selected preset revision options:',
    buildRevisionOptionsText(selectedOptions),
    '',
    'User revision request:',
    normalizedRequest || 'No freeform comment provided.',
    '',
    'Original lesson settings:',
    `- Depth: ${lesson.depth || 'standard'}`,
    `- Tone: ${lesson.tone || 'clear'}`,
    `- Desired format: ${lesson.desiredFormat || 'structured theoretical lesson'}`,
    lesson.userInstructions
      ? `- Original extra instructions: ${lesson.userInstructions}`
      : '- Original extra instructions: none',
    '',
    hasSourceMaterials
      ? 'Current linked source materials:'
      : 'Current linked source materials: none. Use the current lesson as the main factual baseline unless the user request contradicts it.',
    hasSourceMaterials ? sourceText : '',
  ].join('\n');

  return {
    version: LESSON_REVISION_WRITER_VERSION,
    cacheKey: buildOpenAIPromptCacheKey('lesson-revision-write', [
      LESSON_REVISION_WRITER_VERSION,
      lesson.id || 'unknown-lesson',
    ]),
    instructions,
    input,
  };
}
