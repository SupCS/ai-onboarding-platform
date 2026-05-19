import { Container } from '@mui/material';
import { redirect } from 'next/navigation';
import TeamProgressDashboard from '../../../components/team-progress/TeamProgressDashboard';
import { USER_ROLES } from '../../../lib/auth';
import { getCurrentUser } from '../../../lib/currentUser';
import { getTeamDashboardData } from '../../../lib/teamDashboard';

export const metadata = {
  title: 'Team Progress',
};

export default async function TeamProgressPage() {
  const currentUser = await getCurrentUser();

  if (currentUser?.role !== USER_ROLES.TEAMLEAD) {
    redirect('/library');
  }

  const data = await getTeamDashboardData(currentUser);

  return (
    <Container maxWidth={false} disableGutters>
      <TeamProgressDashboard initialData={data} />
    </Container>
  );
}
