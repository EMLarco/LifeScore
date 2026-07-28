import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Paper,
  Grid,
  Card,
  Text,
  Button,
  Badge,
  Group,
  Loader,
  Stack,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../hooks/useAuth';
import { getRewards, redeemReward } from '../services/rewardsService';
import { IconCoin, IconLock, IconReceipt } from '@tabler/icons-react';

const rewardIconMap = {
  food: <IconReceipt size={28} />,
  meditation: <IconReceipt size={28} />,
  diamond: <IconReceipt size={28} />,
  discount: <IconReceipt size={28} />,
  moon: <IconReceipt size={28} />,
};

const Rewards = () => {
  const { user, updateUser } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const data = await getRewards();
        setRewards(data);
      } catch {
        notifications.show({
          title: 'Error',
          message: 'No se pudieron cargar las recompensas',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchRewards();
  }, []);

  const handleRedeem = async (rewardId, cost) => {
    if (user.points < cost) {
      notifications.show({
        title: 'Puntos insuficientes',
        message: 'Necesitas mas puntos para canjear esta recompensa',
        color: 'red',
      });
      return;
    }

    setRedeeming(rewardId);
    try {
      await redeemReward(rewardId);
      updateUser({ ...user, points: user.points - cost });
      notifications.show({
        title: 'Canje exitoso',
        message: 'Has canjeado la recompensa correctamente',
        color: 'green',
      });
      const data = await getRewards();
      setRewards(data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'No se pudo canjear',
        color: 'red',
      });
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Loader size="xl" />
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Paper shadow="md" radius="lg" p="xl">
        <Group justify="space-between" mb="lg">
          <Title order={1}>Canjear Puntos</Title>
          <Badge size="lg" color="gold" leftSection={<IconCoin size={16} />}>
            {user?.points || 0} puntos
          </Badge>
        </Group>

        <Grid>
          {rewards.map((reward) => (
            <Grid.Col key={reward.id} span={{ base: 12, sm: 6, md: 4 }}>
              <Card
                shadow="sm"
                padding="lg"
                radius="md"
                style={{
                  border: reward.is_premium_reward && !user?.is_premium ? '1px solid #EC4899' : 'none',
                }}
              >
                <Stack align="center" gap="xs">
                  <Text size="xl">{rewardIconMap[reward.icon] || <IconCoin size={28} />}</Text>
                  <Text fw={700} ta="center">
                    {reward.name}
                  </Text>
                  <Text size="sm" c="dimmed" ta="center">
                    {reward.description}
                  </Text>
                  <Badge color="violet" size="lg" leftSection={<IconCoin size={14} />}>
                    {reward.points_cost} pts
                  </Badge>
                  {reward.is_premium_reward && !user?.is_premium && (
                    <Badge color="red" variant="filled" size="sm" leftSection={<IconLock size={12} />}>
                      Premium
                    </Badge>
                  )}
                  <Button
                    fullWidth
                    variant={user?.points >= reward.points_cost ? 'gradient' : 'outline'}
                    gradient={{ from: '#7C3AED', to: '#EC4899' }}
                    onClick={() => handleRedeem(reward.id, reward.points_cost)}
                    loading={redeeming === reward.id}
                    disabled={user?.points < reward.points_cost || (reward.is_premium_reward && !user?.is_premium)}
                  >
                    {user?.points >= reward.points_cost ? 'Canjear' : 'Puntos insuficientes'}
                  </Button>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Paper>
    </Container>
  );
};

export default Rewards;
