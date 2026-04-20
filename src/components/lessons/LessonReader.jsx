import { Box } from '@mui/material';

export default function LessonReader({ html }) {
  return (
    <Box
      className="lesson-reader"
      dangerouslySetInnerHTML={{ __html: html }}
      sx={{
        color: '#172033',
        fontSize: { xs: 17, md: 18 },
        lineHeight: 1.78,
        '& > *:first-of-type': {
          mt: 0,
        },
        '& h1': {
          mt: 0,
          mb: 3,
          fontSize: { xs: 38, md: 58 },
          lineHeight: 1.02,
          letterSpacing: '-0.05em',
          color: '#0f172a',
        },
        '& h2': {
          mt: 6,
          mb: 2,
          fontSize: { xs: 28, md: 36 },
          lineHeight: 1.12,
          letterSpacing: '-0.035em',
          color: '#102a43',
        },
        '& h3': {
          mt: 4,
          mb: 1.5,
          fontSize: { xs: 22, md: 26 },
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          color: '#183b56',
        },
        '& p': {
          my: 1.5,
        },
        '& ul, & ol': {
          my: 2,
          pl: 3.5,
        },
        '& li': {
          my: 0.75,
        },
        '& blockquote': {
          my: 3,
          mx: 0,
          p: { xs: 2, md: 3 },
          borderLeft: '5px solid #0f766e',
          borderRadius: 3,
          backgroundColor: '#ecfdf5',
          color: '#064e3b',
          fontWeight: 600,
        },
        '& code': {
          px: 0.75,
          py: 0.25,
          borderRadius: 1,
          backgroundColor: '#eef2ff',
          color: '#3730a3',
          fontSize: '0.92em',
        },
        '& pre': {
          my: 3,
          p: 2.5,
          borderRadius: 3,
          overflowX: 'auto',
          backgroundColor: '#0f172a',
          color: '#e2e8f0',
        },
        '& pre code': {
          p: 0,
          backgroundColor: 'transparent',
          color: 'inherit',
        },
        '& a': {
          color: '#0f766e',
          fontWeight: 700,
          textDecoration: 'underline',
          textUnderlineOffset: 4,
        },
        '& mark': {
          px: 0.35,
          py: 0.1,
          borderRadius: 0.75,
        },
      }}
    />
  );
}
