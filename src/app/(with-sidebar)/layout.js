import { redirect } from 'next/navigation';
import { Box } from '@mui/material';
import Sidebar from '../../components/layout/Sidebar';
import { getCurrentUser } from '../../lib/currentUser';
import { getUserPermissionMap } from '../../lib/permissions';

export default async function WithSidebarLayout({ children }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  const currentUserPermissions = await getUserPermissionMap(currentUser);

  return (
    <>
      <Sidebar
        currentUser={currentUser}
        currentUserPermissions={currentUserPermissions}
      />

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
