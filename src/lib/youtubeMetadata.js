export function isSupportedYoutubeUrl(url) {
  try {
    const parsedUrl = new URL(url);

    return (
      parsedUrl.hostname.includes('youtube.com') ||
      parsedUrl.hostname.includes('youtu.be')
    );
  } catch {
    return false;
  }
}

export async function fetchYoutubeOEmbedMetadata(url) {
  if (!isSupportedYoutubeUrl(url)) {
    return {
      title: '',
      authorName: '',
      authorUrl: '',
      thumbnailUrl: '',
      thumbnailWidth: null,
      thumbnailHeight: null,
      providerName: '',
      error: 'A valid YouTube URL is required.',
    };
  }

  try {
    const oembedUrl = new URL('https://www.youtube.com/oembed');
    oembedUrl.searchParams.set('url', url);
    oembedUrl.searchParams.set('format', 'json');

    const youtubeResponse = await fetch(oembedUrl, {
      cache: 'force-cache',
      next: { revalidate: 86400 },
    });
    const data = await youtubeResponse.json();

    if (!youtubeResponse.ok) {
      throw new Error(data.error || 'Failed to load YouTube metadata.');
    }

    return {
      title: data.title || '',
      authorName: data.author_name || '',
      authorUrl: data.author_url || '',
      thumbnailUrl: data.thumbnail_url || '',
      thumbnailWidth: data.thumbnail_width || null,
      thumbnailHeight: data.thumbnail_height || null,
      providerName: data.provider_name || 'YouTube',
      error: '',
    };
  } catch (error) {
    return {
      title: '',
      authorName: '',
      authorUrl: '',
      thumbnailUrl: '',
      thumbnailWidth: null,
      thumbnailHeight: null,
      providerName: '',
      error: error.message || 'Failed to load YouTube metadata.',
    };
  }
}
