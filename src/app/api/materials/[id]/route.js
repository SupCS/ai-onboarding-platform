import { deleteMaterialById } from '../../../../lib/materials';
import { deleteStorageObjects } from '../../../../lib/storage';

export const runtime = 'nodejs';

export async function DELETE(_request, { params }) {
  try {
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
