import { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Card,
  Badge,
  Loader,
  Alert,
  Box,
  TextInput,
  Button,
  ScrollArea,
  Avatar,
  Divider,
} from '@mantine/core';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axiosConfig';
import { IconBrain, IconSend, IconRobot, IconUser } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

const Agent = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(
    user?.is_premium
      ? [{
          role: 'model',
          content: `Hola ${user?.name}! Soy tu asistente personal LifeScore. Puedo ayudarte con recomendaciones de habitos, ejercicios, alimentacion y mas. Que te gustaria hacer hoy?`,
        }]
      : []
  );
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    const updatedMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(updatedMessages);

    try {
      const history = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await api.post('/agent/chat', {
        message: userMessage,
        history,
      });

      if (res.data.success) {
        setMessages([...updatedMessages, { role: 'model', content: res.data.data.reply }]);
      } else {
        notifications.show({
          title: 'Error',
          message: res.data.message || 'No se pudo obtener respuesta',
          color: 'red',
        });
      }
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.response?.data?.message || 'Error al conectar con el asistente',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user?.is_premium) {
    return (
      <Container size="lg" py="xl">
        <Paper shadow="md" radius="lg" p="xl">
          <Alert color="yellow" title="Acceso restringido">
            Esta funcion es exclusiva para usuarios premium.
          </Alert>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl" style={{ height: 'calc(100vh - 120px)', minHeight: 600 }}>
      <Paper shadow="md" radius="lg" p="xl" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Group justify="space-between" mb="md">
          <Group>
            <IconBrain size={28} color="#7C3AED" />
            <Title order={2}>Asistente IA</Title>
          </Group>
          <Badge color="gold" size="lg">Premium</Badge>
        </Group>

        <ScrollArea style={{ flex: 1, marginBottom: 16, paddingRight: 8 }} viewportRef={scrollRef}>
          <Stack gap="md">
            {messages.map((msg, index) => (
              <Box
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <Card
                  withBorder
                  radius="lg"
                  p="sm"
                  style={{
                    maxWidth: '80%',
                    backgroundColor: msg.role === 'user' ? '#7C3AED' : 'var(--bg-card)',
                    border: msg.role === 'user' ? 'none' : '1px solid var(--border-color)',
                  }}
                >
                  <Group gap="xs" mb="xs">
                    {msg.role === 'user' ? (
                      <Avatar size="sm" color="violet" radius="xl">
                        <IconUser size={16} />
                      </Avatar>
                    ) : (
                      <Avatar size="sm" color="gold" radius="xl">
                        <IconRobot size={16} />
                      </Avatar>
                    )}
                    <Text size="xs" c="dimmed" fw={600}>
                      {msg.role === 'user' ? user?.name : 'LifeScore Agent'}
                    </Text>
                  </Group>
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </Text>
                </Card>
              </Box>
            ))}
            {loading && (
              <Box style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <Card withBorder radius="lg" p="sm" style={{ maxWidth: '80%', background: 'var(--bg-card)' }}>
                  <Loader size="sm" color="violet" />
                </Card>
              </Box>
            )}
          </Stack>
        </ScrollArea>

        <Divider />

        <Group style={{ marginTop: 12 }} gap="sm">
          <TextInput
            placeholder="Escribe tu mensaje..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ flex: 1 }}
            disabled={loading}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            variant="gradient"
            gradient={{ from: '#7C3AED', to: '#EC4899' }}
            leftSection={<IconSend size={18} />}
          >
            Enviar
          </Button>
        </Group>

        <Text size="xs" c="dimmed" mt="xs">
          El asistente utiliza IA de OpenRouter. Las respuestas pueden contener errores.
        </Text>
      </Paper>
    </Container>
  );
};

export default Agent;
