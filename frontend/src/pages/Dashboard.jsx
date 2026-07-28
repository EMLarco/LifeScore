import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Box,
  Grid,
  Avatar,
  Badge,
  Stack,
  Progress,
  Card,
  Skeleton,
  ThemeIcon,
} from '@mantine/core';
import { useAuth } from '../hooks/useAuth';
import { getHabits } from '../services/habitService';
import api from '../api/axiosConfig';
import { notifications } from '@mantine/notifications';
import { IconTarget, IconList, IconCheck, IconFlame, IconCoin, IconCrown, IconClock } from '@tabler/icons-react';
import DailyChallenges from '../components/challenges/DailyChallenges';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

const Dashboard = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todaySchedule, setTodaySchedule] = useState([]);

  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const data = await getHabits();
        setHabits(data);
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: error.response?.data?.message || 'No se pudieron cargar los habitos',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchHabits();
  }, []);

  useEffect(() => {
    const fetchTodaySchedule = async () => {
      try {
        const jsDay = new Date().getDay();
        if (jsDay >= 1 && jsDay <= 5) {
          const res = await api.get('/schedule');
          const dayBlocks = res.data.data.filter(
            (e) => e.day_of_week === jsDay && !e.is_day_off
          );
          setTodaySchedule(dayBlocks);
        }
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: error.response?.data?.message || 'No se pudo cargar el horario',
          color: 'red',
        });
      }
    };
    if (user) fetchTodaySchedule();
  }, [user]);

  const completedToday = habits.filter((h) => h.completed_today).length;
  const totalHabits = habits.length;
  const progress = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;

  const recentActivity = habits
    .filter((h) => h.completed_today)
    .slice(0, 3)
    .map((h) => ({ title: h.title, time: 'Hoy' }));

  const today = DAY_NAMES[new Date().getDay()];

  return (
    <Container size="lg" py="xl">
      <Paper className="paper-clean" p="xl">
        <Group justify="space-between" align="flex-start">
          <Group>
            <Avatar
              size={64}
              radius="xl"
              color="violet"
              style={{ border: '2px solid #7C3AED' }}
            >
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Box>
              <Group>
                <Title order={2}>Bienvenido, {user?.name}</Title>
                {user?.is_premium && (
                  <Badge color="gold" variant="filled" size="lg" leftSection={<IconCrown size={14} />}>
                    Premium
                  </Badge>
                )}
              </Group>
              <Group mt="xs" gap="xs">
                <Badge color="violet" size="lg" leftSection={<IconTarget size={14} />}>
                  Nivel {user?.level || 1}
                </Badge>
                <Badge color="green" size="lg" leftSection={<IconFlame size={14} />}>
                  {user?.total_xp || 0} XP
                </Badge>
                <Badge color="gold" size="lg" leftSection={<IconCoin size={14} />}>
                  {user?.points || 0} pts
                </Badge>
              </Group>
              <Text size="sm" c="dimmed" mt="xs">
                Racha actual: {user?.daily_streak || 0} dias consecutivos
              </Text>
            </Box>
          </Group>
        </Group>
      </Paper>

      <Grid mt="xl">
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card className="card-stat">
            <Group>
              <ThemeIcon color="violet" radius="md" size="lg">
                <IconList size={20} />
              </ThemeIcon>
              <Box>
                <Text c="dimmed" size="sm">Habitos Activos</Text>
                <Title order={2}>{totalHabits}</Title>
              </Box>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card className="card-stat">
            <Group>
              <ThemeIcon color="green" radius="md" size="lg">
                <IconCheck size={20} />
              </ThemeIcon>
              <Box>
                <Text c="dimmed" size="sm">Completados Hoy</Text>
                <Title order={2}>{completedToday}</Title>
              </Box>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card className="card-stat">
            <Group>
              <ThemeIcon color="orange" radius="md" size="lg">
                <IconFlame size={20} />
              </ThemeIcon>
              <Box>
                <Text c="dimmed" size="sm">Racha Maxima</Text>
                <Title order={2}>{user?.max_streak || 0}</Title>
              </Box>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card className="card-stat">
            <Group>
              <ThemeIcon color="yellow" radius="md" size="lg">
                <IconCoin size={20} />
              </ThemeIcon>
              <Box>
                <Text c="dimmed" size="sm">Puntos Totales</Text>
                <Title order={2}>{user?.points || 0}</Title>
              </Box>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      <Paper className="paper-clean" p="xl" mt="xl">
        <Group justify="space-between" mb="md">
          <Text size="lg" fw={600}>Progreso Diario</Text>
          <Badge color="violet">{Math.round(progress)}%</Badge>
        </Group>
        <Progress value={progress} color="violet" size="lg" radius="xl" />
        <Text size="sm" c="dimmed" mt="xs">
          {completedToday} de {totalHabits} habitos completados
        </Text>
      </Paper>

      <Paper className="paper-clean" p="md" mt="xl">
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={600}>
            <IconClock size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Horario de hoy ({today})
          </Text>
        </Group>
        {todaySchedule.length > 0 ? (
          <Group gap="xs">
            {todaySchedule.map((block, idx) => (
              <Badge key={idx} color="violet" variant="outline">
                {block.start_time} - {block.end_time}
              </Badge>
            ))}
          </Group>
        ) : (
          <Text size="sm" c="dimmed">No hay bloques definidos para hoy o es dia libre.</Text>
        )}
      </Paper>

      <Paper className="paper-clean" p="xl" mt="xl">
        <DailyChallenges />
      </Paper>

      <Grid mt="xl">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper className="paper-clean" p="xl" h="100%">
            <Text size="lg" fw={600} mb="md">Actividad Reciente</Text>
            {loading ? (
              <Skeleton height={60} radius="md" />
            ) : recentActivity.length > 0 ? (
              <Stack gap="sm">
                {recentActivity.map((item, idx) => (
                  <Card key={idx} className="card-stat" p="sm">
                    <Group>
                      <Box>
                        <Text size="sm" fw={500}>{item.title}</Text>
                        <Text size="xs" c="dimmed">{item.time}</Text>
                      </Box>
                      <Badge color="green" ml="auto" size="sm">Completado</Badge>
                    </Group>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                No has completado habitos hoy. ¡Empieza ahora!
              </Text>
            )}
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper className="paper-clean" p="xl" h="100%">
            <Group justify="space-between" mb="md">
              <Text size="lg" fw={600}>Tus Habitos</Text>
              <Badge color="gray">{totalHabits} totales</Badge>
            </Group>
            {loading ? (
              <Skeleton height={60} radius="md" />
            ) : habits.length > 0 ? (
              <Stack gap="sm">
                {habits.slice(0, 3).map((habit) => (
                  <Card key={habit.id} className="card-stat" p="sm">
                    <Group>
                      <Box>
                        <Text size="sm" fw={500}>{habit.title}</Text>
                        <Text size="xs" c="dimmed">
                          {habit.completed_today ? 'Completado hoy' : 'Pendiente'}
                        </Text>
                      </Box>
                      {habit.completed_today && (
                        <Badge color="green" ml="auto" size="sm">Hecho</Badge>
                      )}
                    </Group>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                No tienes habitos aun. ¡Crea tu primero!
              </Text>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default Dashboard;
