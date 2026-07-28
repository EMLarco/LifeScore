import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { googleLogin } from '../services/authService';
import { notifications } from '@mantine/notifications';
import { Loader, Center, Stack, Text } from '@mantine/core';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      notifications.show({ title: 'Error', message: 'Autenticacion con Google cancelada', color: 'red' });
      navigate('/login');
      return;
    }

    if (!code) {
      notifications.show({ title: 'Error', message: 'Codigo de Google no encontrado', color: 'red' });
      navigate('/login');
      return;
    }

    const handleGoogleLogin = async () => {
      try {
        const data = await googleLogin(code);
        if (data.success) {
          login(data.user, data.token);
          notifications.show({ title: 'Bienvenido', message: `Hola ${data.user.name}`, color: 'green' });
          navigate('/dashboard');
        }
      } catch (err) {
        notifications.show({
          title: 'Error',
          message: err.response?.data?.message || 'Error al iniciar sesion con Google',
          color: 'red',
        });
        navigate('/login');
      }
    };

    handleGoogleLogin();
  }, [location, navigate, login]);

  return (
    <Center style={{ height: '100vh' }}>
      <Stack align="center">
        <Loader size="xl" color="violet" />
        <Text>Iniciando sesion con Google...</Text>
      </Stack>
    </Center>
  );
};

export default GoogleCallback;
