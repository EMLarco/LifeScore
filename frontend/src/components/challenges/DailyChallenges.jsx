import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Group,
  Text,
  Button,
  Badge,
  Stack,
  Box,
  Paper,
  ThemeIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconTarget, IconCoin } from '@tabler/icons-react';
import api from '../../api/axiosConfig';
import { useAuth } from '../../hooks/useAuth';

const DailyChallenges = () => {
  const { user, updateUser } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetchChallenges = async () => {
      try {
        const res = await api.get('/challenges?type=daily');
        if (mountedRef.current) setChallenges(res.data.data);
      } catch (err) {
        if (mountedRef.current) {
          notifications.show({
            title: 'Error',
            message: err.response?.data?.message || 'No se pudieron cargar los retos diarios',
            color: 'red',
          });
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };
    fetchChallenges();
    return () => { mountedRef.current = false; };
  }, []);

  const handleComplete = async (challengeId, pointsReward) => {
    setCompleting(challengeId);
    try {
      const res = await api.post(`/challenges/${challengeId}/complete`);
      updateUser({ ...user, points: res.data.data.new_points });
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === challengeId ? { ...c, completed: true } : c
        )
      );
      notifications.show({
        title: 'Reto completado',
        message: `Has ganado ${pointsReward} puntos extra`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'No se pudo completar el reto',
        color: 'red',
      });
    } finally {
      setCompleting(null);
    }
  };

  if (loading) {
    return (
      <Box ta="center" py="xl">
        <Text size="sm" c="dimmed">Cargando retos del dia...</Text>
      </Box>
    );
  }

  if (challenges.length === 0) {
    return (
      <Paper p="xl" className="paper-clean" ta="center">
        <Text c="dimmed">No hay retos disponibles hoy. Vuelve manana!</Text>
      </Paper>
    );
  }

  const completedCount = challenges.filter((c) => c.completed).length;

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text size="lg" fw={600}>Retos del dia</Text>
        <Badge color="violet" size="lg">
          {completedCount} / {challenges.length} completados
        </Badge>
      </Group>

      {challenges.map((challenge) => (
        <Card key={challenge.id} className="card-stat" p="md">
          <Group justify="space-between" align="center">
            <Group>
              <ThemeIcon
                color={challenge.completed ? 'green' : 'violet'}
                variant={challenge.completed ? 'filled' : 'light'}
                radius="xl"
                size="lg"
              >
                {challenge.completed ? <IconCheck size={20} /> : <IconTarget size={20} />}
              </ThemeIcon>
              <Box>
                <Text fw={600}>{challenge.title}</Text>
                <Text size="sm" c="dimmed">{challenge.description}</Text>
                <Group mt="xs" gap="xs">
                  <Badge color="gold" size="sm" leftSection={<IconCoin size={12} />}>
                    {challenge.points_reward} pts
                  </Badge>
                  {challenge.completed && (
                    <Badge color="green" size="sm" leftSection={<IconCheck size={12} />}>
                      Completado
                    </Badge>
                  )}
                </Group>
              </Box>
            </Group>

            {!challenge.completed && (
              <Button
                variant="gradient"
                gradient={{ from: '#7C3AED', to: '#EC4899' }}
                size="sm"
                radius="xl"
                onClick={() => handleComplete(challenge.id, challenge.points_reward)}
                loading={completing === challenge.id}
              >
                Completar
              </Button>
            )}
          </Group>
        </Card>
      ))}
    </Stack>
  );
};

export default DailyChallenges;
