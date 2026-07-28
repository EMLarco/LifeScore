import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Title,
  Grid,
  Card,
  Text,
  Badge,
  Group,
  Box,
  ThemeIcon,
  Progress,
  Stack,
  SimpleGrid,
  Center,
  Pagination,
  Loader,
} from '@mantine/core';
import {
  IconTrophy,
  IconCheck,
  IconLock,
  IconFlame,
  IconCalendar,
  IconStar,
  IconCrown,
  IconTarget,
  IconRocket,
  IconBook,
  IconRun,
} from '@tabler/icons-react';
import { getAchievements } from '../services/achievementsService';

const iconMap = {
  IconTrophy, IconFlame, IconCalendar, IconStar, IconCrown,
  IconTarget, IconRocket, IconBook, IconRun, IconCheck,
  IconTriangle: IconTarget, IconCalendarWeek: IconCalendar,
  IconCalendarMonth: IconCalendar, IconMoodSmile: IconStar,
  IconSparkles: IconStar, IconHeart: IconStar, IconUser: IconStar,
  IconCoin: IconStar, IconClock: IconCalendar, IconCalendarStar: IconStar,
  IconSun: IconStar,
};

const Achievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 365 });
  const [stats, setStats] = useState({ unlocked_count: 0, current_streak: 0 });
  const [activePage, setActivePage] = useState(1);

  const fetchAchievements = async (page) => {
    setLoading(true);
    try {
      const result = await getAchievements(page, 36);
      setAchievements(result.achievements);
      setPagination(result.pagination);
      setStats({ unlocked_count: result.unlocked_count, current_streak: result.current_streak });
    } catch (err) {
      console.error('Error cargando logros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements(activePage);
  }, [activePage]);

  if (loading && achievements.length === 0) {
    return (
      <Container size="lg" py="xl">
        <Paper className="paper-clean" p="xl">
          <Center py="xl"><Loader size="xl" color="violet" /></Center>
        </Paper>
      </Container>
    );
  }

  const progressPercent = pagination.total > 0 ? (stats.unlocked_count / pagination.total) * 100 : 0;

  return (
    <Container size="lg" py="xl">
      <Paper className="paper-clean" p="xl">
        <Group justify="space-between" mb="lg">
          <Title order={1}>
            <IconTrophy size={28} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Logros del Ano
          </Title>
          <Badge size="lg" color="violet">
            {stats.unlocked_count} / {pagination.total} desbloqueados
          </Badge>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
          <Card className="card-stat" p="md">
            <Group>
              <ThemeIcon color="violet" size="xl" variant="light">
                <IconFlame size={24} />
              </ThemeIcon>
              <Box>
                <Text size="xs" c="dimmed">Racha actual</Text>
                <Text fw={700} size="xl">{stats.current_streak}</Text>
              </Box>
            </Group>
          </Card>
          <Card className="card-stat" p="md">
            <Group>
              <ThemeIcon color="green" size="xl" variant="light">
                <IconTrophy size={24} />
              </ThemeIcon>
              <Box>
                <Text size="xs" c="dimmed">Desbloqueados</Text>
                <Text fw={700} size="xl">{stats.unlocked_count}</Text>
              </Box>
            </Group>
          </Card>
          <Card className="card-stat" p="md">
            <Box>
              <Text size="xs" c="dimmed" mb="xs">Progreso del ano</Text>
              <Progress value={progressPercent} color="violet" size="lg" radius="md" />
              <Text size="xs" c="dimmed" mt="xs">{Math.round(progressPercent)}% completado</Text>
            </Box>
          </Card>
        </SimpleGrid>

        <Title order={3} mb="md">Calendario de Logros</Title>

        {loading ? (
          <Center py="md"><Loader size="md" color="violet" /></Center>
        ) : (
          <Grid>
            {achievements.map((achievement) => {
              const IconComp = iconMap[achievement.icon] || IconTrophy;
              return (
                <Grid.Col key={achievement.day_of_year} span={{ base: 6, sm: 4, md: 3, lg: 2 }}>
                  <Card
                    className="card-stat"
                    p="sm"
                    style={{
                      opacity: achievement.unlocked ? 1 : 0.5,
                      borderColor: achievement.unlocked ? achievement.color || '#7C3AED' : 'var(--border-color)',
                    }}
                  >
                    <Stack gap="xs" align="center">
                      <ThemeIcon
                        color={achievement.unlocked ? (achievement.color || 'violet') : 'gray'}
                        radius="xl"
                        size="lg"
                        variant={achievement.unlocked ? 'filled' : 'outline'}
                      >
                        {achievement.unlocked ? <IconComp size={20} /> : <IconLock size={16} />}
                      </ThemeIcon>
                      <Text size="xs" fw={600} ta="center" lineClamp={2}>
                        {achievement.name}
                      </Text>
                      <Text size="xs" c="dimmed" ta="center" lineClamp={2}>
                        {achievement.description}
                      </Text>
                      <Badge size="xs" variant="light" color={achievement.unlocked ? 'green' : 'gray'}>
                        Dia {achievement.day_of_year}
                      </Badge>
                    </Stack>
                  </Card>
                </Grid.Col>
              );
            })}
          </Grid>
        )}

        <Center mt="xl">
          <Pagination
            total={pagination.totalPages}
            value={activePage}
            onChange={setActivePage}
            color="violet"
            siblings={2}
            boundaries={1}
          />
        </Center>
      </Paper>
    </Container>
  );
};

export default Achievements;
