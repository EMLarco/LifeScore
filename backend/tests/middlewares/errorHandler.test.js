const errorHandler = require('../../src/middlewares/errorHandler');

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {};
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    next = vi.fn();
  });

  it('deberia devolver 500 por defecto', () => {
    const err = new Error('Something went wrong');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Something went wrong',
    }));
  });

  it('deberia usar statusCode personalizado si existe', () => {
    const err = new Error('Not Found');
    err.statusCode = 404;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('deberia incluir stack en development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const err = new Error('Dev error');
    errorHandler(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      stack: expect.any(String),
    }));

    process.env.NODE_ENV = originalEnv;
  });

  it('no deberia incluir stack en production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const err = new Error('Prod error');
    errorHandler(err, req, res, next);

    const callArg = res.json.mock.calls[0][0];
    expect(callArg).not.toHaveProperty('stack');

    process.env.NODE_ENV = originalEnv;
  });
});
