import { getPreviewUrl } from '../../../../lib/storage';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storageKey = searchParams.get('storageKey');

    if (!storageKey) {
      return Response.json(
        { error: 'Storage key is required.' },
        { status: 400 }
      );
    }

    const previewUrl = await getPreviewUrl(storageKey);

    return Response.json({ previewUrl });
  } catch (error) {
    console.error('GET /api/files/preview failed:', error);

    return Response.json(
      { error: error.message || 'Failed to generate preview URL.' },
      { status: 500 }
    );
  }
}
