import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  Stack,
  Button,
  Group,
  Badge,
  Card,
  SimpleGrid,
  Progress,
  Loader,
} from '@mantine/core';
import { useAuth } from '../hooks/useAuth';
import { notifications } from '@mantine/notifications';
import {
  IconTrophy,
  IconBrain,
  IconRun,
  IconFlame,
  IconCompass,
  IconScale,
  IconCrown,
  IconCheck,
  IconLock,
  IconTarget,
} from '@tabler/icons-react';
import { getPremiumChallenges, completePremiumChallenge } from '../services/paymentService';

const ICON_MAP = {
  IconBrain,
  IconRun,
  IconFlame,
  IconCompass,
  IconScale,
  IconCrown,
  IconTrophy,
};

const TYPE_LABELS = {
  daily: { label: 'Diario', color: 'blue' },
  weekly: { label: 'Semanal', color: 'orange' },
  monthly: { label: 'Mensual', color: 'violet' },
};

const PremiumChallenges = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const data = await getPremiumChallenges();
      setChallenges(data || []);
    } catch {
      notifications.show({
        title: 'Error',
        message: 'No se pudieron cargar los retos premium',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (challengeId) => {
    setCompletingId(challengeId);
    try {
      const result = await completePremiumChallenge(challengeId);
      notifications.show({
        title: 'Reto completado!',
        message: `+${result.data.xp} XP${result.data.badge ? ` | Badge: ${result.data.badge}` : ''}`,
        color: 'green',
      });
      loadChallenges();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'No se pudo completar el reto',
        color: 'red',
      });
    } finally {
      setCompletingId(null);
    }
  };

  if (loading) {
    return (
      <Container size="lg" py="xl" style={{ textAlign: 'center', paddingTop: 100 }}>
        <Loader size="lg" color="violet" />
      </Container>
    );
  }

  if (!user?.is_premium) {
    return (
      <Container size="lg" py="xl">
        <Paper shadow="md" radius="lg" p="xl" style={{ textAlign: 'center' }}>
          <IconLock size={60} color="#7C3AED" style={{ marginBottom: 16 }} />
          <Title order={2} mb="md">Retos Premium</Title>
          <Text c="dimmed" mb="lg">Necesitas una membresia Premium para acceder a los retos exclusivos.</Text>
          <Button
            variant="gradient"
            gradient={{ from: '#7C3AED', to: '#EC4899' }}
            leftSection={<IconCrown size={18} />}
            onClick={() => window.location.href = '/premium'}
          >
            Obtener Premium
          </Button>
        </Paper>
      </Container>
    );
  }

  const completedCount = challenges.filter((c) => c.is_completed).length;

  return (
    <Container size="lg" py="xl">
      <Paper shadow="md" radius="lg" p="xl">
        <Group justify="space-between" mb="lg">
          <div>
            <Title order={1}>
              <IconTarget size={28} color="#7C3AED" style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Retos Premium
            </Title>
            <Text c="dimmed" size="sm" mt="xs">Completa retos exclusivos para ganar XP y badges</Text>
          </div>
          <Badge color="violet" variant="light" size="lg">
            {completedCount}/{challenges.length} completados
          </Badge>
        </Group>

        <Progress
          value={(completedCount / Math.max(challenges.length, 1)) * 100}
          color="violet"
          size="lg"
          radius="md"
          mb="xl"
        />

        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
          {challenges.map((challenge) => {
            const IconComponent = ICON_MAP[challenge.icon] || IconTrophy;
            const typeInfo = TYPE_LABELS[challenge.challenge_type] || TYPE_LABELS.daily;
            const locked = (user.level || 1) < challenge.required_level;

            return (
              <Card
                key={challenge.id}
                withBorder
                p="lg"
                style={{
                  background: 'var(--bg-card)',
                  opacity: locked ? 0.6 : 1,
                  border: challenge.is_completed ? '2px solid #2ECC71' : undefined,
                }}
              >
                <Stack gap="sm">
                  <Group justify="space-between">
                    <IconComponent size={32} color={challenge.is_completed ? '#2ECC71' : '#7C3AED'} />
                    <Badge color={typeInfo.color} variant="light" size="sm">
                      {typeInfo.label}
                    </Badge>
                  </Group>

                  <div>
                    <Text fw={600} size="lg">{challenge.title}</Text>
                    <Text c="dimmed" size="sm" mt={4}>{challenge.description}</Text>
                  </div>

                  <Group gap="xs">
                    <Badge color="yellow" variant="light" size="sm">+{challenge.xp_reward} XP</Badge>
                    {challenge.badge_key && (
                      <Badge color="violet" variant="light" size="sm">Badge</Badge>
                    )}
                    <Badge color="gray" variant="light" size="sm">Nvl {challenge.required_level}+</Badge>
                  </Group>

                  {challenge.is_completed ? (
                    <Button
                      color="green"
                      variant="light"
                      leftSection={<IconCheck size={16} />}
                      fullWidth
                      disabled
                    >
                      Completado
                    </Button>
                  ) : locked ? (
                    <Button
                      color="gray"
                      variant="light"
                      leftSection={<IconLock size={16} />}
                      fullWidth
                      disabled
                    >
                      Nivel {challenge.required_level} requerido
                    </Button>
                  ) : (
                    <Button
                      variant="gradient"
                      gradient={{ from: '#7C3AED', to: '#EC4899' }}
                      leftSection={<IconTarget size={16} />}
                      fullWidth
                      onClick={() => handleComplete(challenge.id)}
                      loading={completingId === challenge.id}
                    >
                      Completar reto
                    </Button>
                  )}
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      </Paper>
    </Container>
  );
};

export default PremiumChallenges;
