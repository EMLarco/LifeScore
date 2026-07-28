import { Grid, Loader, Text, Paper } from '@mantine/core';
import { HabitCard } from './HabitCard';

export const HabitList = ({
  habits,
  onComplete,
  onEdit,
  onDelete,
  loading = false,
}) => {
  if (loading) {
    return (
      <Paper p="xl" ta="center">
        <Loader size="md" />
        <Text c="dimmed" mt="md">
          Cargando habitos...
        </Text>
      </Paper>
    );
  }

  if (habits.length === 0) {
    return (
      <Paper p="xl" ta="center">
        <Text size="lg" c="dimmed">
          No tienes habitos aun. Crea tu primero!
        </Text>
      </Paper>
    );
  }

  return (
    <Grid>
      {habits.map((habit) => (
        <Grid.Col key={habit.id} span={{ base: 12, sm: 6, md: 4 }}>
          <HabitCard
            habit={habit}
            onComplete={onComplete}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </Grid.Col>
      ))}
    </Grid>
  );
};