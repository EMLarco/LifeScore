import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Button,
  Modal,
  TextInput,
  Textarea,
  Select,
  Stack,
  Box,
  Badge,
} from '@mantine/core';
import { Calendar } from '@mantine/dates';
import { useAuth } from '../hooks/useAuth';
import { notifications } from '@mantine/notifications';
import api from '../api/axiosConfig';
import {
  IconClock,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import '@mantine/dates/styles.css';

const EVENT_TYPES = [
  { value: 'work', label: 'Trabajo' },
  { value: 'class', label: 'Clase/Estudio' },
  { value: 'exercise', label: 'Ejercicio' },
  { value: 'personal', label: 'Personal' },
  { value: 'other', label: 'Otro' },
];

const EVENT_COLORS = {
  work: 'violet',
  class: 'blue',
  exercise: 'green',
  personal: 'yellow',
  other: 'gray',
};

const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CalendarPage = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [modalOpened, setModalOpened] = useState(false);
  const [loading, setLoading] = useState(false);

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    type: 'work',
    startTime: '09:00',
    endTime: '17:00',
  });

  const selectedDateStr = formatDate(selectedDate);

  useEffect(() => {
    let cancelled = false;
    const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    const startStr = formatDate(start);
    const endStr = formatDate(end);
    api.get(`/calendar?start=${startStr}&end=${endStr}`)
      .then((res) => {
        if (!cancelled) setEvents(res.data.data || []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [selectedDate]);

  const handleCreateEvent = async () => {
    if (!eventForm.title.trim()) {
      notifications.show({
        title: 'Error',
        message: 'El titulo es obligatorio',
        color: 'red',
      });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...eventForm,
        date: formatDate(selectedDate),
      };
      const res = await api.post('/calendar', payload);
      setEvents([...events, res.data.data]);
      notifications.show({
        title: 'Evento creado',
        message: 'El evento se ha agregado correctamente',
        color: 'green',
      });
      setModalOpened(false);
      setEventForm({
        title: '',
        description: '',
        type: 'work',
        startTime: '09:00',
        endTime: '17:00',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'No se pudo crear el evento',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await api.delete(`/calendar/${eventId}`);
      setEvents(events.filter((e) => e.id !== eventId));
      notifications.show({
        title: 'Evento eliminado',
        message: 'El evento se ha eliminado correctamente',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'No se pudo eliminar el evento',
        color: 'red',
      });
    }
  };

  const dayEvents = events.filter((e) => e.date === selectedDateStr);

  const getDayProps = (date) => {
    const dateStr = formatDate(date);
    const hasEvent = events.some((e) => e.date === dateStr);
    return {
      style: hasEvent
        ? { border: '2px solid var(--mantine-color-violet-5)', borderRadius: '50%' }
        : {},
    };
  };

  return (
    <Container size="lg" py="xl">
      <Paper shadow="md" radius="lg" p="xl">
        <Group justify="space-between" mb="lg">
          <Title order={1}>Calendario</Title>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setModalOpened(true)}
          >
            Agregar Evento
          </Button>
        </Group>

        <Text size="sm" c="dimmed" mb="lg">
          Organiza tus horarios de trabajo, clases y actividades.
          {user?.is_premium && ' Premium: obtiene sugerencias inteligentes de habitos.'}
        </Text>

        <Calendar
          value={selectedDate}
          onChange={setSelectedDate}
          getDayProps={getDayProps}
          size="xl"
        />

        <Box mt="xl">
          <Title order={3} mb="md">
            Eventos del {selectedDateStr}
          </Title>
          {dayEvents.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              No hay eventos para este dia. Agrega uno!
            </Text>
          ) : (
            dayEvents.map((event) => (
              <Paper key={event.id} withBorder p="md" mb="sm" style={{ background: 'var(--bg-card)' }}>
                <Group justify="space-between">
                  <Box>
                    <Group>
                      <Badge color={EVENT_COLORS[event.type] || 'gray'}>
                        {EVENT_TYPES.find((t) => t.value === event.type)?.label || event.type}
                      </Badge>
                      <Text fw={600}>{event.title}</Text>
                    </Group>
                    {event.description && (
                      <Text size="sm" c="dimmed" mt="xs">{event.description}</Text>
                    )}
                    <Group mt="xs" gap="xs">
                      <Badge size="sm" variant="outline" leftSection={<IconClock size={12} />}>
                        {event.start_time} - {event.end_time}
                      </Badge>
                    </Group>
                  </Box>
                  <Button
                    size="xs"
                    color="red"
                    variant="subtle"
                    leftSection={<IconTrash size={14} />}
                    onClick={() => handleDeleteEvent(event.id)}
                  >
                    Eliminar
                  </Button>
                </Group>
              </Paper>
            ))
          )}
        </Box>

        <Modal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          title="Nuevo Evento"
          centered
        >
          <Stack>
            <TextInput
              label="Titulo"
              placeholder="Ej. Clase de matematicas"
              value={eventForm.title}
              onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              required
            />
            <Textarea
              label="Descripcion"
              placeholder="Detalles del evento"
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              autosize
              minRows={2}
            />
            <Select
              label="Tipo"
              data={EVENT_TYPES}
              value={eventForm.type}
              onChange={(value) => setEventForm({ ...eventForm, type: value })}
            />
            <Group grow>
              <TextInput
                label="Hora inicio"
                type="time"
                value={eventForm.startTime}
                onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
              />
              <TextInput
                label="Hora fin"
                type="time"
                value={eventForm.endTime}
                onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
              />
            </Group>
            <Button
              onClick={handleCreateEvent}
              loading={loading}
              variant="gradient"
              gradient={{ from: '#7C3AED', to: '#EC4899' }}
            >
              Guardar Evento
            </Button>
          </Stack>
        </Modal>
      </Paper>
    </Container>
  );
};

export default CalendarPage;
