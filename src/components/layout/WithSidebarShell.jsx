'use client';

import { usePathname } from 'next/navigation';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';

function isLessonReadingRoute(pathname = '') {
  return /^\/lessons\/[^/]+\/?$/.test(pathname);
}

export default function WithSidebarShell({
  children,
  currentUser,
  currentUserPermissions,
}) {
  const pathname = usePathname();
  const isReadingMode = isLessonReadingRoute(pathname);

  return (
    <>
      {!isReadingMode && (
        <Sidebar
          currentUser={currentUser}
          currentUserPermissions={currentUserPermissions}
        />
      )}

      <Box
        sx={{
          minHeight: '100vh',
          pl: isReadingMode ? 0 : '96px',
          pr: isReadingMode ? 0 : 3,
          py: isReadingMode ? 0 : 3,
        }}
      >
        {children}
      </Box>
    </>
  );
}
