import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Text,
  Box,
  Center,
  Select,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../hooks/useAuth';
import { register } from '../services/authService';
import { IconRocket } from '@tabler/icons-react';

const Register = () => {
  const navigate = useNavigate();
  const { login: setAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    gender: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Dentro de handleSubmit
const data = await register(form.name, form.email, form.password, form.gender);
      if (data.success) {
        setAuth(data.user, data.token);
        notifications.show({
          title: '¡Registro exitoso!',
          message: `Bienvenido a LifeScore, ${data.user.name}`,
          color: 'green',
        });
        navigate('/dashboard');
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Error al registrar usuario',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center style={{ height: '100vh' }}>
      <Container size="xs">
        <Paper shadow="xl" radius="md" p="xl">
          <Title order={2} ta="center" mb="lg">
            <IconRocket size={28} color="#7C3AED" style={{ marginRight: 8, verticalAlign: 'middle' }} />
            LifeScore
          </Title>
          <Title order={4} ta="center" c="dimmed" mb="xl">
            Crea tu cuenta
          </Title>

          <form onSubmit={handleSubmit}>
            <TextInput
              label="Nombre completo"
              placeholder="Tu nombre"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              mb="md"
            />
            <TextInput
              label="Email"
              placeholder="tu@email.com"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              mb="md"
            />
            <PasswordInput
              label="Contraseña"
              placeholder="Mínimo 6 caracteres"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              mb="md"
            />
            <Select
              label="Género (opcional)"
              placeholder="Selecciona tu género"
              data={[
                { value: 'male', label: 'Masculino' },
                { value: 'female', label: 'Femenino' },
                { value: 'other', label: 'Otro' },
              ]}
              value={form.gender}
              onChange={(value) => setForm({ ...form, gender: value })}
              mb="xl"
            />
            <Button fullWidth size="md" type="submit" loading={loading}>
              Registrarse
            </Button>
          </form>

          <Box ta="center" mt="md">
            <Text size="sm" c="dimmed">
              ¿Ya tienes cuenta?{' '}
              <Text component={Link} to="/login" c="violet" style={{ textDecoration: 'none' }}>
                Inicia sesión aquí
              </Text>
            </Text>
          </Box>
        </Paper>
      </Container>
    </Center>
  );
};

export default Register;