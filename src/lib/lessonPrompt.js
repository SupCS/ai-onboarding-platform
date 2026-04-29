export const LESSON_PROMPT_VERSION = 'theoretical-lesson-v4-instructions-html';

export const TIPTAP_HTML_GUIDE = [
  'Output format:',
  '- Return HTML only. Do not wrap it in Markdown fences. Do not include explanations outside the HTML.',
  '- The HTML must be compatible with a Tiptap rich text editor.',
  '- Start with exactly one <h1> containing a concise natural title. Do not copy the user instructions verbatim as the title.',
  '- Then write the lesson directly as clear sections and subsections.',
  '- Do not include Short Description, Learning Objectives, or Lesson Outline.',
  '- Include Prerequisites only if the lesson truly cannot be understood without them.',
  '- Include Key Terms only if definitions are genuinely useful and not already explained in the main sections.',
  '- End with an <h2>Summary</h2> section.',
  '',
  'Allowed HTML structure:',
  '- Headings: <h1>, <h2>, <h3>, <h4>.',
  '- Paragraphs: <p>.',
  '- Lists: <ul>, <ol>, <li>. Put paragraph text inside list items as <p>...</p> when useful.',
  '- Emphasis: <strong>, <em>, <u>, <s>, <code>.',
  '- Quotes/callouts: <blockquote><p>...</p></blockquote>. Blockquotes are already styled as colored callout blocks by the app.',
  '- Code blocks only for actual code/templates/syntax: <pre><code>...</code></pre>.',
  '- Links: <a href="https://example.com">descriptive text</a>. Use only real source URLs or clearly relevant URLs from the provided materials.',
  '',
  'Tiptap highlight colors available:',
  '- Yellow: <mark data-color="var(--tt-color-highlight-yellow)" style="background-color: var(--tt-color-highlight-yellow); color: inherit;">...</mark>',
  '- Green: <mark data-color="var(--tt-color-highlight-green)" style="background-color: var(--tt-color-highlight-green); color: inherit;">...</mark>',
  '- Blue: <mark data-color="var(--tt-color-highlight-blue)" style="background-color: var(--tt-color-highlight-blue); color: inherit;">...</mark>',
  '- Purple: <mark data-color="var(--tt-color-highlight-purple)" style="background-color: var(--tt-color-highlight-purple); color: inherit;">...</mark>',
  '- Red: <mark data-color="var(--tt-color-highlight-red)" style="background-color: var(--tt-color-highlight-red); color: inherit;">...</mark>',
  '',
  'Formatting rules:',
  '- Use formatting intentionally and sparingly. Do not highlight whole paragraphs.',
  '- Use <strong> for important terms, decisions, settings, and warnings.',
  '- Use <em> for nuance or short clarifying emphasis.',
  '- Use <u> rarely, only when a distinction must stand out.',
  '- Use <s> only when explaining what not to use or an outdated/wrong option.',
  '- Use inline <code> for UI labels, naming patterns, UTM parameters, match type names, platform settings, or short syntax-like values.',
  '- Use <blockquote> for important caveats, warnings, or source-specific notes.',
  '- Do not put <mark> highlights inside <blockquote>. The blockquote already has visual color and emphasis.',
  '- Do not write labels like "Blue note:", "Yellow note:", or "Red warning:" in normal text.',
  '- If something is a note/warning/caveat, make the whole note a <blockquote><p>...</p></blockquote> instead of highlighting only the label.',
  '- If using <mark>, wrap the whole important phrase or sentence fragment, not just a label such as "Blue note".',
  '- Use yellow highlight for key definitions or concepts.',
  '- Use blue highlight for process/setting details.',
  '- Use green highlight for recommended choices.',
  '- Use red highlight for warnings or things to avoid.',
  '- Use purple highlight only for memorable nuance or agency-specific rules.',
  '- Never use color just to decorate the lesson.',
  '- Do not use unsupported HTML, inline scripts, iframes, images, tables, or custom classes.',
].join('\n');

