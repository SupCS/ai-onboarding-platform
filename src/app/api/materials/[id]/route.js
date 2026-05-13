import { deleteMaterialById, updateMaterialById } from '../../../../lib/materials';
import { deleteStorageObjects } from '../../../../lib/storage';
import { requireApiUser } from '../../../../lib/apiAuth';
import { PERMISSIONS, requirePermission } from '../../../../lib/permissions';

export const runtime = 'nodejs';

export async function PUT(request, { params }) {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    const forbidden = await requirePermission(user, PERMISSIONS.MATERIALS_EDIT);

    if (forbidden) {
      return forbidden;
    }

    const { id } = await params;
    const body = await request.json();

    const title = (body.title || '').trim();
    const description = (body.description || '').trim();
    const text = (body.text || '').trim();
    const youtubeUrls = Array.isArray(body.youtubeUrls) ? body.youtubeUrls : [];
    const links = Array.isArray(body.links) ? body.links : [];
    const attachments = Array.isArray(body.attachments) ? body.attachments : [];
    const tags = Array.isArray(body.tags) ? body.tags : [];

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
      tags,
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
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    const forbidden = await requirePermission(user, PERMISSIONS.MATERIALS_DELETE);

    if (forbidden) {
      return forbidden;
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
