const jwt = require('jsonwebtoken');

const authMiddleware = require('../../src/middlewares/auth');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    vi.spyOn(jwt, 'verify').mockReset();
    req = { headers: {} };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    next = vi.fn();
  });

  it('deberia pasar si el token es valido', async () => {
    req.headers.authorization = 'Bearer validtoken';
    jwt.verify.mockReturnValue({ id: 1, email: 'test@test.com' });

    await authMiddleware(req, res, next);

    expect(req.user).toEqual({ id: 1, email: 'test@test.com' });
    expect(req.token).toBe('validtoken');
    expect(next).toHaveBeenCalled();
  });

  it('deberia devolver 401 si no hay header Authorization', async () => {
    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.stringContaining('token'),
    }));
  });

  it('deberia devolver 401 si no empieza con Bearer', async () => {
    req.headers.authorization = 'Basic abc123';
    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('deberia devolver 401 si el token es invalido', async () => {
    req.headers.authorization = 'Bearer invalid';
    const error = new Error('jwt malformed');
    error.name = 'JsonWebTokenError';
    jwt.verify.mockImplementation(() => { throw error; });

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Token invalido',
    }));
  });

  it('deberia devolver 401 si el token expiro', async () => {
    req.headers.authorization = 'Bearer expired';
    const error = new Error('jwt expired');
    error.name = 'TokenExpiredError';
    jwt.verify.mockImplementation(() => { throw error; });

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Token expirado',
    }));
  });

  it('deberia devolver 500 para otros errores', async () => {
    req.headers.authorization = 'Bearer something';
    jwt.verify.mockImplementation(() => { throw new Error('Unknown'); });

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
