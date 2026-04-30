import { fetchTranscript } from 'youtube-transcript';
import { buildOpenAIPromptCacheKey } from './openaiCache.js';

const LONG_TRANSCRIPT_CHARACTER_THRESHOLD = 12000;
const MAX_TRANSCRIPT_INPUT_CHARACTERS = 60000;
const TRANSCRIPT_CHUNK_CHARACTERS = 14000;
const TRANSCRIPT_LOG_PREVIEW_CHARACTERS = 2500;

function normalizeText(value = '') {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function extractYoutubeVideoId(url = '') {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes('youtu.be')) {
      return parsedUrl.pathname.replace('/', '').split('/')[0] || '';
    }

    if (parsedUrl.hostname.includes('youtube.com')) {
      return parsedUrl.searchParams.get('v') || '';
    }

    return '';
  } catch {
    return url;
  }
}

function formatTimestamp(seconds = 0) {
  const numericValue = Number(seconds) || 0;
  const normalizedSeconds = numericValue > 10000 ? numericValue / 1000 : numericValue;
  const totalSeconds = Math.max(0, Math.floor(normalizedSeconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function formatTranscriptSegments(segments = []) {
  return segments
    .map((segment) => {
      const text = normalizeText(segment.text || '');

      if (!text) {
        return '';
      }

      return `[${formatTimestamp(segment.offset)}] ${text}`;
    })
    .filter(Boolean)
    .join('\n');
}

function splitIntoChunks(text, chunkSize = TRANSCRIPT_CHUNK_CHARACTERS) {
  const chunks = [];
  let cursor = 0;

  while (cursor < text.length) {
    chunks.push(text.slice(cursor, cursor + chunkSize));
    cursor += chunkSize;
  }

  return chunks;
}

function buildCompressionPrompt({ url, videoId, transcriptText, chunkLabel = '' }) {
  return {
    version: 'youtube-transcript-compression-v1',
    cacheKey: buildOpenAIPromptCacheKey('youtube-transcript', [
      'youtube-transcript-compression-v1',
      videoId,
      chunkLabel || 'single',
    ]),
    instructions: [
      'You prepare YouTube transcripts for lesson generation.',
      'Remove filler, greetings, repetition, sponsor-like wording, and off-topic chatter.',
      'Keep only facts, concepts, processes, examples, caveats, definitions, and source-specific nuance useful for an internal theoretical lesson.',
      'Preserve concrete terminology, named tools, settings, numbers, warnings, and step order.',
      'Do not invent information that is not in the transcript.',
      'Return concise plain text with useful headings and bullets. Do not return JSON.',
    ].join('\n'),
    input: [
      `Video URL: ${url}`,
      `Video ID: ${videoId}`,
      chunkLabel ? `Transcript part: ${chunkLabel}` : '',
      '',
      'Transcript:',
      transcriptText,
    ].filter(Boolean).join('\n'),
  };
}

function logTranscriptPreview(result) {
  if (process.env.YOUTUBE_TRANSCRIPT_DEBUG !== 'true') {
    return;
  }

  const previewText = result.preparedText || result.rawText || '';
  const preview = previewText.slice(0, TRANSCRIPT_LOG_PREVIEW_CHARACTERS);

  console.group('YouTube transcript preparation');
  console.log('URL:', result.url);
  console.log('Video ID:', result.videoId);
  console.log('Status:', result.status);
  console.log('Was condensed:', result.wasCondensed);
  console.log('Raw characters:', result.rawCharacters);
  console.log('Prepared characters:', result.preparedCharacters);
  console.log('Segments:', result.segmentCount);
  if (result.error) {
    console.log('Error:', result.error);
  }
  if (preview) {
    console.log('Prepared transcript preview:', preview);
  }
  console.groupEnd();
}

async function compressTranscriptText({ url, videoId, transcriptText }) {
  const { condenseSourceText } = await import('./lessonGenerator.js');
  const trimmedTranscript = transcriptText.slice(0, MAX_TRANSCRIPT_INPUT_CHARACTERS);
  const chunks = splitIntoChunks(trimmedTranscript);

  if (chunks.length === 1) {
    const result = await condenseSourceText(
      buildCompressionPrompt({ url, videoId, transcriptText: chunks[0] })
    );

    return {
      text: result.text,
      metadata: [result.metadata],
    };
  }

  const partialResults = [];

  for (let index = 0; index < chunks.length; index += 1) {
    const result = await condenseSourceText(
      buildCompressionPrompt({
        url,
        videoId,
        transcriptText: chunks[index],
        chunkLabel: `${index + 1}/${chunks.length}`,
      })
    );

    partialResults.push(result);
  }

  const combined = partialResults.map((result) => result.text).join('\n\n---\n\n');

  if (combined.length <= LONG_TRANSCRIPT_CHARACTER_THRESHOLD) {
    return {
      text: combined,
      metadata: partialResults.map((result) => result.metadata),
    };
  }

  const finalResult = await condenseSourceText(
    buildCompressionPrompt({
      url,
      videoId,
      transcriptText: combined,
      chunkLabel: 'final',
    })
  );

  return {
    text: finalResult.text,
    metadata: [
      ...partialResults.map((result) => result.metadata),
      finalResult.metadata,
    ],
  };
}

export async function prepareYoutubeTranscript(url) {
  const videoId = extractYoutubeVideoId(url);

  if (!videoId) {
    const result = {
      url,
      videoId: '',
      status: 'unavailable',
      error: 'Could not extract a YouTube video ID from the URL.',
      rawText: '',
      preparedText: '',
      wasCondensed: false,
      rawCharacters: 0,
      preparedCharacters: 0,
      segmentCount: 0,
      compressionMetadata: [],
    };

    logTranscriptPreview(result);
    return result;
  }

  try {
    const preferredLanguage = process.env.YOUTUBE_TRANSCRIPT_LANG || undefined;
    let segments;

    try {
      segments = await fetchTranscript(
        url,
        preferredLanguage ? { lang: preferredLanguage } : undefined
      );
    } catch (error) {
      if (!preferredLanguage) {
        throw error;
      }

      segments = await fetchTranscript(url);
    }

    const rawText = normalizeText(formatTranscriptSegments(segments));
    const shouldCondense = rawText.length > LONG_TRANSCRIPT_CHARACTER_THRESHOLD;

    if (!rawText) {
      throw new Error('Transcript was empty.');
    }

    if (!shouldCondense) {
      const result = {
        url,
        videoId,
        status: 'ready',
        error: '',
        rawText,
        preparedText: rawText,
        wasCondensed: false,
        rawCharacters: rawText.length,
        preparedCharacters: rawText.length,
        segmentCount: segments.length,
        compressionMetadata: [],
      };

      logTranscriptPreview(result);
      return result;
    }

    const condensed = await compressTranscriptText({ url, videoId, transcriptText: rawText });
    const preparedText = normalizeText(condensed.text);

    const result = {
      url,
      videoId,
      status: 'condensed',
      error: '',
      rawText: '',
      preparedText,
      wasCondensed: true,
      rawCharacters: rawText.length,
      preparedCharacters: preparedText.length,
      segmentCount: segments.length,
      compressionMetadata: condensed.metadata,
    };

    logTranscriptPreview(result);
    return result;
  } catch (error) {
    const result = {
      url,
      videoId,
      status: 'unavailable',
      error: error.message || 'Transcript is unavailable.',
      rawText: '',
      preparedText: '',
      wasCondensed: false,
      rawCharacters: 0,
      preparedCharacters: 0,
      segmentCount: 0,
      compressionMetadata: [],
    };

    logTranscriptPreview(result);
    return result;
  }
}
