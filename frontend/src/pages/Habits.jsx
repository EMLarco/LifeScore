import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Group,
  Loader,
  Grid,
  Card,
  ActionIcon,
  Badge,
  Menu,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconDots, IconEdit, IconTrash, IconCheck, IconX, IconList } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  completeHabit,
} from '../services/habitService';
import { HabitFormModal } from '../components/habits/HabitFormModal';
import { formatTimeAgo } from '../utils/formatters';

const Habits = () => {
  const { updateUser } = useAuth();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);

  const loadHabits = async () => {
    try {
      const data = await getHabits();
      setHabits(data);
    } catch {
      notifications.show({
        title: 'Error',
        message: 'No se pudieron cargar los habitos',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
  }, []);

  const handleCreate = async (values) => {
    try {
      const newHabit = await createHabit(values);
      setHabits((prev) => [...prev, newHabit]);
      notifications.show({
        title: 'Éxito',
        message: 'Hábito creado correctamente',
        color: 'green',
      });
      setModalOpen(false);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Error al crear hábito',
        color: 'red',
      });
    }
  };

  const handleUpdate = async (id, values) => {
    try {
      const updated = await updateHabit(id, values);
      setHabits((prev) => prev.map((h) => (h.id === id ? updated : h)));
      notifications.show({
        title: 'Éxito',
        message: 'Hábito actualizado',
        color: 'green',
      });
      setEditingHabit(null);
      setModalOpen(false);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Error al actualizar',
        color: 'red',
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteHabit(id);
      setHabits((prev) => prev.filter((h) => h.id !== id));
      notifications.show({
        title: 'Eliminado',
        message: 'Hábito eliminado correctamente',
        color: 'green',
      });
    } catch {
      notifications.show({
        title: 'Error',
        message: 'No se pudo eliminar el habito',
        color: 'red',
      });
    }
  };

  const handleComplete = async (id) => {
    try {
      const result = await completeHabit(id);
      // Actualizar la lista de hábitos (marcar como completado hoy)
      setHabits((prev) =>
        prev.map((h) =>
          h.id === id ? { ...h, completed_today: true } : h
        )
      );
      // Actualizar el usuario con nuevo XP y nivel
      if (result.new_total_xp !== undefined) {
        updateUser({
          total_xp: result.new_total_xp,
          level: result.new_level,
        });
      }
      notifications.show({
        title: '¡Completado!',
        message: `+${result.xp_gained || 0} XP`,
        color: 'green',
      });
      if (result.leveled_up) {
        notifications.show({
          title: 'Subiste de nivel!',
          message: `Ahora eres nivel ${result.new_level}`,
          color: 'violet',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'No se pudo completar',
        color: 'red',
      });
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
      <Group justify="space-between" mb="lg">
        <Title order={1}>
          <IconList size={28} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          Mis Habitos
        </Title>
        <Button leftSection={<IconPlus size={18} />} onClick={() => setModalOpen(true)}>
          Nuevo Hábito
        </Button>
      </Group>

      {habits.length === 0 ? (
        <Paper p="xl" ta="center">
          <Text size="lg" c="dimmed">
            No tienes hábitos aún. ¡Crea tu primero!
          </Text>
          <Button mt="md" onClick={() => setModalOpen(true)}>
            Crear Hábito
          </Button>
        </Paper>
      ) : (
        <Grid>
          {habits.map((habit) => (
            <Grid.Col key={habit.id} span={{ base: 12, sm: 6, md: 4 }}>
              <Card
                shadow="sm"
                padding="lg"
                radius="md"
                style={{
                  border: habit.completed_today ? '2px solid #2ECC71' : 'none',
                }}
              >
                <Group justify="space-between">
                  <Group>
                    <Text size="xl">{habit.icon || <IconList size={24} />}</Text>
                    <div>
                      <Text fw={700}>{habit.title}</Text>
                      <Badge color="gray" size="sm">
                        {habit.completed_today ? (
                          <Group gap={4}><IconCheck size={12} /> Completado hoy</Group>
                        ) : (
                          <Group gap={4}><IconX size={12} /> Pendiente</Group>
                        )}
                      </Badge>
                    </div>
                  </Group>
                  <Menu shadow="md" position="bottom-end">
                    <Menu.Target>
                      <ActionIcon variant="subtle">
                        <IconDots size={18} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconCheck size={16} />}
                        onClick={() => handleComplete(habit.id)}
                        disabled={habit.completed_today}
                      >
                        Completar hoy
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconEdit size={16} />}
                        onClick={() => {
                          setEditingHabit(habit);
                          setModalOpen(true);
                        }}
                      >
                        Editar
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconTrash size={16} />}
                        color="red"
                        onClick={() => handleDelete(habit.id)}
                      >
                        Eliminar
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
                <Text size="xs" c="dimmed" mt="sm">
                  Creado: {formatTimeAgo(habit.created_at)}
                </Text>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      )}

      <HabitFormModal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingHabit(null);
        }}
        onSubmit={editingHabit ? (values) => handleUpdate(editingHabit.id, values) : handleCreate}
        initialValues={editingHabit || { title: '', icon: 'clipboard', color: '#2ECC71' }}
        title={editingHabit ? 'Editar Hábito' : 'Crear Hábito'}
      />
    </Container>
  );
};

export default Habits;