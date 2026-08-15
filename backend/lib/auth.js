import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_token_123!';


export function generateToken(userPayload) {
  const payload = {
    id: userPayload.id,
    role: userPayload.role,
    email: userPayload.email
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}


export function verifyToken(reqHeader) {
  if (!reqHeader) {
    throw new Error('Authorization header is missing.');
  }

  const parts = reqHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new Error('Authorization header format must be: Bearer <token>');
  }

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired.');
    }
    throw new Error('Invalid token.');
  }
}
