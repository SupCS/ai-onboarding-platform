import EmptyState from '../ui/EmptyState';
import LessonsGrid from '../lessons/LessonsGrid';
import LessonsLoadingState from '../lessons/LessonsLoadingState';
import MaterialsGrid from '../materials/MaterialsGrid';
import MaterialsLoadingState from '../materials/MaterialsLoadingState';
import RoadmapsGrid from '../roadmaps/RoadmapsGrid';

export default function LibraryTabPanel({
  activeTab,
  materials = [],
  totalMaterials = materials.length,
  hasActiveMaterialSearch = false,
  lessons = [],
  totalLessons = lessons.length,
  hasActiveLessonFilters = false,
  roadmaps = [],
  totalRoadmaps = roadmaps.length,
  hasActiveRoadmapFilters = false,
  isHydrated = true,
  onOpenMaterial,
  onResetMaterialSearch,
  onOpenLesson,
  onEnrollLesson,
  onUnenrollLesson,
  onResetLessonFilters,
  onResetRoadmapFilters,
  onEnrollRoadmap,
  onUnenrollRoadmap,
  onOpenRoadmap,
}) {
  if (activeTab === 'materials') {
    if (!isHydrated) {
      return <MaterialsLoadingState />;
    }

    if (totalMaterials === 0) {
      return (
        <EmptyState
          title="No materials yet"
          description="Add YouTube videos, files, links, text notes, images, or combine several source types inside one material."
        />
      );
    }

    if (materials.length === 0 && hasActiveMaterialSearch) {
      return (
        <EmptyState
          title="No materials match this search"
          description="Try a different search term or clear the search."
          actionLabel="Clear search"
          onAction={onResetMaterialSearch}
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
      return <LessonsLoadingState showAction />;
    }

    if (totalLessons === 0) {
      return (
        <EmptyState
          title="No lessons yet"
          description="Click Create Lesson to generate a theoretical lesson from existing materials."
        />
      );
    }

    if (lessons.length === 0 && hasActiveLessonFilters) {
      return (
        <EmptyState
          title="No lessons match these filters"
          description="Try a different search term, remove a tag, or reset the filters."
          actionLabel="Reset filters"
          onAction={onResetLessonFilters}
        />
      );
    }

    return (
      <LessonsGrid
        lessons={lessons}
        onOpenLesson={onOpenLesson}
        onEnrollLesson={onEnrollLesson}
        onUnenrollLesson={onUnenrollLesson}
        showEnrollmentAction
      />
    );
  }

  if (activeTab === 'roadmaps') {
    if (!isHydrated) {
      return <MaterialsLoadingState />;
    }

    if (totalRoadmaps === 0) {
      return (
        <EmptyState
          title="No roadmaps yet"
          description="Click Create Roadmap to assemble a learning path from existing lessons."
        />
      );
    }

    if (roadmaps.length === 0 && hasActiveRoadmapFilters) {
      return (
        <EmptyState
          title="No roadmaps match these filters"
          description="Try a different search term, remove a tag, or reset the filters."
          actionLabel="Reset filters"
          onAction={onResetRoadmapFilters}
        />
      );
    }

    return (
      <RoadmapsGrid
        roadmaps={roadmaps}
        onEnrollRoadmap={onEnrollRoadmap}
        onUnenrollRoadmap={onUnenrollRoadmap}
        onOpenRoadmap={onOpenRoadmap}
      />
    );
  }

  return (
    <EmptyState
      title="Nothing here yet"
      description="Choose another library tab to continue."
    />
  );
}
