const adminMiddleware = (req, res, next) => {
  try {
    const user = req.user;
    if (!user || !user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren permisos de administrador.',
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = adminMiddleware;
