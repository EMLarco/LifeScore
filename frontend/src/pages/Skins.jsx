import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Title,
  Grid,
  Card,
  Image,
  Text,
  Button,
  Badge,
  Loader,
  Group,
  Stack,
  Divider,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axiosConfig';
import { IconPalette, IconCoin, IconShoppingCart, IconCheck } from '@tabler/icons-react';

const Skins = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [skins, setSkins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);

  const fetchSkins = async () => {
    setLoading(true);
    try {
      const res = await api.get('/skins');
      setSkins(res.data.data);
    } catch {
      // handled below
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkins();
  }, []);

  const handleBuy = async (skinId) => {
    setBuying(skinId);
    try {
      await api.post(`/skins/${skinId}/buy`);
      notifications.show({ color: 'green', message: 'Skin comprada y equipada' });
      fetchSkins();
    } catch (error) {
      notifications.show({ color: 'red', message: error.response?.data?.message || 'Error al comprar' });
    } finally {
      setBuying(null);
    }
  };

  const handleEquip = async (skinId) => {
    try {
      await api.post(`/skins/${skinId}/equip`);
      notifications.show({ color: 'green', message: 'Skin equipada' });
      fetchSkins();
    } catch {
      notifications.show({ color: 'red', message: 'Error al equipar' });
    }
  };

  if (loading) {
    return (
      <Container size="lg" py="xl" ta="center">
        <Loader size="xl" color="violet" />
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Paper shadow="md" radius="lg" p="xl">
        <Group justify="space-between" mb="lg">
          <Title order={1}>
            <IconPalette size={28} color="#8B5CF6" style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Tienda de Skins
          </Title>
          <Button
            variant="light"
            color="gold"
            leftSection={<IconCoin size={18} />}
            onClick={() => navigate('/points-store')}
          >
            {user?.points || 0} pts — Comprar mas
          </Button>
        </Group>

        <Text c="dimmed" mb="xl">
          Personaliza tu perfil con skins exclusivas. Necesitas puntos para comprar.
        </Text>

        {skins.length === 0 ? (
          <Paper p="xl" ta="center">
            <IconPalette size={48} color="var(--text-secondary)" style={{ opacity: 0.5 }} />
            <Title order={3} mt="md" c="dimmed">No hay skins disponibles</Title>
            <Text c="dimmed" size="sm" mt="xs">Vuelve pronto para ver nuevas skins</Text>
          </Paper>
        ) : (
          <Grid>
            {skins.map((skin) => (
              <Grid.Col key={skin.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                <Card
                  shadow="sm"
                  p="md"
                  radius="md"
                  style={{
                    background: 'var(--bg-card)',
                    border: skin.equipped
                      ? '2px solid var(--mantine-color-violet-6)'
                      : '1px solid var(--border-color)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                >
                  <Card.Section>
                    <Image
                      src={skin.image_url || '/icon-192x192.png'}
                      h={160}
                      alt={skin.name}
                      fallbackSrc="/icon-192x192.png"
                      style={{ objectFit: 'cover' }}
                    />
                  </Card.Section>
                  <Stack mt="sm" gap="xs">
                    <Group justify="space-between">
                      <Text fw={700} size="md">{skin.name}</Text>
                      {skin.premium && <Badge color="gold" size="xs">Premium</Badge>}
                    </Group>
                    {skin.description && (
                      <Text size="xs" c="dimmed">{skin.description}</Text>
                    )}
                    <Divider />
                    <Group justify="space-between">
                      <Badge color="violet" variant="light" leftSection={<IconCoin size={12} />}>
                        {skin.points_cost === 0 ? 'Gratis' : `${skin.points_cost} pts`}
                      </Badge>
                      {skin.equipped && <Badge color="green" size="xs" leftSection={<IconCheck size={12} />}>Equipada</Badge>}
                    </Group>
                    {skin.equipped ? (
                      <Badge color="violet" fullWidth size="lg" variant="filled">
                        Equipada
                      </Badge>
                    ) : skin.owned ? (
                      <Button
                        size="sm"
                        color="violet"
                        fullWidth
                        variant="light"
                        onClick={() => handleEquip(skin.id)}
                        leftSection={<IconCheck size={16} />}
                      >
                        Equipar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        fullWidth
                        variant={user?.points >= skin.points_cost ? 'gradient' : 'outline'}
                        gradient={{ from: '#7C3AED', to: '#EC4899' }}
                        onClick={() => handleBuy(skin.id)}
                        loading={buying === skin.id}
                        disabled={user?.points < skin.points_cost}
                        leftSection={<IconShoppingCart size={16} />}
                      >
                        {user?.points >= skin.points_cost ? 'Comprar' : 'Sin puntos'}
                      </Button>
                    )}
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Paper>
    </Container>
  );
};

export default Skins;
