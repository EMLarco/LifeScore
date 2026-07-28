import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Paper, Title, Text, Button, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../hooks/useAuth';
import { IconCheck, IconX, IconCoin } from '@tabler/icons-react';

const PointsSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, updateUser } = useAuth();

  const success = searchParams.get('success') === 'true';
  const points = parseInt(searchParams.get('points') || '0', 10);

  useEffect(() => {
    if (success && points > 0) {
      updateUser({ ...user, points: (user?.points || 0) + points });
      notifications.show({
        title: 'Puntos agregados!',
        message: `Se agregaron ${points} puntos a tu cuenta`,
        color: 'green',
        icon: <IconCheck size={18} />,
      });
    } else if (!success) {
      notifications.show({
        title: 'Compra no completada',
        message: 'La compra de puntos no pudo ser procesada',
        color: 'red',
      });
    }
  }, []);

  if (success) {
    return (
      <Container size="sm" py="xl">
        <Paper shadow="md" radius="lg" p="xl" ta="center">
          <Stack align="center" gap="md">
            <IconCoin size={60} color="#F59E0B" />
            <Title order={2}>Puntos agregados!</Title>
            <Text c="dimmed" size="lg">Se agregaron <strong>{points}</strong> puntos a tu cuenta</Text>
            <Button onClick={() => navigate('/points-store')} color="violet" mt="md">
              Volver a la tienda
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Paper shadow="md" radius="lg" p="xl" ta="center">
        <Stack align="center" gap="md">
          <IconX size={60} color="#EF4444" />
          <Title order={2}>Error en la compra</Title>
          <Text c="dimmed">La compra de puntos no pudo ser procesada. Intenta de nuevo.</Text>
          <Button onClick={() => navigate('/points-store')} color="violet" mt="md">
            Intentar de nuevo
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default PointsSuccess;
