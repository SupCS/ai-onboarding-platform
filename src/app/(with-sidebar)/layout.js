import { Box } from '@mui/material';
import Sidebar from '../../components/layout/Sidebar';

export default function WithSidebarLayout({ children }) {
  return (
    <>
      <Sidebar />

      <Box
        sx={{
          minHeight: '100vh',
          pl: '96px',
          pr: 3,
          py: 3,
        }}
      >
        {children}
      </Box>
    </>
  );
}