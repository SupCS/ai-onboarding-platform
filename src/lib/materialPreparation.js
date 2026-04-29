import { LESSON_MVP_LIMITS } from './lessonConstants.js';

const MAX_EXTRACTED_TERMS = 12;
const MAX_SIGNAL_ITEMS = 8;
const IGNORED_TERMS = new Set([
  'For',
  'However',
  'Important',
  'Note',
  'The',
  'This',
  'These',
  'That',
]);

function normalizeText(value = '') {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeUrlList(urls = []) {
  return [...new Set(urls.map((url) => url.trim()).filter(Boolean))];
}

function normalizeAttachment(attachment) {
  return {
    id: attachment.id,
    name: attachment.name || 'Untitled attachment',
    storageKey: attachment.storageKey || '',
    mimeType: attachment.mimeType || '',
    kind: attachment.kind || 'file',
    size: Number(attachment.size || 0),
    openaiFileId: attachment.openaiFileId || '',
    openaiFilePurpose: attachment.openaiFilePurpose || '',
    openaiFileStatus: attachment.openaiFileStatus || '',
    openaiFileError: attachment.openaiFileError || '',
    openaiUploadedAt: attachment.openaiUploadedAt || null,
  };
}

function normalizeMaterial(material, index) {
  return {
    id: material.id,
    sourceNumber: index + 1,
    title: normalizeText(material.title || 'Untitled material'),
    description: normalizeText(material.description || ''),
    text: normalizeText(material.text || ''),
    youtubeUrls: normalizeUrlList(material.youtubeUrls || []),
    links: normalizeUrlList(material.links || []),
    attachments: (material.attachments || []).map(normalizeAttachment),
  };
}

function getMaterialTextSize(material) {
  return [material.title, material.description, material.text].join('\n').length;
}

function hasUsableContent(material) {
  return Boolean(
    material.title ||
      material.description ||
      material.text ||
      material.youtubeUrls.length ||
      material.links.length ||
      material.attachments.length
  );
}

function extractCandidateTerms(materials) {
  const terms = new Map();
  const phraseRegex = /\b[A-Z][A-Za-z0-9+.#/&-]*(?: [A-Z][A-Za-z0-9+.#/&-]*){0,3}\b/g;

  for (const material of materials) {
    const textChunks = [material.title, material.description, material.text]
      .filter(Boolean)
      .map((text) => text.replace(/\s+/g, ' '));

    for (const text of textChunks) {
      const matches = text.match(phraseRegex) || [];

      for (const match of matches) {
        const normalized = match.trim();

        if (normalized.length < 3 || IGNORED_TERMS.has(normalized)) {
          continue;
        }

        terms.set(normalized, (terms.get(normalized) || 0) + 1);
      }
    }
  }

  return [...terms.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_EXTRACTED_TERMS)
    .map(([term]) => term);
}

function getSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function extractSignalSentences(materials, keywords) {
  const signals = [];

  for (const material of materials) {
    const text = [material.description, material.text].filter(Boolean).join('\n');
    const sentences = getSentences(text);

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      const hasKeyword = keywords.some((keyword) => lowerSentence.includes(keyword));

      if (!hasKeyword) {
        continue;
      }

      signals.push({
        materialId: material.id,
        sourceNumber: material.sourceNumber,
        text: sentence,
      });

      if (signals.length >= MAX_SIGNAL_ITEMS) {
        return signals;
      }
    }
  }

  return signals;
}

function extractLessonSignals(materials) {
  return {
    examples: extractSignalSentences(materials, [
      'example',
      'for example',
      'for instance',
      'e.g.',
      'case',
    ]),
    caveats: extractSignalSentences(materials, [
      'warning',
      'caution',
      'important',
      'note',
      'however',
      'but',
      'unless',
      'avoid',
      'risk',
    ]),
  };
}

function detectOverlaps(materials) {
  const titleMap = new Map();
  const linkMap = new Map();

  for (const material of materials) {
    const titleKey = material.title.toLowerCase();

    if (titleKey) {
      titleMap.set(titleKey, [...(titleMap.get(titleKey) || []), material.id]);
    }

    for (const url of [...material.links, ...material.youtubeUrls]) {
      linkMap.set(url, [...(linkMap.get(url) || []), material.id]);
    }
  }

  const duplicateTitles = [...titleMap.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([title, ids]) => ({ title, materialIds: ids }));

  const duplicateUrls = [...linkMap.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([url, ids]) => ({ url, materialIds: ids }));

  return {
    duplicateTitles,
    duplicateUrls,
  };
}

function buildSourceReferences(materials) {
  return materials.map((material) => ({
    id: material.id,
    sourceNumber: material.sourceNumber,
    title: material.title,
    links: material.links,
    youtubeUrls: material.youtubeUrls,
    attachments: material.attachments.map((attachment) => ({
      name: attachment.name,
      kind: attachment.kind,
      mimeType: attachment.mimeType,
      openaiFileId: attachment.openaiFileId,
      openaiFileStatus: attachment.openaiFileStatus,
    })),
  }));
}

function validatePreparedMaterials(materials) {
  if (materials.length > LESSON_MVP_LIMITS.maxSelectedMaterials) {
    throw new Error(
      `Select up to ${LESSON_MVP_LIMITS.maxSelectedMaterials} materials for one lesson.`
    );
  }

  const emptyMaterials = materials.filter((material) => !hasUsableContent(material));

  if (emptyMaterials.length > 0) {
    throw new Error('One or more selected materials do not have usable content.');
  }

  const combinedTextCharacters = materials.reduce(
    (total, material) => total + getMaterialTextSize(material),
    0
  );

  if (combinedTextCharacters > LESSON_MVP_LIMITS.maxCombinedTextCharacters) {
    throw new Error(
      `Selected materials are too large for the MVP limit of ${LESSON_MVP_LIMITS.maxCombinedTextCharacters} characters.`
    );
  }

  return {
    combinedTextCharacters,
  };
}

export function prepareMaterialsForLesson(materials = []) {
  const normalizedMaterials = materials.map(normalizeMaterial);
  const validation = validatePreparedMaterials(normalizedMaterials);

  return {
    materials: normalizedMaterials,
    sourceReferences: buildSourceReferences(normalizedMaterials),
    extractedTerms: extractCandidateTerms(normalizedMaterials),
    signals: extractLessonSignals(normalizedMaterials),
    overlaps: detectOverlaps(normalizedMaterials),
    stats: {
      materialCount: normalizedMaterials.length,
      combinedTextCharacters: validation.combinedTextCharacters,
    },
  };
}

export async function loadAndPrepareMaterialsForLesson(materialIds = []) {
  const { getMaterialsByIds } = await import('./materials.js');
  const materials = await getMaterialsByIds(materialIds);

  return prepareMaterialsForLesson(materials);
}
