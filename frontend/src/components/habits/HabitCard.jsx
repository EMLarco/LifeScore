import { Card, Group, Text, Badge, ActionIcon, Menu, Box } from '@mantine/core';
import { IconDots, IconEdit, IconTrash, IconCheck, IconX, IconList } from '@tabler/icons-react';
import { formatTimeAgo } from '../../utils/formatters';

export const HabitCard = ({
  habit,
  onComplete,
  onEdit,
  onDelete,
  loading = false,
}) => {
  const { id, title, icon, color, completed_today, created_at } = habit;

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      style={{
        border: completed_today ? '2px solid #2ECC71' : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      <Group justify="space-between">
        <Group>
          <Text size="xl">{icon || <IconList size={24} />}</Text>
          <Box>
            <Text fw={700}>{title}</Text>
            <Badge
              color={completed_today ? 'green' : 'gray'}
              size="sm"
              leftSection={completed_today ? <IconCheck size={12} /> : <IconX size={12} />}
            >
              {completed_today ? 'Completado hoy' : 'Pendiente'}
            </Badge>
          </Box>
        </Group>
        <Menu shadow="md" position="bottom-end" disabled={loading}>
          <Menu.Target>
            <ActionIcon variant="subtle">
              <IconDots size={18} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconCheck size={16} />}
              onClick={() => onComplete(id)}
              disabled={completed_today}
            >
              Completar hoy
            </Menu.Item>
            <Menu.Item
              leftSection={<IconEdit size={16} />}
              onClick={() => onEdit(habit)}
            >
              Editar
            </Menu.Item>
            <Menu.Item
              leftSection={<IconTrash size={16} />}
              color="red"
              onClick={() => onDelete(id)}
            >
              Eliminar
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <Text size="xs" c="dimmed" mt="sm">
        Creado: {formatTimeAgo(created_at)}
      </Text>

      {/* Indicador visual del color */}
      <Box
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: color || '#2ECC71',
          marginTop: 8,
        }}
      />
    </Card>
  );
};