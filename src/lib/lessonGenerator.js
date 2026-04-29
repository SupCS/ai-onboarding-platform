function extractResponseText(data) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const textParts = [];
  const output = Array.isArray(data.output) ? data.output : [];

  for (const outputItem of output) {
    const content = Array.isArray(outputItem.content) ? outputItem.content : [];

    for (const contentItem of content) {
      if (typeof contentItem.text === 'string') {
        textParts.push(contentItem.text);
      }
    }
  }

  return textParts.join('\n').trim();
}

async function createOpenAIResponse(prompt, options = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = options.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const content = [
    {
      type: 'input_text',
      text: prompt.input,
    },
    ...(prompt.fileInputs || []),
  ];

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      instructions: prompt.instructions,
      input: prompt.fileInputs?.length
        ? [
            {
              role: 'user',
              content,
            },
          ]
        : prompt.input,
      prompt_cache_key: prompt.cacheKey || prompt.version,
      ...(options.promptCacheRetention
        ? { prompt_cache_retention: options.promptCacheRetention }
        : {}),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'OpenAI lesson generation failed.');
  }

  return {
    data,
    model,
  };
}

export async function generateLessonContent(prompt) {
  const { data, model } = await createOpenAIResponse(prompt);
  const content = extractResponseText(data);

  if (!content) {
    throw new Error('OpenAI returned an empty lesson.');
  }

  return {
    content,
    metadata: {
      provider: 'openai',
      model,
      promptVersion: prompt.version,
      promptCacheKey: prompt.cacheKey || prompt.version,
      responseId: data.id || '',
      usage: data.usage || null,
    },
  };
}

export const generateLessonMarkdown = generateLessonContent;

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function extractJsonObject(value = '') {
  const direct = safeJsonParse(value);

  if (direct && typeof direct === 'object' && !Array.isArray(direct)) {
    return direct;
  }

  const start = value.indexOf('{');
  const end = value.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return safeJsonParse(value.slice(start, end + 1));
}

export function extractJsonPayload(value = '') {
  return extractJsonObject(value);
}

function normalizeStringList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
}

export async function generateLessonRevisionBrief(prompt) {
  const plannerModel =
    process.env.OPENAI_REVISION_PLANNER_MODEL ||
    process.env.OPENAI_MINI_MODEL ||
    'gpt-5.4-mini';
  const { data, model } = await createOpenAIResponse(prompt, {
    model: plannerModel,
  });
  const raw = extractResponseText(data);
  const parsed = extractJsonObject(raw);

  if (!parsed) {
    throw new Error('OpenAI returned an invalid revision brief.');
  }

  const allowedScopes = new Set(['targeted', 'substantial', 'near-complete']);
  const changeScope = allowedScopes.has(parsed.changeScope)
    ? parsed.changeScope
    : 'substantial';
  const userIntent =
    typeof parsed.userIntent === 'string' && parsed.userIntent.trim()
      ? parsed.userIntent.trim()
      : 'Revise the current lesson based on user feedback.';

  return {
    brief: {
      changeScope,
      userIntent,
      editInstructions: normalizeStringList(parsed.editInstructions),
      preserveRules: normalizeStringList(parsed.preserveRules),
      riskNotes: normalizeStringList(parsed.riskNotes),
    },
    metadata: {
      provider: 'openai',
      model,
      promptVersion: prompt.version,
      promptCacheKey: prompt.cacheKey || prompt.version,
      responseId: data.id || '',
      usage: data.usage || null,
      rawOutput: raw,
    },
  };
}

export async function generateLessonActivityPayload(prompt) {
  const activityModel =
    process.env.OPENAI_ACTIVITY_MODEL ||
    process.env.OPENAI_MINI_MODEL ||
    process.env.OPENAI_MODEL ||
    'gpt-4o-mini';
  const { data, model } = await createOpenAIResponse(prompt, {
    model: activityModel,
  });
  const raw = extractResponseText(data);
  const payload = extractJsonPayload(raw);

  if (!payload) {
    throw new Error('OpenAI returned an invalid activity JSON.');
  }

  return {
    payload,
    metadata: {
      provider: 'openai',
      model,
      promptVersion: prompt.version,
      promptCacheKey: prompt.cacheKey || prompt.version,
      responseId: data.id || '',
      usage: data.usage || null,
      rawOutput: raw,
    },
  };
}
