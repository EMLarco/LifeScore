import { useState } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  Stack,
  Button,
  Modal,
  Group,
  Badge,
  Card,
  Divider,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PremiumLock } from '../components/common/PremiumLock';
import { notifications } from '@mantine/notifications';
import api from '../api/axiosConfig';
import { createOrder } from '../services/paymentService';
import { IconCoin, IconCrown, IconBrain, IconBrandPaypal } from '@tabler/icons-react';

const PREMIUM_COST = 500;

const PremiumFeatures = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [modalOpened, setModalOpened] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (user.points < PREMIUM_COST) {
      notifications.show({
        title: 'Puntos insuficientes',
        message: `Necesitas ${PREMIUM_COST - user.points} puntos mas`,
        color: 'red',
      });
      return;
    }
    setLoading(true);
    try {
      await api.post('/users/upgrade-premium');
      updateUser({ ...user, is_premium: true, points: user.points - PREMIUM_COST });
      notifications.show({ title: 'Felicidades', message: 'Ahora eres usuario Premium', color: 'green' });
      setModalOpened(false);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'No se pudo completar la actualizacion',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalPayment = async () => {
    setLoading(true);
    try {
      const order = await createOrder('monthly');
      if (order.approvalUrl) {
        window.location.href = order.approvalUrl;
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'No se pudo iniciar el pago con PayPal',
        color: 'red',
      });
      setLoading(false);
    }
  };

  return (
    <Container size="lg" py="xl">
      <Paper shadow="md" radius="lg" p="xl">
        <Group justify="space-between" mb="lg">
          <Title order={1}>Funciones Premium</Title>
          {user?.is_premium && (
            <Badge color="gold" variant="filled" size="lg" leftSection={<IconCrown size={16} />}>
              Activo
            </Badge>
          )}
        </Group>

        <PremiumLock isPremium={user?.is_premium} title="Contenido Exclusivo">
          <Stack gap="md">
            <Card
              withBorder
              style={{ background: 'var(--bg-card)', cursor: 'pointer' }}
              onClick={() => navigate('/agent')}
            >
              <Group>
                <IconBrain size={32} color="#7C3AED" />
                <div>
                  <Text fw={600}>Asistente IA</Text>
                  <Text size="sm" c="dimmed">
                    Chatea con nuestra IA para obtener recomendaciones personalizadas en tiempo real.
                  </Text>
                </div>
                <Badge color="gold">Premium</Badge>
              </Group>
            </Card>
            <Text c="dimmed">Tracker de comidas, meditaciones guiadas, temas exclusivos y mas.</Text>
          </Stack>
        </PremiumLock>

        {!user?.is_premium && (
          <Stack gap="md" mt="xl">
            <Button
              variant="gradient"
              gradient={{ from: '#7C3AED', to: '#EC4899' }}
              size="lg"
              leftSection={<IconCrown size={20} />}
              onClick={() => setModalOpened(true)}
            >
              Obtener Premium con Puntos ({PREMIUM_COST} pts)
            </Button>

            <Divider label="o" labelPosition="center" />

            <Button
              variant="gradient"
              gradient={{ from: '#0070BA', to: '#003087' }}
              size="lg"
              leftSection={<IconBrandPaypal size={20} />}
              onClick={handlePayPalPayment}
              loading={loading}
            >
              Pagar con PayPal ($9.99)
            </Button>
          </Stack>
        )}

        <Modal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          title="Adquirir Membresia Premium"
          centered
        >
          <Stack align="center" gap="md">
            <IconCrown size={60} color="#7C3AED" />
            <Text fw={700} size="lg">Membresia Premium</Text>
            <Text c="dimmed" ta="center">
              Disfruta de contenido exclusivo, temas especiales y mas beneficios.
            </Text>
            <Badge size="xl" color="gold" leftSection={<IconCoin size={18} />}>
              {PREMIUM_COST} puntos
            </Badge>
            <Text size="sm" c="dimmed">
              Tienes {user?.points || 0} puntos
            </Text>
            <Group>
              <Button variant="subtle" onClick={() => setModalOpened(false)}>
                Cancelar
              </Button>
              <Button
                variant="gradient"
                gradient={{ from: '#7C3AED', to: '#EC4899' }}
                onClick={handleUpgrade}
                loading={loading}
                disabled={user?.points < PREMIUM_COST}
              >
                {user?.points >= PREMIUM_COST ? 'Confirmar' : 'Puntos insuficientes'}
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Paper>
    </Container>
  );
};

export default PremiumFeatures;
