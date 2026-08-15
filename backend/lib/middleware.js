import { verifyToken } from './auth.js';
import db from './db.js';


export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header is missing.' });
  }

  
  let decodedUser;
  try {
    decodedUser = verifyToken(authHeader);
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }

  
  const token = authHeader.split(' ')[1];

  
  try {
    const [sessions] = await db.execute(
      'SELECT id FROM user_sessions WHERE user_id = ? AND token = ? AND expires_at > NOW()',
      [decodedUser.id, token]
    );

    if (sessions.length === 0) {
      return res.status(401).json({ error: 'Session is invalid or has been logged out.' });
    }
    
    
    req.user = decodedUser;
    req.token = token;
    next();
  } catch (dbErr) {
    console.error('Session DB verification error:', dbErr);
    return res.status(500).json({ error: 'Authentication database verification failed.' });
  }
}


export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
}