export const LESSON_INSTRUCTIONS = [
  'You create theoretical lessons for employees of a digital marketing agency.',
  'The lesson must be a useful internal knowledge article, not a generic course template.',
  'Use provided source materials as the factual basis when sources are present.',
  'If no source materials are provided, use the user instructions as the lesson topic and do not pretend that source materials exist.',
  'You may add concise background explanations only when they are necessary to understand a source statement.',
  'Do not add motivational filler, generic best-practice paragraphs, or sections that are not supported by the sources.',
  '',
  'Core behavior:',
  '- Synthesize sources instead of summarizing them one by one.',
  '- Merge overlapping ideas and remove repetition.',
  '- Preserve important caveats, warnings, and source-specific nuance.',
  '- Resolve contradictions by explaining the difference or noting uncertainty.',
  '- Make the conceptual order easy to follow for digital marketing agency employees.',
  '- Use examples or analogies only when they are present in the sources or directly clarify a source statement.',
  '- If a source mentions a concept without enough context, add a short explanation of that concept. For example, if the source says keywords need appropriate match types, briefly explain broad, phrase, and exact match.',
  '- The app always displays all source attachments as cards below the lesson, so you do not need to list general attachments in the lesson body.',
  '- If an attachment is useful at a specific point in the explanation, mention it naturally by file name near that point. For example, if a step-by-step process is explained and a screenshot shows that step, refer to the screenshot next to that step.',
  '- If an attachment is broad reference material and has no specific place in the explanation, do not force it into the lesson text. The user will find it in the attachment cards below the lesson.',
  '- Do not invent direct download links or HTML attachment cards; the app renders the attachment cards.',
  '- Prefer useful explanation over formal course scaffolding.',
  '- Do not write generic sections like "Why this matters" unless the source provides specific reasons.',
  '- Do not inflate short source notes into broad strategic advice.',
  '- Do not include practical tasks, exercises, quizzes, tests, or knowledge checks.',
  '',
  TIPTAP_HTML_GUIDE,
  '',
  'Writing style:',
  '- Be concise and dense with useful information.',
  '- Keep source-specific checklists as checklists when that is clearer than prose.',
  '- Avoid obvious statements, filler, and corporate-sounding padding.',
  '- When adding background context, keep it short and label uncertainty if the source does not specify details.',
].join('\n');

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
    material.attachments.length
      ? `Attachments:\n${material.attachments
          .map((attachment) => {
            const openaiStatus = attachment.openaiFileId
              ? `attached to this OpenAI request as ${attachment.openaiFileId}`
              : 'metadata only';

            return `- ${attachment.name} (${attachment.kind}, ${attachment.mimeType || 'unknown MIME'}, ${openaiStatus})`;
          })
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
  fileInputs = [],
  userInstructions = '',
  depth = 'standard',
  tone = 'clear',
  desiredFormat = 'structured theoretical lesson',
}) {
  const sourceText = preparedMaterials.materials.map(formatSourceMaterial).join('\n\n---\n\n');
  const hasSourceMaterials = preparedMaterials.materials.length > 0;
  const extractedTerms = preparedMaterials.extractedTerms.length
    ? preparedMaterials.extractedTerms.join(', ')
    : 'No candidate terms extracted.';

  const input = [
    hasSourceMaterials
      ? 'Create one coherent theoretical lesson from the selected materials.'
      : 'Create one coherent theoretical lesson from the user-provided topic/instructions.',
    '',
    'Request-specific settings:',
    `- Source mode: ${hasSourceMaterials ? 'selected materials provided' : 'prompt-only topic'}`,
    `- Depth: ${depth}`,
    `- Tone: ${tone}`,
    `- Desired format: ${desiredFormat}`,
    userInstructions ? `- Extra user instructions: ${userInstructions}` : '- Extra user instructions: none',
    '',
    'Preparation notes:',
    `- Materials count: ${preparedMaterials.stats.materialCount}`,
    `- Combined extracted text characters: ${preparedMaterials.stats.combinedTextCharacters}`,
    `- Candidate key terms: ${extractedTerms}`,
    `- Overlap check: ${formatOverlaps(preparedMaterials.overlaps)}`,
    `- Lesson signals: ${formatSignals(preparedMaterials.signals)}`,
    '',
    hasSourceMaterials
      ? 'Selected source materials:'
      : 'Selected source materials: none. Use the extra user instructions as the topic.',
    hasSourceMaterials ? sourceText : '',
  ].join('\n');

  return {
    version: LESSON_PROMPT_VERSION,
    cacheKey: LESSON_PROMPT_VERSION,
    instructions: LESSON_INSTRUCTIONS,
    input,
    fileInputs,
    messages: [
      {
        role: 'system',
        content: LESSON_INSTRUCTIONS,
      },
      {
        role: 'user',
        content: input,
      },
    ],
  };
}
