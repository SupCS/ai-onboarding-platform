const MAX_LINK_TEXT_CHARACTERS = 10000;
const FETCH_TIMEOUT_MS = 12000;

function normalizeWhitespace(value = '') {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function decodeHtmlEntities(value = '') {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripHtml(value = '') {
  return decodeHtmlEntities(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<(?:br|p|div|section|article|li|h[1-6])\b[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  );
}

function getMetaContent(html, names = []) {
  for (const name of names) {
    const propertyRegex = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      'i'
    );
    const contentFirstRegex = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["'][^>]*>`,
      'i'
    );
    const match = html.match(propertyRegex) || html.match(contentFirstRegex);

    if (match?.[1]) {
      return decodeHtmlEntities(match[1]).trim();
    }
  }

  return '';
}

function getTitle(html) {
  return getMetaContent(html, ['og:title', 'twitter:title']) ||
    decodeHtmlEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').trim();
}

function getSiteName(html, url) {
  const siteName = getMetaContent(html, ['og:site_name', 'application-name']);

  if (siteName) {
    return siteName;
  }

  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function extractMainText(html) {
  const articleMatch = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  const sourceHtml = articleMatch?.[1] || bodyMatch?.[1] || html;
  const text = normalizeWhitespace(stripHtml(sourceHtml));

  return text.length > MAX_LINK_TEXT_CHARACTERS
    ? `${text.slice(0, MAX_LINK_TEXT_CHARACTERS)}...`
    : text;
}

function isHttpUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function fetchLinkMetadata(url) {
  if (!isHttpUrl(url)) {
    return {
      title: '',
      description: '',
      imageUrl: '',
      siteName: '',
      extractedText: '',
      error: 'Only HTTP and HTTPS links can be parsed.',
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5',
        'User-Agent': 'AI-Onboarding-Link-Parser/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();

    if (!contentType.includes('html')) {
      const extractedText = normalizeWhitespace(rawText).slice(0, MAX_LINK_TEXT_CHARACTERS);

      return {
        title: '',
        description: '',
        imageUrl: '',
        siteName: getSiteName('', url),
        extractedText,
        error: '',
      };
    }

    const title = getTitle(rawText);
    const description = getMetaContent(rawText, [
      'description',
      'og:description',
      'twitter:description',
    ]);
    const imageUrl = getMetaContent(rawText, ['og:image', 'twitter:image']);

    return {
      title,
      description,
      imageUrl,
      siteName: getSiteName(rawText, url),
      extractedText: extractMainText(rawText),
      error: '',
    };
  } catch (error) {
    return {
      title: '',
      description: '',
      imageUrl: '',
      siteName: '',
      extractedText: '',
      error: error.name === 'AbortError'
        ? 'Timed out while parsing this link.'
        : error.message || 'Failed to parse this link.',
    };
  } finally {
    clearTimeout(timeout);
  }
}
