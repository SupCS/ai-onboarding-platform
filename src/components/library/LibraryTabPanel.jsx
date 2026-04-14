import EmptyState from '../ui/EmptyState';

export default function LibraryTabPanel({ activeTab }) {
  if (activeTab === 'materials') {
    return (
      <EmptyState
        title="No materials yet"
        description="Uploaded documents and videos will appear here. This is where users with permission will manage source content."
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