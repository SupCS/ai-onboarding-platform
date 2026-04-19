import EmptyState from '../ui/EmptyState';
import LessonPromptForm from '../lessons/LessonPromptForm';
import MaterialsGrid from '../materials/MaterialsGrid';
import MaterialsLoadingState from '../materials/MaterialsLoadingState';

export default function LibraryTabPanel({
  activeTab,
  materials = [],
  isHydrated = true,
  onOpenMaterial,
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
        onOpenMaterial={onOpenMaterial}
      />
    );
  }

  if (activeTab === 'lessons') {
    if (!isHydrated) {
      return <MaterialsLoadingState />;
    }

    if (materials.length === 0) {
      return (
        <EmptyState
          title="No materials yet"
          description="Add source materials first, then use them to build a theoretical lesson prompt."
        />
      );
    }

    return (
      <LessonPromptForm materials={materials} />
    );
  }

  return (
    <EmptyState
      title="No roadmaps yet"
      description="Roadmaps built from multiple lessons will appear here."
    />
  );
}
