import LibraryClient from './LibraryClient';
import { getCurrentUser } from '../../../lib/currentUser';
import { getUserPermissionMap } from '../../../lib/permissions';

export const metadata = {
  title: 'Library',
};

export default async function LibraryPage() {
  const currentUser = await getCurrentUser();
  const permissions = await getUserPermissionMap(currentUser);

  return <LibraryClient currentUserPermissions={permissions} />;
}
