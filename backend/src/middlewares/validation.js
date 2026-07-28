const { body, validationResult } = require('express-validator');

/**
 * Middleware que ejecuta las validaciones y devuelve errores si fallan
 * (pág. 39)
 */
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  };
};

// Reglas de validación para registro
const registerValidation = [
  body('name')
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres'),

  body('email')
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),

  // Validación opcional para género
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other']).withMessage('El género debe ser male, female u other'),
];

// Reglas de validación para login
const loginValidation = [
  body('email')
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria'),
];

// Validación para crear/actualizar hábito
const habitValidation = [
  body('title')
    .notEmpty().withMessage('El título es obligatorio')
    .isLength({ min: 1, max: 100 }).withMessage('El título debe tener máximo 100 caracteres'),

  body('icon')
    .optional()
    .isString().withMessage('El icono debe ser texto'),

  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('El color debe ser un hex válido (#RRGGBB)'),
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  habitValidation,
};