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
  Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../hooks/useAuth';
import { login } from '../services/authService';
import { IconFlame, IconBrandGoogle } from '@tabler/icons-react';

const GOOGLE_CLIENT_ID = '217833759497-t1e9ttduvu6drvm926j3bne3kq1q5hj2.apps.googleusercontent.com';
const GOOGLE_REDIRECT_URI = 'http://localhost:5173/google-callback';

const Login = () => {
  const navigate = useNavigate();
  const { login: setAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      if (data.requires_2fa) {
        sessionStorage.setItem('temp_2fa_token', data.temp_token);
        sessionStorage.setItem('temp_2fa_email', form.email);
        navigate('/2fa');
        return;
      }
      if (data.success) {
        setAuth(data.user, data.token);
        notifications.show({ title: 'Bienvenido!', message: `Hola ${data.user.name}`, color: 'green' });
        navigate('/dashboard');
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Credenciales invalidas',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&scope=email%20profile&access_type=offline`;
    window.location.href = authUrl;
  };

  return (
    <Center style={{ height: '100vh' }}>
      <Container size="xs">
        <Paper shadow="xl" radius="md" p="xl">
          <Title order={2} ta="center" mb="lg">
            <IconFlame size={28} color="#F97316" style={{ marginRight: 8, verticalAlign: 'middle' }} />
            LifeScore
          </Title>
          <Title order={4} ta="center" c="dimmed" mb="xl">
            Inicia sesion para continuar
          </Title>

          <Button
            fullWidth
            variant="outline"
            color="red"
            leftSection={<IconBrandGoogle size={18} />}
            onClick={handleGoogleLogin}
            mb="md"
            size="md"
          >
            Continuar con Google
          </Button>

          <Divider label="o continua con email" labelPosition="center" my="md" />

          <form onSubmit={handleSubmit}>
            <TextInput
              label="Email"
              placeholder="tu@email.com"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              mb="md"
            />
            <PasswordInput
              label="Contrasena"
              placeholder="********"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              mb="xl"
            />
            <Button fullWidth size="md" type="submit" loading={loading}>
              Iniciar Sesion
            </Button>
          </form>

          <Box ta="center" mt="md">
            <Text size="sm" c="dimmed">
              No tienes cuenta?{' '}
              <Text component={Link} to="/register" c="violet" style={{ textDecoration: 'none' }}>
                Registrate aqui
              </Text>
            </Text>
          </Box>
        </Paper>
      </Container>
    </Center>
  );
};

export default Login;
