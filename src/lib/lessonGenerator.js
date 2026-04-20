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

export async function generateLessonContent(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

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
      input: prompt.input,
      prompt_cache_key: prompt.cacheKey || prompt.version,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'OpenAI lesson generation failed.');
  }

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
