import { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Group,
  Badge,
  Button,
  Stack,
  Box,
  Progress,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTarget, IconCheck } from '@tabler/icons-react';
import { getActiveChallenges, acceptChallenge, completeChallenge } from '../../services/friendChallengesService';
import { useAuth } from '../../hooks/useAuth';

const FriendChallenges = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadChallenges = async () => {
    try {
      const data = await getActiveChallenges();
      setChallenges(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  const handleAccept = async (id) => {
    try {
      await acceptChallenge(id);
      notifications.show({ message: 'Desafio aceptado', color: 'green' });
      loadChallenges();
    } catch (err) {
      notifications.show({ message: err.response?.data?.message || 'Error', color: 'red' });
    }
  };

  const handleComplete = async (id) => {
    try {
      const result = await completeChallenge(id);
      notifications.show({ message: result.message || 'Completado', color: 'violet' });
      loadChallenges();
    } catch (err) {
      notifications.show({ message: err.response?.data?.message || 'Error', color: 'red' });
    }
  };

  if (loading) {
    return <Text c="dimmed" size="sm">Cargando desafios...</Text>;
  }

  if (challenges.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        No tienes desafios activos con amigos
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      {challenges.map((fc) => {
        const isChallenger = fc.challenger_id === user.id;
        const myCompleted = isChallenger ? fc.challenger_completed : fc.challenged_completed;
        const opponentCompleted = isChallenger ? fc.challenged_completed : fc.challenger_completed;
        const opponent = isChallenger
          ? { name: fc.challenged_name, username: fc.challenged_username, tag: fc.challenged_tag }
          : { name: fc.challenger_name, username: fc.challenger_username, tag: fc.challenger_tag };

        const progress = (myCompleted ? 50 : 0) + (opponentCompleted ? 50 : 0);

        return (
          <Card key={fc.id} className="card-stat">
            <Group justify="space-between" mb="sm">
              <Group>
                <IconTarget size={20} color="var(--mantine-color-violet-filled)" />
                <Box>
                  <Text fw={600} size="sm">{fc.title}</Text>
                  <Text size="xs" c="dimmed">
                    vs @{opponent.username}#{opponent.tag} · {fc.points_wagered} pts en juego
                  </Text>
                </Box>
              </Group>
              <Badge
                color={fc.status === 'completed' ? 'green' : fc.status === 'accepted' ? 'blue' : 'yellow'}
                variant="light"
              >
                {fc.status === 'completed' ? 'Completado' : fc.status === 'accepted' ? 'En curso' : 'Pendiente'}
              </Badge>
            </Group>

            <Progress value={progress} color="violet" size="sm" mb="sm" />

            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                {myCompleted ? 'Tu completaste' : 'Tu: pendiente'} · {opponentCompleted ? 'Oponente: completado' : 'Oponente: pendiente'}
              </Text>
              <Group gap="xs">
                {fc.status === 'pending' && !isChallenger && (
                  <Button
                    size="xs"
                    variant="light"
                    color="green"
                    leftSection={<IconCheck size={14} />}
                    onClick={() => handleAccept(fc.id)}
                  >
                    Aceptar
                  </Button>
                )}
                {fc.status === 'accepted' && !myCompleted && (
                  <Button
                    size="xs"
                    variant="light"
                    color="violet"
                    leftSection={<IconCheck size={14} />}
                    onClick={() => handleComplete(fc.id)}
                  >
                    Completar
                  </Button>
                )}
              </Group>
            </Group>
          </Card>
        );
      })}
    </Stack>
  );
};

export default FriendChallenges;
