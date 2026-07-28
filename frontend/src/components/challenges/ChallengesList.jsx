import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Group,
  Text,
  Button,
  Badge,
  Stack,
  Box,
  Tabs,
  Divider,
  Progress,
  ThemeIcon,
  Loader,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconCheck,
  IconTarget,
  IconCoin,
  IconClock,
  IconCalendar,
  IconCalendarWeek,
  IconCalendarMonth,
  IconTrophy,
} from '@tabler/icons-react';
import api from '../../api/axiosConfig';
import { useAuth } from '../../hooks/useAuth';

const difficultyConfig = {
  easy: { color: 'green', label: 'Facil' },
  medium: { color: 'yellow', label: 'Media' },
  hard: { color: 'orange', label: 'Dificil' },
  expert: { color: 'red', label: 'Experto' },
};

const ChallengeCard = ({ challenge, onComplete, completing }) => {
  const diff = difficultyConfig[challenge.difficulty] || difficultyConfig.medium;

  return (
    <Card className="card-stat" p="md">
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
            <Group gap="xs">
              <Text fw={600}>{challenge.title}</Text>
              <Badge color={diff.color} size="xs">{diff.label}</Badge>
            </Group>
            <Text size="sm" c="dimmed">{challenge.description}</Text>
            <Group mt="xs" gap="xs">
              <Badge color="gold" size="sm" leftSection={<IconCoin size={12} />}>
                {challenge.points_reward} pts
              </Badge>
              {challenge.completed ? (
                <Badge color="green" size="sm" leftSection={<IconCheck size={12} />}>
                  Completado
                </Badge>
              ) : (
                <Badge color="gray" size="sm" leftSection={<IconClock size={12} />}>
                  {challenge.days_remaining || 1} dias restantes
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
            onClick={() => onComplete(challenge.id, challenge.points_reward)}
            loading={completing === challenge.id}
          >
            Completar
          </Button>
        )}
      </Group>
    </Card>
  );
};

const ChallengesList = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('daily');
  const [challenges, setChallenges] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(null);
  const mountedRef = useRef(true);

  const fetchChallenges = async (type) => {
    setLoading(true);
    try {
      const res = await api.get(`/challenges?type=${type}`);
      if (mountedRef.current) setChallenges(res.data.data);
    } catch (err) {
      if (mountedRef.current) {
        notifications.show({
          title: 'Error',
          message: err.response?.data?.message || 'No se pudieron cargar los retos',
          color: 'red',
        });
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/challenges/stats');
      if (mountedRef.current) setStats(res.data.data);
    } catch (err) {
      console.error('Error cargando stats:', err);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    void (async () => {
      await fetchChallenges(activeTab);
      await fetchStats();
    })();
    return () => { mountedRef.current = false; };
  }, [activeTab]);

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
      if (res.data.data.badge_unlocked) {
        notifications.show({
          title: 'Insignia desbloqueada',
          message: 'Has desbloqueado una nueva insignia por completar este reto.',
          color: 'violet',
        });
      }
      notifications.show({
        title: 'Reto completado',
        message: `Has ganado ${pointsReward} puntos extra`,
        color: 'green',
      });
      fetchStats();
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

  const getTabIcon = (type) => {
    if (type === 'daily') return <IconCalendar size={16} />;
    if (type === 'weekly') return <IconCalendarWeek size={16} />;
    if (type === 'monthly') return <IconCalendarMonth size={16} />;
    return null;
  };

  if (loading) {
    return (
      <Box ta="center" py="xl">
        <Loader size="md" color="violet" />
        <Text size="sm" c="dimmed" mt="sm">Cargando retos...</Text>
      </Box>
    );
  }

  const completedCount = challenges.filter((c) => c.completed).length;

  return (
    <Box>
      {stats && (
        <Group mb="md" gap="xl">
          <Badge color="violet" size="lg" leftSection={<IconTrophy size={16} />}>
            Total: {stats.total}
          </Badge>
        </Group>
      )}

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="daily" leftSection={getTabIcon('daily')}>Diarios</Tabs.Tab>
          <Tabs.Tab value="weekly" leftSection={getTabIcon('weekly')}>Semanales</Tabs.Tab>
          <Tabs.Tab value="monthly" leftSection={getTabIcon('monthly')}>Mensuales</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Divider my="md" />

      <Group justify="space-between" mb="md">
        <Text size="sm" c="dimmed">
          {completedCount} / {challenges.length} completados
        </Text>
        {challenges.length > 0 && (
          <Progress value={(completedCount / challenges.length) * 100} color="violet" w={150} />
        )}
      </Group>

      <Stack gap="md">
        {challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            onComplete={handleComplete}
            completing={completing}
          />
        ))}
      </Stack>
    </Box>
  );
};

export default ChallengesList;
