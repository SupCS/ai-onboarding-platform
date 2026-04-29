import { getObjectBuffer } from './storage.js';

const OPENAI_FILES_URL = 'https://api.openai.com/v1/files';

export function getOpenAIFileInputType(attachment = {}) {
  const mimeType = (attachment.mimeType || '').toLowerCase();
  const fileName = (attachment.name || attachment.originalName || '').toLowerCase();

  if (mimeType.startsWith('image/')) {
    return 'input_image';
  }

  if (
    mimeType === 'application/pdf' ||
    mimeType.startsWith('text/') ||
    mimeType === 'application/json' ||
    mimeType === 'text/markdown' ||
    fileName.endsWith('.md') ||
    fileName.endsWith('.txt') ||
    fileName.endsWith('.json') ||
    fileName.endsWith('.html') ||
    fileName.endsWith('.pdf') ||
    fileName.endsWith('.doc') ||
    fileName.endsWith('.docx') ||
    fileName.endsWith('.pptx')
  ) {
    return 'input_file';
  }

  return null;
}

export function getOpenAIFilePurpose(attachment = {}) {
  return getOpenAIFileInputType(attachment) === 'input_image' ? 'vision' : 'user_data';
}

export async function uploadMaterialFileToOpenAI(attachment = {}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  if (!attachment.storageKey) {
    throw new Error('Attachment storage key is required.');
  }

  const inputType = getOpenAIFileInputType(attachment);

  if (!inputType) {
    return null;
  }

  const fileBuffer = await getObjectBuffer(attachment.storageKey);
  const fileName = attachment.name || attachment.originalName || 'material-file';
  const mimeType = attachment.mimeType || 'application/octet-stream';
  const form = new FormData();

  form.append('purpose', getOpenAIFilePurpose(attachment));
  form.append('file', new Blob([fileBuffer], { type: mimeType }), fileName);

  const response = await fetch(OPENAI_FILES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `Failed to upload ${fileName} to OpenAI.`);
  }

  return {
    id: data.id,
    purpose: data.purpose || getOpenAIFilePurpose(attachment),
    inputType,
    bytes: data.bytes || fileBuffer.length,
  };
}
