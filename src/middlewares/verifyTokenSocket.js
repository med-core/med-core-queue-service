import jwt from "jsonwebtoken";

export const verifyTokenSocket = (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Token requerido"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = {
      id: decoded.id,
      role: decoded.role,
      fullname: decoded.fullname,
      email: decoded.email,
    };
    next();
  } catch (err) {
    next(new Error("Token inválido"));
  }
};