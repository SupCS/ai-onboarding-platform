import { Paper, Tab, Tabs } from '@mui/material';

const libraryTabs = [
  { value: 'materials', label: 'Materials' },
  { value: 'lessons', label: 'Lessons' },
  { value: 'roadmaps', label: 'Roadmaps' },
];

export default function LibraryTabs({ activeTab, onTabChange }) {
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        p: 1,
        borderRadius: 4,
        border: '1px solid #e5e7eb',
        backgroundColor: '#fff',
      }}
    >
      <Tabs
        value={activeTab}
        onChange={onTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          px: 1,
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 600,
            minHeight: 48,
            transition: 'all 0.3s ease',
          },
          '& .MuiTab-root:hover': {
            color: 'primary.main',
            textShadow: '0 0 8px rgba(25, 118, 210, 0.4)',
          },
        }}
      >
        {libraryTabs.map((tab) => (
          <Tab key={tab.value} value={tab.value} label={tab.label} />
        ))}
      </Tabs>
    </Paper>
  );
}