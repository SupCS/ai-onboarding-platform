import { deleteMaterialById, updateMaterialById } from '../../../../lib/materials';
import { deleteStorageObjects } from '../../../../lib/storage';
import { requireApiUser } from '../../../../lib/apiAuth';

export const runtime = 'nodejs';

export async function PUT(request, { params }) {
  try {
    const { response } = await requireApiUser();

    if (response) {
      return response;
    }

    const { id } = await params;
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

    if (!id) {
      return Response.json(
        { error: 'Material id is required.' },
        { status: 400 }
      );
    }

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

    const updatedMaterial = await updateMaterialById(id, {
      title,
      description,
      text,
      youtubeUrls,
      links,
      attachments,
    });

    if (!updatedMaterial) {
      return Response.json(
        { error: 'Material not found.' },
        { status: 404 }
      );
    }

    try {
      await deleteStorageObjects(updatedMaterial.removedStorageKeys);
    } catch (storageError) {
      console.error('PUT /api/materials/[id] storage cleanup failed:', storageError);
    }

    return Response.json({ ok: true, id });
  } catch (error) {
    console.error('PUT /api/materials/[id] failed:', error);

    return Response.json(
      { error: error.message || 'Failed to update material.' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { response } = await requireApiUser();

    if (response) {
      return response;
    }

    const { id } = await params;

    if (!id) {
      return Response.json(
        { error: 'Material id is required.' },
        { status: 400 }
      );
    }

    const deletedMaterial = await deleteMaterialById(id);

    if (!deletedMaterial) {
      return Response.json(
        { error: 'Material not found.' },
        { status: 404 }
      );
    }

    try {
      await deleteStorageObjects(deletedMaterial.storageKeys);
    } catch (storageError) {
      console.error('DELETE /api/materials/[id] storage cleanup failed:', storageError);
    }

    return Response.json({ ok: true, id });
  } catch (error) {
    console.error('DELETE /api/materials/[id] failed:', error);

    return Response.json(
      { error: error.message || 'Failed to delete material.' },
      { status: 500 }
    );
  }
}
