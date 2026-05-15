import { Container } from '@mui/material';
import TeamProgressDashboard from '../../../components/team-progress/TeamProgressDashboard';
import { getCurrentUser } from '../../../lib/currentUser';
import { getTeamDashboardData } from '../../../lib/teamDashboard';

export const metadata = {
  title: 'Team Progress',
};

export default async function TeamProgressPage() {
  const currentUser = await getCurrentUser();
  const data = await getTeamDashboardData(currentUser);

  return (
    <Container maxWidth={false} disableGutters>
      <TeamProgressDashboard initialData={data} />
    </Container>
  );
}
