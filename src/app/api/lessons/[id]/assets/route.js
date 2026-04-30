import { requireApiUser } from '../../../../../lib/apiAuth';
import { createLessonAsset, getLessonById } from '../../../../../lib/lessons';
import { isSupportedYoutubeUrl } from '../../../../../lib/youtubeMetadata';

export const runtime = 'nodejs';

function isHttpUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(request, { params }) {
  try {
    const { response } = await requireApiUser();

    if (response) {
      return response;
    }

    const { id } = await params;
    const body = await request.json();
    const requestedKind = body.kind;
    const url = (body.url || '').trim();
    const storageKey = (body.storageKey || '').trim();
    const mimeType = (body.mimeType || '').trim();
    const originalName = (body.originalName || '').trim();
    const sizeBytes = Number(body.sizeBytes || 0);

    if (!id) {
      return Response.json(
        { error: 'Lesson id is required.' },
        { status: 400 }
      );
    }

    let kind = requestedKind;

    if (requestedKind === 'url') {
      if (!isHttpUrl(url)) {
        return Response.json(
          { error: 'A valid HTTP or HTTPS URL is required.' },
          { status: 400 }
        );
      }

      kind = isSupportedYoutubeUrl(url) ? 'youtube' : 'link';
    }

    if (!['link', 'youtube', 'image', 'file'].includes(kind)) {
      return Response.json(
        { error: 'Unsupported lesson asset type.' },
        { status: 400 }
      );
    }

    if ((kind === 'link' || kind === 'youtube') && !url) {
      return Response.json(
        { error: 'URL is required.' },
        { status: 400 }
      );
    }

    if ((kind === 'image' || kind === 'file') && (!storageKey || !originalName || !sizeBytes)) {
      return Response.json(
        { error: 'Uploaded file details are required.' },
        { status: 400 }
      );
    }

    const asset = await createLessonAsset(id, {
      kind,
      url,
      originalName,
      storageKey,
      mimeType,
      sizeBytes,
    });

    if (!asset) {
      return Response.json(
        { error: 'Lesson not found.' },
        { status: 404 }
      );
    }

    const lesson = await getLessonById(id);

    return Response.json({ asset, lesson }, { status: 201 });
  } catch (error) {
    console.error('POST /api/lessons/[id]/assets failed:', error);

    return Response.json(
      { error: error.message || 'Failed to add lesson asset.' },
      { status: 500 }
    );
  }
}
