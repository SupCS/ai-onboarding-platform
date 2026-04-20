import EmptyState from '../ui/EmptyState';
import LessonsGrid from '../lessons/LessonsGrid';
import MaterialsGrid from '../materials/MaterialsGrid';
import MaterialsLoadingState from '../materials/MaterialsLoadingState';

export default function LibraryTabPanel({
  activeTab,
  materials = [],
  lessons = [],
  isHydrated = true,
  onOpenMaterial,
  onOpenLesson,
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

    if (lessons.length === 0) {
      return (
        <EmptyState
          title="No lessons yet"
          description="Click Create Lesson to generate a theoretical lesson from existing materials."
        />
      );
    }

    return (
      <LessonsGrid
        lessons={lessons}
        onOpenLesson={onOpenLesson}
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
