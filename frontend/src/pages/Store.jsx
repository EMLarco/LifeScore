import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Paper,
  Tabs,
  Grid,
  Card,
  Text,
  Button,
  Badge,
  Group,
  Loader,
  Stack,
  CardSection,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axiosConfig';
import { IconCoin, IconShoppingCart, IconPalette, IconAward, IconUser } from '@tabler/icons-react';

const categories = [
  { value: 'all', label: 'Todos', icon: IconShoppingCart },
  { value: 'banner', label: 'Banners', icon: IconPalette },
  { value: 'theme', label: 'Temas', icon: IconPalette },
  { value: 'badge', label: 'Insignias', icon: IconAward },
  { value: 'avatar', label: 'Avatares', icon: IconUser },
];

const Store = () => {
  const { user, updateUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [purchasing, setPurchasing] = useState(null);

  const fetchItems = async (category) => {
    setLoading(true);
    try {
      const url = category === 'all' ? '/store' : `/store?category=${category}`;
      const res = await api.get(url);
      setItems(res.data.data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'No se pudieron cargar los items',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(activeCategory);
  }, [activeCategory]);

  const handlePurchase = async (itemId, cost) => {
    if (user.points < cost) {
      notifications.show({
        title: 'Puntos insuficientes',
        message: 'Necesitas mas puntos para comprar este item',
        color: 'red',
      });
      return;
    }
    setPurchasing(itemId);
    try {
      await api.post(`/store/${itemId}/purchase`);
      updateUser({ ...user, points: user.points - cost });
      notifications.show({
        title: 'Adquirido',
        message: 'Item comprado correctamente',
        color: 'green',
      });
      fetchItems(activeCategory);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Error al comprar',
        color: 'red',
      });
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <Container size="lg" py="xl">
      <Paper shadow="md" radius="lg" p="xl">
        <Group justify="space-between" mb="lg">
          <Title order={1}>Tienda de Puntos</Title>
          <Badge size="lg" color="gold" leftSection={<IconCoin size={16} />}>
            {user?.points || 0} puntos
          </Badge>
        </Group>

        <Tabs value={activeCategory} onChange={setActiveCategory}>
          <Tabs.List>
            {categories.map((cat) => (
              <Tabs.Tab key={cat.value} value={cat.value} leftSection={<cat.icon size={16} />}>
                {cat.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>

        {loading ? (
          <Group justify="center" py="xl">
            <Loader size="xl" />
          </Group>
        ) : items.length === 0 ? (
          <Paper p="xl" ta="center" mt="md">
            <Text c="dimmed">No hay items disponibles en esta categoria</Text>
          </Paper>
        ) : (
          <Grid mt="md">
            {items.map((item) => (
              <Grid.Col key={item.id} span={{ base: 12, sm: 6, md: 4 }}>
                <Card shadow="sm" padding="lg" radius="md">
                  <Stack align="center" gap="xs">
                    {item.image_url && (
                      <CardSection>
                        <img
                          src={item.image_url}
                          alt={item.name}
                          style={{
                            width: '100%',
                            height: 140,
                            objectFit: 'cover',
                            borderRadius: '8px 8px 0 0',
                          }}
                        />
                      </CardSection>
                    )}
                    <Badge color="gray" variant="light" size="sm">
                      {item.category}
                    </Badge>
                    <Text fw={700} ta="center">
                      {item.name}
                    </Text>
                    {item.description && (
                      <Text size="sm" c="dimmed" ta="center">
                        {item.description}
                      </Text>
                    )}
                    <Badge color="violet" size="lg" leftSection={<IconCoin size={14} />}>
                      {item.points_cost} pts
                    </Badge>
                    <Button
                      fullWidth
                      variant={user.points >= item.points_cost ? 'gradient' : 'outline'}
                      gradient={{ from: '#7C3AED', to: '#EC4899' }}
                      onClick={() => handlePurchase(item.id, item.points_cost)}
                      loading={purchasing === item.id}
                      disabled={user.points < item.points_cost}
                    >
                      {user.points >= item.points_cost ? 'Comprar' : 'Puntos insuficientes'}
                    </Button>
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

export default Store;
