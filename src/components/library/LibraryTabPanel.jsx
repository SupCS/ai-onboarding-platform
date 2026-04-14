import EmptyState from '../ui/EmptyState';
import MaterialsGrid from '../materials/MaterialsGrid';
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
          description="Add YouTube videos, files, links, text notes, images, or combine several source types inside one material."
        />
      );
    }

    return (
      <MaterialsGrid
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