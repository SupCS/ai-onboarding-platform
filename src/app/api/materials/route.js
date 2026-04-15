import { createMaterial, getAllMaterials } from '../../../lib/materials';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const materials = await getAllMaterials();

    return Response.json({ materials });
  } catch (error) {
    console.error('GET /api/materials failed:', error);

    return Response.json(
      { error: error.message || 'Failed to load materials.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const title = (body.title || '').trim();
    const description = (body.description || '').trim();
    const text = (body.text || '').trim();
    const youtubeUrls = Array.isArray(body.youtubeUrls) ? body.youtubeUrls : [];
    const links = Array.isArray(body.links) ? body.links : [];
    const attachments = Array.isArray(body.attachments) ? body.attachments : [];

    const hasAnyContent =
      youtubeUrls.length > 0 ||
      links.length > 0 ||
      Boolean(text) ||
      attachments.length > 0;

    if (!title) {
      return Response.json(
        { error: 'Title is required.' },
        { status: 400 }
      );
    }

    if (!hasAnyContent) {
      return Response.json(
        { error: 'At least one content source is required.' },
        { status: 400 }
      );
    }

    await createMaterial({
      title,
      description,
      text,
      youtubeUrls,
      links,
      attachments,
    });

    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('POST /api/materials failed:', error);

    return Response.json(
      { error: error.message || 'Failed to create material.' },
      { status: 500 }
    );
  }
}