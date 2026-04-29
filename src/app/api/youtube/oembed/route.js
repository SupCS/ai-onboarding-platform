import { requireApiUser } from '../../../../lib/apiAuth';
import { fetchYoutubeOEmbedMetadata, isSupportedYoutubeUrl } from '../../../../lib/youtubeMetadata';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const { response } = await requireApiUser();

    if (response) {
      return response;
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url') || '';

    if (!url || !isSupportedYoutubeUrl(url)) {
      return Response.json(
        { error: 'A valid YouTube URL is required.' },
        { status: 400 }
      );
    }

    const data = await fetchYoutubeOEmbedMetadata(url);

    if (data.error) {
      throw new Error(data.error);
    }

    return Response.json(data);
  } catch (error) {
    console.error('GET /api/youtube/oembed failed:', error);

    return Response.json(
      { error: error.message || 'Failed to load YouTube metadata.' },
      { status: 500 }
    );
  }
}
