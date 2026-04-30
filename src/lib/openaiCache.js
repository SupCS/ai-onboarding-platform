import { createHash } from 'node:crypto';

export function buildOpenAIPromptCacheKey(prefix, parts = []) {
  const safePrefix = String(prefix || 'prompt')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .slice(0, 32);
  const fingerprint = createHash('sha256')
    .update(parts.filter(Boolean).map(String).join(':'))
    .digest('hex')
    .slice(0, 24);

  return `${safePrefix}:${fingerprint}`;
}
