import { Container, Paper, Title, Text } from '@mantine/core';
import ChallengesList from '../components/challenges/ChallengesList';

const Challenges = () => {
  return (
    <Container size="lg" py="xl">
      <Paper className="paper-clean" p="xl">
        <Title order={1} mb="lg">Retos</Title>
        <Text c="dimmed" mb="lg">
          Completa retos diarios, semanales o mensuales para ganar puntos extra y desbloquear insignias.
        </Text>
        <ChallengesList />
      </Paper>
    </Container>
  );
};

export default Challenges;
