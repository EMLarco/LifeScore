import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import Login from './Login';
import * as authService from '../services/authService';

vi.mock('../services/authService');
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    login: vi.fn(),
    user: null,
    loading: false,
  }),
}));

const renderLogin = () => {
  return render(
    <MantineProvider>
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    </MantineProvider>
  );
};

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deberia renderizar el formulario de login', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('********')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesion/i })).toBeInTheDocument();
  });

  it('deberia renderizar el boton de Google', () => {
    renderLogin();
    expect(screen.getByText(/continuar con google/i)).toBeInTheDocument();
  });

  it('deberia renderizar link de registro', () => {
    renderLogin();
    expect(screen.getByText(/no tienes cuenta/i)).toBeInTheDocument();
    expect(screen.getByText(/registrate aqui/i)).toBeInTheDocument();
  });

  it('deberia actualizar los campos al escribir', () => {
    renderLogin();
    const emailInput = screen.getByPlaceholderText('tu@email.com');
    const passwordInput = screen.getByPlaceholderText('********');

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.change(passwordInput, { target: { value: '123456' } });

    expect(emailInput.value).toBe('test@test.com');
    expect(passwordInput.value).toBe('123456');
  });

  it('deberia llamar a authService.login al enviar el formulario', async () => {
    authService.login.mockResolvedValue({
      success: true,
      user: { name: 'Test' },
      token: 'token123',
    });

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('********'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesion/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('test@test.com', '123456');
    });
  });

  it('deberia manejar error de login', async () => {
    authService.login.mockRejectedValue({
      response: { data: { message: 'Credenciales invalidas' } },
    });

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('********'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesion/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalled();
    });
  });
});
