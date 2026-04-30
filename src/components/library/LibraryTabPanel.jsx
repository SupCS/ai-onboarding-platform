import EmptyState from '../ui/EmptyState';
import LessonsGrid from '../lessons/LessonsGrid';
import LessonsLoadingState from '../lessons/LessonsLoadingState';
import MaterialsGrid from '../materials/MaterialsGrid';
import MaterialsLoadingState from '../materials/MaterialsLoadingState';
import RoadmapsGrid from '../roadmaps/RoadmapsGrid';

export default function LibraryTabPanel({
  activeTab,
  materials = [],
  lessons = [],
  roadmaps = [],
  isHydrated = true,
  onOpenMaterial,
  onOpenLesson,
  onEnrollLesson,
  onUnenrollLesson,
  onEnrollRoadmap,
  onUnenrollRoadmap,
  onOpenRoadmap,
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
      return <LessonsLoadingState showAction />;
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

    if (roadmaps.length === 0) {
      return (
        <EmptyState
          title="No roadmaps yet"
          description="Click Create Roadmap to assemble a learning path from existing lessons."
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
