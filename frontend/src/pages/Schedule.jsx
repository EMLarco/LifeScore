import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Button,
  Stack,
  Switch,
  TextInput,
  Box,
  Divider,
  Grid,
  Card,
  ActionIcon,
  Badge,
  ScrollArea,
} from '@mantine/core';
import { useAuth } from '../hooks/useAuth';
import { notifications } from '@mantine/notifications';
import api from '../api/axiosConfig';
import {
  IconClock,
  IconPlus,
  IconTrash,
  IconGripVertical,
} from '@tabler/icons-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miercoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
];

const SortableBlock = ({ block, index, dayIndex, onRemove, onUpdate }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `block-${dayIndex}-${index}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Group gap="xs" style={{ cursor: 'grab' }}>
        <ActionIcon size="xs" variant="subtle" color="gray">
          <IconGripVertical size={14} />
        </ActionIcon>
        <TextInput
          type="time"
          value={block.startTime}
          onChange={(e) => onUpdate(index, 'startTime', e.target.value)}
          size="xs"
          style={{ width: 90 }}
        />
        <Text size="xs" c="dimmed">a</Text>
        <TextInput
          type="time"
          value={block.endTime}
          onChange={(e) => onUpdate(index, 'endTime', e.target.value)}
          size="xs"
          style={{ width: 90 }}
        />
        <ActionIcon size="sm" color="red" onClick={() => onRemove(index)}>
          <IconTrash size={14} />
        </ActionIcon>
      </Group>
    </Box>
  );
};

const Schedule = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState(
    DAYS.map((day) => ({
      dayOfWeek: day.value,
      isDayOff: false,
      blocks: [{ startTime: '09:00', endTime: '17:00' }],
    }))
  );
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await api.get('/schedule');
        if (res.data.data.length > 0) {
          const existing = res.data.data;
          const merged = DAYS.map((day) => {
            const dayBlocks = existing.filter((e) => e.day_of_week === day.value);
            if (dayBlocks.length > 0) {
              const isDayOff = dayBlocks.some((e) => e.is_day_off === true);
              const blocks = isDayOff
                ? []
                : dayBlocks.map((b) => ({
                    startTime: b.start_time || '09:00',
                    endTime: b.end_time || '17:00',
                  }));
              return {
                dayOfWeek: day.value,
                isDayOff,
                blocks: blocks.length > 0 ? blocks : [{ startTime: '09:00', endTime: '17:00' }],
              };
            }
            return {
              dayOfWeek: day.value,
              isDayOff: false,
              blocks: [{ startTime: '09:00', endTime: '17:00' }],
            };
          });
          setSchedule(merged);
        }
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: error.response?.data?.message || 'No se pudo cargar el horario',
          color: 'red',
        });
      }
    };
    fetchSchedule();
  }, []);

  const updateBlock = (dayIndex, blockIndex, field, value) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].blocks[blockIndex][field] = value;
    setSchedule(newSchedule);
  };

  const addBlock = (dayIndex) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].blocks.push({ startTime: '09:00', endTime: '17:00' });
    setSchedule(newSchedule);
  };

  const removeBlock = (dayIndex, blockIndex) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].blocks.splice(blockIndex, 1);
    if (newSchedule[dayIndex].blocks.length === 0) {
      newSchedule[dayIndex].blocks.push({ startTime: '09:00', endTime: '17:00' });
    }
    setSchedule(newSchedule);
  };

  const handleDragEnd = (event, dayIndex) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = parseInt(active.id.split('-')[2]);
      const newIndex = parseInt(over.id.split('-')[2]);
      const newSchedule = [...schedule];
      newSchedule[dayIndex].blocks = arrayMove(
        newSchedule[dayIndex].blocks,
        oldIndex,
        newIndex
      );
      setSchedule(newSchedule);
    }
  };

  const toggleDayOff = (dayIndex) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].isDayOff = !newSchedule[dayIndex].isDayOff;
    if (newSchedule[dayIndex].isDayOff) {
      newSchedule[dayIndex].blocks = [];
    } else {
      newSchedule[dayIndex].blocks = [{ startTime: '09:00', endTime: '17:00' }];
    }
    setSchedule(newSchedule);
  };

  const validateSchedule = () => {
    for (const day of schedule) {
      if (day.isDayOff) continue;
      for (let i = 0; i < day.blocks.length; i++) {
        for (let j = i + 1; j < day.blocks.length; j++) {
          const a = day.blocks[i];
          const b = day.blocks[j];
          if (a.startTime < b.endTime && b.startTime < a.endTime) {
            notifications.show({
              title: 'Error de solapamiento',
              message: `${DAYS[day.dayOfWeek - 1].label}: los bloques se solapan.`,
              color: 'red',
            });
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateSchedule()) return;
    setLoading(true);
    try {
      const payload = [];
      for (const day of schedule) {
        if (day.isDayOff) {
          payload.push({
            dayOfWeek: day.dayOfWeek,
            isDayOff: true,
            startTime: null,
            endTime: null,
          });
        } else {
          for (const block of day.blocks) {
            payload.push({
              dayOfWeek: day.dayOfWeek,
              isDayOff: false,
              startTime: block.startTime,
              endTime: block.endTime,
            });
          }
        }
      }
      await api.put('/schedule', { schedule: payload });
      notifications.show({
        title: 'Horario guardado',
        message: 'Tu horario semanal se ha actualizado correctamente',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'No se pudo guardar el horario',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="lg" py="xl">
      <Paper className="paper-clean" p="xl">
        <Title order={1} mb="lg">Mi Horario Semanal</Title>
        <Text size="sm" c="dimmed" mb="lg">
          Define tus horas de trabajo o clases de lunes a viernes. Puedes agregar multiples bloques por dia.
          {user?.is_premium && ' Premium: Organiza tu dia con precision.'}
        </Text>

        <ScrollArea type="auto">
          <Grid>
            {schedule.map((day, dayIndex) => (
              <Grid.Col key={day.dayOfWeek} span={{ base: 12, sm: 6, md: 4, lg: 2.4 }}>
                <Card className="card-stat" p="md" style={{ minHeight: 200 }}>
                  <Group justify="space-between" mb="xs">
                    <Text fw={600}>{DAYS[dayIndex].label}</Text>
                    <Switch
                      label="Dia libre"
                      checked={day.isDayOff}
                      onChange={() => toggleDayOff(dayIndex)}
                      size="xs"
                    />
                  </Group>

                  {!day.isDayOff && (
                    <Box>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => handleDragEnd(event, dayIndex)}
                      >
                        <SortableContext
                          items={day.blocks.map((_, idx) => `block-${dayIndex}-${idx}`)}
                          strategy={verticalListSortingStrategy}
                        >
                          <Stack gap="xs">
                            {day.blocks.map((block, blockIndex) => (
                              <SortableBlock
                                key={`block-${dayIndex}-${blockIndex}`}
                                block={block}
                                index={blockIndex}
                                dayIndex={dayIndex}
                                onRemove={() => removeBlock(dayIndex, blockIndex)}
                                onUpdate={(idx, field, val) =>
                                  updateBlock(dayIndex, idx, field, val)
                                }
                              />
                            ))}
                          </Stack>
                        </SortableContext>
                      </DndContext>

                      <Button
                        variant="subtle"
                        leftSection={<IconPlus size={14} />}
                        onClick={() => addBlock(dayIndex)}
                        size="xs"
                        mt="xs"
                      >
                        Agregar bloque
                      </Button>
                    </Box>
                  )}
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </ScrollArea>

        <Divider my="xl" />

        <Group justify="space-between">
          <Badge color="violet" size="lg" leftSection={<IconClock size={14} />}>
            Arrastra los bloques para reordenarlos
          </Badge>
          <Button
            onClick={handleSave}
            loading={loading}
            variant="gradient"
            gradient={{ from: '#7C3AED', to: '#EC4899' }}
          >
            Guardar Horario
          </Button>
        </Group>
      </Paper>
    </Container>
  );
};

export default Schedule;
