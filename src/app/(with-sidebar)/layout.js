import { redirect } from 'next/navigation';
import WithSidebarShell from '../../components/layout/WithSidebarShell';
import { getCurrentUser } from '../../lib/currentUser';
import { getUserPermissionMap } from '../../lib/permissions';

export default async function WithSidebarLayout({ children }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  const currentUserPermissions = await getUserPermissionMap(currentUser);

  return (
    <WithSidebarShell
      currentUser={currentUser}
      currentUserPermissions={currentUserPermissions}
    >
      {children}
    </WithSidebarShell>
  );
}
