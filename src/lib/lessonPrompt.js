export const LESSON_PROMPT_VERSION = 'theoretical-lesson-v2';

function formatSourceMaterial(material) {
  const sections = [
    `Source ${material.sourceNumber}: ${material.title}`,
    material.description ? `Description:\n${material.description}` : '',
    material.text ? `Extracted text:\n${material.text}` : '',
    material.youtubeUrls.length
      ? `YouTube URLs:\n${material.youtubeUrls.map((url) => `- ${url}`).join('\n')}`
      : '',
    material.links.length
      ? `Links:\n${material.links.map((url) => `- ${url}`).join('\n')}`
      : '',
    material.attachments.length
      ? `Attachments, metadata only:\n${material.attachments
          .map((attachment) => `- ${attachment.name} (${attachment.kind})`)
          .join('\n')}`
      : '',
  ];

  return sections.filter(Boolean).join('\n\n');
}

function formatOverlaps(overlaps) {
  const notes = [];

  if (overlaps.duplicateTitles.length > 0) {
    notes.push(
      `Duplicate or repeated titles: ${overlaps.duplicateTitles
        .map((item) => `"${item.title}"`)
        .join(', ')}.`
    );
  }

  if (overlaps.duplicateUrls.length > 0) {
    notes.push(
      `Repeated URLs: ${overlaps.duplicateUrls
        .map((item) => item.url)
        .join(', ')}.`
    );
  }

  return notes.length ? notes.join('\n') : 'No obvious duplicate titles or URLs detected.';
}

function formatSignals(signals) {
  const parts = [];

  if (signals.examples.length > 0) {
    parts.push(
      `Possible examples from sources:\n${signals.examples
        .map((item) => `- Source ${item.sourceNumber}: ${item.text}`)
        .join('\n')}`
    );
  }

  if (signals.caveats.length > 0) {
    parts.push(
      `Possible caveats or warnings from sources:\n${signals.caveats
        .map((item) => `- Source ${item.sourceNumber}: ${item.text}`)
        .join('\n')}`
    );
  }

  return parts.length ? parts.join('\n\n') : 'No example or caveat signals detected.';
}

export function buildTheoreticalLessonPrompt({
  preparedMaterials,
  userInstructions = '',
  depth = 'standard',
  tone = 'clear',
  desiredFormat = 'structured theoretical lesson',
}) {
  const sourceText = preparedMaterials.materials.map(formatSourceMaterial).join('\n\n---\n\n');
  const extractedTerms = preparedMaterials.extractedTerms.length
    ? preparedMaterials.extractedTerms.join(', ')
    : 'No candidate terms extracted.';

  return {
    version: LESSON_PROMPT_VERSION,
    messages: [
      {
        role: 'system',
        content: [
          'You create theoretical lessons for employees of a digital marketing agency.',
          'The lesson must be a useful internal knowledge article, not a generic course template.',
          'Use the provided source materials as the factual basis. You may add concise background explanations only when they are necessary to understand a source statement.',
          'Do not add motivational filler, generic best-practice paragraphs, or sections that are not supported by the sources.',
        ].join('\n'),
      },
      {
        role: 'user',
        content: [
          'Create one coherent theoretical lesson from the selected materials.',
          '',
          'Core behavior:',
          '- Synthesize the sources instead of summarizing them one by one.',
          '- Merge overlapping ideas and remove repetition.',
          '- Preserve important caveats, warnings, and source-specific nuance.',
          '- Resolve contradictions by explaining the difference or noting uncertainty.',
          '- Make the conceptual order easy to follow for digital marketing agency employees.',
          '- Use examples or analogies only when they are present in the sources or directly clarify a source statement.',
          '- If a source mentions a concept without enough context, add a short explanation of that concept. For example, if the source says keywords need appropriate match types, briefly explain broad, phrase, and exact match.',
          '- Prefer useful explanation over formal course scaffolding.',
          '- Do not write generic sections like "Why this matters" unless the source provides specific reasons.',
          '- Do not inflate short source notes into broad strategic advice.',
          '- Do not include practical tasks, exercises, quizzes, tests, or knowledge checks.',
          '',
          'Markdown structure:',
          '# Title',
          'Then write the lesson directly as clear sections and subsections.',
          'Do not include Short Description, Learning Objectives, or Lesson Outline.',
          'Include Prerequisites only if the lesson truly cannot be understood without them.',
          'Include Key Terms only if definitions are genuinely useful and not already explained in the main sections.',
          '## Summary',
          '',
          'Writing style:',
          '- Be concise and dense with useful information.',
          '- Keep source-specific checklists as checklists when that is clearer than prose.',
          '- Avoid obvious statements, filler, and corporate-sounding padding.',
          '- When adding background context, keep it short and label uncertainty if the source does not specify details.',
          '',
          `Depth: ${depth}`,
          `Tone: ${tone}`,
          `Desired format: ${desiredFormat}`,
          userInstructions ? `Extra user instructions: ${userInstructions}` : 'Extra user instructions: none',
          '',
          'Preparation notes:',
          `- Materials count: ${preparedMaterials.stats.materialCount}`,
          `- Combined extracted text characters: ${preparedMaterials.stats.combinedTextCharacters}`,
          `- Candidate key terms: ${extractedTerms}`,
          `- Overlap check: ${formatOverlaps(preparedMaterials.overlaps)}`,
          `- Lesson signals: ${formatSignals(preparedMaterials.signals)}`,
          '',
          'Selected source materials:',
          sourceText,
        ].join('\n'),
      },
    ],
  };
}
