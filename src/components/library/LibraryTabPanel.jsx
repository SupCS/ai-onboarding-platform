import EmptyState from '../ui/EmptyState';
import MaterialsList from '../materials/MaterialsList';
import MaterialsLoadingState from '../materials/MaterialsLoadingState';

export default function LibraryTabPanel({
  activeTab,
  materials = [],
  isHydrated = true,
  onDeleteMaterial,
}) {
  if (activeTab === 'materials') {
    if (!isHydrated) {
      return <MaterialsLoadingState />;
    }

    if (materials.length === 0) {
      return (
        <EmptyState
          title="No materials yet"
          description="Uploaded documents and videos will appear here. This is where users with permission will manage source content."
        />
      );
    }

    return (
      <MaterialsList
        materials={materials}
        onDeleteMaterial={onDeleteMaterial}
      />
    );
  }

  if (activeTab === 'lessons') {
    return (
      <EmptyState
        title="No lessons yet"
        description="Lessons created from one or multiple materials will appear here."
      />
    );
  }

  return (
    <EmptyState
      title="No roadmaps yet"
      description="Roadmaps built from multiple lessons will appear here."
    />
  );
}