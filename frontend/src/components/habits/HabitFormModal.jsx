import { Modal, TextInput, ColorInput, Button, Group, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { HABIT_ICONS, HABIT_COLORS } from '../../utils/constants';

export const HabitFormModal = ({
  opened,
  onClose,
  onSubmit,
  initialValues = { title: '', icon: 'clipboard', color: '#2ECC71' },
  title = 'Nuevo Hábito',
}) => {
  const form = useForm({
    initialValues,
    validate: {
      title: (value) => (value.trim().length > 0 ? null : 'El título es requerido'),
    },
  });

  const handleSubmit = (values) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Modal opened={opened} onClose={onClose} title={title} centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          label="Título"
          placeholder="Ej. Leer 10 páginas"
          required
          {...form.getInputProps('title')}
          mb="md"
        />
        <Select
          label="Icono"
          data={HABIT_ICONS.map((icon) => ({ value: icon, label: icon }))}
          {...form.getInputProps('icon')}
          mb="md"
        />
        <ColorInput
          label="Color"
          format="hex"
          swatches={HABIT_COLORS}
          {...form.getInputProps('color')}
          mb="lg"
        />
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" color="violet">
            Guardar
          </Button>
        </Group>
      </form>
    </Modal>
  );
};