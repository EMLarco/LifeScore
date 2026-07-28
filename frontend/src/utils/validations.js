/**
 * Valida que el email tenga formato correcto
 */
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Valida que la contraseña tenga al menos 6 caracteres
 */
export const isValidPassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Valida que el nombre no esté vacío y tenga al menos 2 caracteres
 */
export const isValidName = (name) => {
  return name && name.trim().length >= 2;
};

/**
 * Valida un hábito: título requerido
 */
export const isValidHabitTitle = (title) => {
  return title && title.trim().length > 0;
};

/**
 * Esquema de validación para registro (objeto con errores)
 */
export const validateRegister = ({ name, email, password }) => {
  const errors = {};

  if (!isValidName(name)) {
    errors.name = 'El nombre debe tener al menos 2 caracteres';
  }

  if (!isValidEmail(email)) {
    errors.email = 'Ingresa un email válido';
  }

  if (!isValidPassword(password)) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres';
  }

  return errors;
};

/**
 * Esquema de validación para login
 */
export const validateLogin = ({ email, password }) => {
  const errors = {};

  if (!isValidEmail(email)) {
    errors.email = 'Ingresa un email válido';
  }

  if (!password || password.length === 0) {
    errors.password = 'La contraseña es requerida';
  }

  return errors;
};