import { useState } from 'react';
import { Container, Paper, Title, Grid, Card, Text, Button, Badge, Group, Stack, Divider } from '@mantine/core';
import { useAuth } from '../hooks/useAuth';
import { notifications } from '@mantine/notifications';
import api from '../api/axiosConfig';
import { IconCoin, IconRocket, IconStar, IconCrown, IconCheck } from '@tabler/icons-react';

const POINT_PACKAGES = [
  { id: 'p1', points: 100, price: 1.99, label: '100 Puntos', icon: IconCoin, color: 'gray', popular: false },
  { id: 'p2', points: 300, price: 4.99, label: '300 Puntos', icon: IconCoin, color: 'gray', popular: false },
  { id: 'p3', points: 600, price: 8.99, label: '600 Puntos', icon: IconCoin, color: 'blue', popular: false },
  { id: 'p4', points: 1000, price: 12.99, label: '1000 Puntos', icon: IconStar, color: 'blue', popular: true },
  { id: 'p5', points: 2000, price: 19.99, label: '2000 Puntos', icon: IconStar, color: 'violet', popular: false },
  { id: 'p6', points: 5000, price: 39.99, label: '5000 Puntos', icon: IconRocket, color: 'orange', popular: false },
  { id: 'p7', points: 10000, price: 69.99, label: '10000 Puntos', icon: IconRocket, color: 'red', popular: false },
  { id: 'p8', points: 25000, price: 129.99, label: '25000 Puntos', icon: IconCrown, color: 'gold', popular: false },
];

const PointsStore = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(null);

  const handleBuy = async (packageId) => {
    setLoading(packageId);
    try {
      const res = await api.post('/payment/buy-points', { packageId });
      if (res.data.data.approvalUrl) {
        window.location.href = res.data.data.approvalUrl;
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'No se pudo procesar la compra',
        color: 'red',
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Container size="lg" py="xl">
      <Paper shadow="md" radius="lg" p="xl">
        <Group justify="space-between" mb="lg">
          <Title order={1}>
            <IconCoin size={32} color="#F59E0B" style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Tienda de Puntos
          </Title>
          <Badge size="xl" color="gold" variant="light" leftSection={<IconCoin size={18} />}>
            {user?.points || 0} puntos
          </Badge>
        </Group>
        <Text c="dimmed" size="lg" mb="xl">
          Compra puntos para canjear skins, insignias y contenido exclusivo.
        </Text>

        <Grid>
          {POINT_PACKAGES.map((pkg) => {
            const Icon = pkg.icon;
            const perPoint = (pkg.price / pkg.points * 1000).toFixed(1);
            return (
              <Grid.Col key={pkg.id} span={{ base: 12, sm: 6, md: 3 }}>
                <Card
                  shadow="sm"
                  p="md"
                  radius="md"
                  style={{
                    background: 'var(--bg-card)',
                    border: pkg.popular ? '2px solid var(--mantine-color-violet-6)' : '1px solid var(--border-color)',
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {pkg.popular && (
                    <Badge color="violet" variant="filled" size="sm" style={{ position: 'absolute', top: -10, left: 16 }}>
                      Popular
                    </Badge>
                  )}
                  <Stack align="center" gap="xs" style={{ flex: 1 }}>
                    <Badge color={pkg.color} variant="light" size="lg" circle>
                      <Icon size={20} />
                    </Badge>
                    <Title order={3}>{pkg.points.toLocaleString()}</Title>
                    <Text size="sm" c="dimmed">puntos</Text>
                    <Divider w="100%" />
                    <Text size="xl" fw={700} c="violet">
                      ${pkg.price.toFixed(2)}
                    </Text>
                    <Text size="xs" c="dimmed">${perPoint} por 1K pts</Text>
                    <Stack gap={4} style={{ width: '100%' }}>
                      <Group gap={4} c="dimmed" size="xs">
                        <IconCheck size={14} color="#2ECC71" />
                        <Text size="xs">Uso inmediato</Text>
                      </Group>
                      <Group gap={4} c="dimmed" size="xs">
                        <IconCheck size={14} color="#2ECC71" />
                        <Text size="xs">Sin expiracion</Text>
                      </Group>
                    </Stack>
                  </Stack>
                  <Button
                    fullWidth
                    variant={pkg.popular ? 'gradient' : 'filled'}
                    gradient={pkg.popular ? { from: '#7C3AED', to: '#EC4899' } : undefined}
                    onClick={() => handleBuy(pkg.id)}
                    loading={loading === pkg.id}
                    mt="md"
                  >
                    Comprar
                  </Button>
                </Card>
              </Grid.Col>
            );
          })}
        </Grid>
      </Paper>
    </Container>
  );
};

export default PointsStore;
