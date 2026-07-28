import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Box,
  Paper,
  Avatar,
  ThemeIcon,
  SimpleGrid,
} from '@mantine/core';
import { useAuth } from '../hooks/useAuth';
import {
  IconArrowRight,
  IconUsers,
  IconTrophy,
  IconRocket,
  IconBrain,
  IconCrown,
} from '@tabler/icons-react';

const messages = [
  { user: 'Ana', text: '¡LifeScore cambió mi vida!', color: '#7C3AED' },
  { user: 'Carlos', text: 'Llevo 30 días de racha, ¡increíble!', color: '#EC4899' },
  { user: 'María', text: 'El agente IA me organiza las comidas.', color: '#2ECC71' },
  { user: 'Jorge', text: 'Subí al nivel 10 en 2 meses.', color: '#F59E0B' },
];

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const [bubbleIndex, setBubbleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBubbleIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const currentMessage = messages[bubbleIndex];

  return (
    <Box style={{ minHeight: '100vh', background: 'var(--bg-main)', overflow: 'hidden', position: 'relative' }}>
      <Box
        style={{
          position: 'fixed',
          bottom: '10%',
          right: '8%',
          zIndex: 10,
          animation: 'floatBubble 3s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      >
        <Paper
          radius="lg"
          p="md"
          style={{
            background: 'var(--bg-paper)',
            border: `2px solid ${currentMessage.color}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            maxWidth: 280,
          }}
        >
          <Group gap="xs" align="flex-start">
            <Avatar size="sm" color={currentMessage.color} radius="xl">
              {currentMessage.user[0]}
            </Avatar>
            <Box>
              <Text size="xs" fw={600} style={{ color: currentMessage.color }}>
                {currentMessage.user}
              </Text>
              <Text size="sm" c="dimmed">
                {currentMessage.text}
              </Text>
            </Box>
          </Group>
        </Paper>
      </Box>

      <Container size="lg" py="xl" style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        <Stack gap="xl" align="center" justify="center" style={{ minHeight: '100vh' }}>
          <Group>
            <img src="/icon-192x192.png" alt="LifeScore" style={{ height: 48, width: 'auto' }} />
            <Title order={1} style={{ color: '#7C3AED' }}>LifeScore</Title>
          </Group>

          <Stack align="center" gap="xs">
            <Title order={2} ta="center" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
              Convierte tus hábitos en{' '}
              <Text component="span" style={{ color: '#7C3AED' }} inherit>
                puntos
              </Text>
            </Title>
            <Text size="xl" c="dimmed" ta="center" maw={600}>
              Gamifica tu vida diaria, sube de nivel y desbloquea recompensas mientras construyes hábitos duraderos.
            </Text>
          </Stack>

          <Group>
            <Button
              size="xl"
              radius="xl"
              variant="gradient"
              gradient={{ from: '#7C3AED', to: '#EC4899' }}
              leftSection={<IconRocket size={20} />}
              onClick={() => navigate('/register')}
            >
              Comienza Gratis
            </Button>
            <Button
              size="xl"
              radius="xl"
              variant="subtle"
              leftSection={<IconArrowRight size={20} />}
              onClick={() => navigate('/login')}
            >
              Iniciar Sesión
            </Button>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="xl" mt="xl">
            <Stack align="center" gap="xs">
              <ThemeIcon size={48} radius="xl" color="violet" variant="light">
                <IconTrophy size={24} />
              </ThemeIcon>
              <Text fw={600}>Sube de nivel</Text>
              <Text size="sm" c="dimmed" ta="center">Gana XP con cada hábito</Text>
            </Stack>
            <Stack align="center" gap="xs">
              <ThemeIcon size={48} radius="xl" color="pink" variant="light">
                <IconBrain size={24} />
              </ThemeIcon>
              <Text fw={600}>Asistente IA</Text>
              <Text size="sm" c="dimmed" ta="center">Recomendaciones personalizadas</Text>
            </Stack>
            <Stack align="center" gap="xs">
              <ThemeIcon size={48} radius="xl" color="green" variant="light">
                <IconUsers size={24} />
              </ThemeIcon>
              <Text fw={600}>Comunidad</Text>
              <Text size="sm" c="dimmed" ta="center">Compite con otros usuarios</Text>
            </Stack>
            <Stack align="center" gap="xs">
              <ThemeIcon size={48} radius="xl" color="yellow" variant="light">
                <IconCrown size={24} />
              </ThemeIcon>
              <Text fw={600}>Premium</Text>
              <Text size="sm" c="dimmed" ta="center">Beneficios exclusivos</Text>
            </Stack>
          </SimpleGrid>

          <Group justify="center" gap="xl" mt="xl">
            <Stack align="center" gap={0}>
              <Text size="xl" fw={700}>2,847</Text>
              <Text size="sm" c="dimmed">Usuarios activos</Text>
            </Stack>
            <Stack align="center" gap={0}>
              <Text size="xl" fw={700}>12.5K</Text>
              <Text size="sm" c="dimmed">Hábitos completados hoy</Text>
            </Stack>
            <Stack align="center" gap={0}>
              <Text size="xl" fw={700}>4.9★</Text>
              <Text size="sm" c="dimmed">Valoración media</Text>
            </Stack>
          </Group>

          <Text size="xs" c="dimmed" ta="center" mt="xl">
            © {new Date().getFullYear()} LifeScore
          </Text>
        </Stack>
      </Container>

      <style>{`
        @keyframes floatBubble {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
        }
      `}</style>
    </Box>
  );
};

export default Landing;
