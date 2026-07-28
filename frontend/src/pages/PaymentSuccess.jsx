import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Paper, Title, Text, Button, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../hooks/useAuth';
import { IconCheck, IconX } from '@tabler/icons-react';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateUser, user } = useAuth();

  const success = searchParams.get('success') === 'true';

  useEffect(() => {
    if (success) {
      updateUser({ ...user, is_premium: true });
      notifications.show({
        title: 'Pago exitoso!',
        message: 'Ahora eres usuario Premium',
        color: 'green',
        icon: <IconCheck size={18} />,
      });
    } else {
      notifications.show({
        title: 'Pago no completado',
        message: 'El pago no pudo ser procesado',
        color: 'red',
      });
    }
  }, []);

  if (success) {
    return (
      <Container size="sm" py="xl">
        <Paper shadow="md" radius="lg" p="xl" ta="center">
          <Stack align="center" gap="md">
            <IconCheck size={60} color="#2ECC71" />
            <Title order={2}>Pago exitoso!</Title>
            <Text c="dimmed" size="lg">Bienvenido a LifeScore Premium</Text>
            <Button onClick={() => navigate('/dashboard')} color="violet" mt="md">
              Ir al Dashboard
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
          <Title order={2}>Error en el pago</Title>
          <Text c="dimmed">El pago no pudo ser confirmado. Intenta de nuevo.</Text>
          <Button onClick={() => navigate('/premium')} color="violet" mt="md">
            Intentar de nuevo
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default PaymentSuccess;
