const pool = require('../../src/config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');
const emailService = require('../../src/services/emailService');

const { register, login, getProfile, changePassword } = require('../../src/controllers/authController');

describe('Auth Controller', () => {
  let req, res, next;

  beforeEach(() => {
    vi.spyOn(pool, 'query').mockReset();
    vi.spyOn(bcrypt, 'hash').mockReset();
    vi.spyOn(bcrypt, 'compare').mockReset();
    vi.spyOn(jwt, 'sign').mockReset();
    vi.spyOn(User, 'findByEmail').mockReset();
    vi.spyOn(User, 'findById').mockReset();
    vi.spyOn(User, 'create').mockReset();
    vi.spyOn(User, 'updateStreakAndPoints').mockReset();
    vi.spyOn(User, 'updateLastLogin').mockReset();
    vi.spyOn(User, 'updatePassword').mockReset();
    vi.spyOn(User, 'getStats').mockReset();
    vi.spyOn(emailService, 'sendWelcomeEmail').mockReset();
    vi.spyOn(emailService, 'send2FACodeEmail').mockReset();

    req = { body: {}, user: { id: 1, email: 'test@test.com' } };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    next = vi.fn();
  });

  describe('register', () => {
    it('deberia registrar un usuario exitosamente', async () => {
      req.body = { name: 'Test', email: 'test@test.com', password: '123456', gender: 'male' };
      User.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed');
      User.create.mockResolvedValue({ id: 1, name: 'Test', email: 'test@test.com', level: 1, total_xp: 0, points: 0, daily_streak: 0, is_premium: false, is_admin: false, gender: 'male', username: 'test', tag: 'ABC12' });
      jwt.sign.mockReturnValue('token123');

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Usuario registrado exitosamente',
      }));
    });

    it('deberia devolver 400 si el email ya existe', async () => {
      req.body = { name: 'Test', email: 'test@test.com', password: '123456' };
      User.findByEmail.mockResolvedValue({ id: 1 });

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'El email ya esta registrado',
      }));
    });

    it('deberia llamar next con error si falla', async () => {
      req.body = { name: 'Test', email: 'test@test.com', password: '123456' };
      const error = new Error('DB Error');
      User.findByEmail.mockRejectedValue(error);

      await register(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    it('deberia iniciar sesion exitosamente', async () => {
      req.body = { email: 'test@test.com', password: '123456' };
      req.headers = { 'user-agent': 'TestAgent' };
      User.findByEmail.mockResolvedValue({ id: 1, email: 'test@test.com', password_hash: 'hashed', daily_streak: 0, last_login: null, totp_enabled: false });
      bcrypt.compare.mockResolvedValue(true);
      User.updateStreakAndPoints.mockResolvedValue({});
      User.updateLastLogin.mockResolvedValue({});
      User.findById.mockResolvedValue({ id: 1, name: 'Test', email: 'test@test.com', level: 1, total_xp: 0, points: 0, daily_streak: 1, is_premium: false, is_admin: false, username: 'test', tag: 'ABC12' });
      jwt.sign.mockReturnValue('token123');
      pool.query.mockResolvedValue({});

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Inicio de sesion exitoso',
      }));
    });

    it('deberia devolver 401 si el usuario no existe', async () => {
      req.body = { email: 'noexist@test.com', password: '123456' };
      User.findByEmail.mockResolvedValue(null);

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Credenciales invalidas',
      }));
    });

    it('deberia devolver 401 si la contrasena es incorrecta', async () => {
      req.body = { email: 'test@test.com', password: 'wrong' };
      User.findByEmail.mockResolvedValue({ id: 1, email: 'test@test.com', password_hash: 'hashed', totp_enabled: false });
      bcrypt.compare.mockResolvedValue(false);

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Credenciales invalidas',
      }));
    });

    it('deberia devolver requires_2fa si tiene 2FA habilitado', async () => {
      req.body = { email: 'test@test.com', password: '123456' };
      User.findByEmail.mockResolvedValue({ id: 1, email: 'test@test.com', password_hash: 'hashed', totp_enabled: true });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('temp_token');

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        requires_2fa: true,
      }));
    });
  });

  describe('getProfile', () => {
    it('deberia obtener el perfil del usuario', async () => {
      User.findById.mockResolvedValue({ id: 1, name: 'Test', email: 'test@test.com' });
      User.getStats.mockResolvedValue({ habits_count: 5, max_streak: 10 });

      await getProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        user: expect.objectContaining({ id: 1, name: 'Test' }),
      }));
    });

    it('deberia devolver 404 si el usuario no existe', async () => {
      User.findById.mockResolvedValue(null);

      await getProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Usuario no encontrado',
      }));
    });
  });

  describe('changePassword', () => {
    it('deberia cambiar la contrasena', async () => {
      req.body = { currentPassword: 'old', newPassword: 'new123' };
      User.findByEmail.mockResolvedValue({ id: 1, password_hash: 'old_hash' });
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('new_hash');
      User.updatePassword.mockResolvedValue({});

      await changePassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Contrasena actualizada correctamente',
      }));
    });

    it('deberia devolver 401 si la contrasena actual es incorrecta', async () => {
      req.body = { currentPassword: 'wrong', newPassword: 'new123' };
      User.findByEmail.mockResolvedValue({ id: 1, password_hash: 'hash' });
      bcrypt.compare.mockResolvedValue(false);

      await changePassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
