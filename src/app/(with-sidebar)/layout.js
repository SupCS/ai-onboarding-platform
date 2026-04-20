import { redirect } from 'next/navigation';
import { Box } from '@mui/material';
import Sidebar from '../../components/layout/Sidebar';
import { getCurrentUser } from '../../lib/currentUser';

export default async function WithSidebarLayout({ children }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  return (
    <>
      <Sidebar currentUser={currentUser} />

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
