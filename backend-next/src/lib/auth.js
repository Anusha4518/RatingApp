// auth.js — Helper functions for creating and verifying JWT tokens
// A JWT (JSON Web Token) is a small, signed piece of data we send to
// the user after login. On every protected request, the user sends it
// back and we verify it here to know who they are.

import jwt from 'jsonwebtoken';

// Read the secret from the environment, fall back to a default for dev
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_token_123!';


// generateToken — creates a signed token from the user's basic info
// The token automatically expires after 1 day.
export function generateToken(userPayload) {
  const payload = {
    id:    userPayload.id,
    role:  userPayload.role,
    email: userPayload.email,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}


// verifyToken — checks that a token is valid and not expired
// Returns the decoded user info if it's good, or throws an error if not.
export function verifyToken(authorizationHeader) {
  // The header must look like: "Bearer <token>"
  if (!authorizationHeader) {
    throw new Error('Authorization header is missing.');
  }

  const parts = authorizationHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new Error('Authorization header format must be: Bearer <token>');
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Only return the fields we care about
    return {
      id:    decoded.id,
      role:  decoded.role,
      email: decoded.email,
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired.');
    }
    throw new Error('Invalid token.');
  }
}
