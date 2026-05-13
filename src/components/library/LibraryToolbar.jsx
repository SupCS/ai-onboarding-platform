import { Box, Button, Typography } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import { AI_DIGITAL_COLORS } from '../../lib/brandColors';

const actionMap = {
  materials: 'Upload Material',
  lessons: 'Create Lesson',
  roadmaps: 'Create Roadmap',
};

export default function LibraryToolbar({
  activeTab,
  onPrimaryAction,
  canCreateByTab = {},
}) {
  const canCreate = canCreateByTab[activeTab] !== false;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', md: 'center' },
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        mb: 4,
      }}
    >
      <Box>
        <Typography
          sx={{
            mb: 1,
            color: AI_DIGITAL_COLORS.yvesKleinBlue,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.08em',
            lineHeight: 1.2,
            textTransform: 'uppercase',
          }}
        >
          Knowledge base
        </Typography>

        <Typography
          component="h1"
          sx={{
            m: 0,
            color: '#0B0B0B',
            fontFamily: '"Barlow Semi Condensed", Inter, Arial, sans-serif',
            fontSize: { xs: 48, md: 64 },
            fontWeight: 900,
            letterSpacing: 0,
            lineHeight: 0.95,
          }}
        >
          Library
        </Typography>

        <Typography
          sx={{
            mt: 1.5,
            color: '#80808E',
            fontSize: 15,
            lineHeight: 1.5,
            maxWidth: 480,
          }}
        >
          Manage materials, lessons, and roadmaps in one place.
        </Typography>
      </Box>

      {canCreate && (
        <Button
          variant="contained"
          size="large"
          startIcon={<AddOutlinedIcon />}
          onClick={onPrimaryAction}
          sx={{
            alignSelf: { xs: 'stretch', sm: 'flex-start', md: 'center' },
            borderRadius: 999,
            px: 3.25,
            py: 1.75,
            backgroundColor: AI_DIGITAL_COLORS.yvesKleinBlue,
            boxShadow: 'none',
            color: '#fff',
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: '0.06em',
            lineHeight: 1.2,
            textTransform: 'uppercase',
            '&:hover': {
              backgroundColor: '#0007B8',
              boxShadow: 'none',
            },
          }}
        >
          {actionMap[activeTab]}
        </Button>
      )}
    </Box>
  );
}
