import { Box, Tab, Tabs } from '@mui/material';
import { AI_DIGITAL_COLORS } from '../../lib/brandColors';

const libraryTabs = [
  { value: 'materials', label: 'Materials' },
  { value: 'lessons', label: 'Lessons' },
  { value: 'roadmaps', label: 'Roadmaps' },
];

export default function LibraryTabs({
  activeTab,
  onTabChange,
  actionSlot,
  counts = {},
}) {
  return (
    <Box
      sx={{
        mb: 3.5,
        borderBottom: '1px solid rgba(0, 9, 220, 0.2)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'stretch', lg: 'flex-end' },
          justifyContent: 'space-between',
          gap: 2,
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        <Tabs
          value={activeTab}
          onChange={onTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            flex: '0 0 auto',
            minWidth: 'max-content',
            minHeight: 50,
            '& .MuiTabs-indicator': {
              height: 2,
              backgroundColor: AI_DIGITAL_COLORS.yvesKleinBlue,
            },
            '& .MuiTab-root': {
              minHeight: 50,
              px: 2.5,
              color: '#80808E',
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: '0.04em',
              lineHeight: 1.2,
              textTransform: 'uppercase',
              transition: 'color 0.16s ease',
              '&.Mui-selected': {
                color: AI_DIGITAL_COLORS.yvesKleinBlue,
              },
            },
            '& .MuiTab-root:hover': {
              color: AI_DIGITAL_COLORS.yvesKleinBlue,
            },
          }}
        >
          {libraryTabs.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                  {tab.label}
                  <Box
                    component="span"
                    sx={{
                      color: '#80808E',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: 0,
                    }}
                  >
                    {counts[tab.value] || 0}
                  </Box>
                </Box>
              }
            />
          ))}
        </Tabs>

        {actionSlot && (
          <Box sx={{ flex: '1 1 auto', minWidth: { md: 0 }, pb: { md: 1 } }}>
            {actionSlot}
          </Box>
        )}
      </Box>
    </Box>
  );
}
