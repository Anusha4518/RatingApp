// middleware.js — Authentication and role-checking helpers for Next.js API routes
//
// In Express, middleware runs via req/res/next.
// In Next.js App Router, there is no "next()" — instead, each route handler
// calls these helper functions directly and checks the result.

import { verifyToken } from './auth.js';
import db from './db.js';


// authenticateToken — checks the Authorization header and verifies the session
//
// How to use in a route:
//   const { user, token, error, status } = await authenticateToken(request);
//   if (error) return NextResponse.json({ error }, { status });
//
// Returns:
//   { user, token }        — on success (user is the decoded JWT payload)
//   { error, status }      — on failure
export async function authenticateToken(request) {
  // Get the Authorization header from the incoming request
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return { error: 'Authorization header is missing.', status: 401 };
  }

  // Verify the JWT token inside the header
  let decodedUser;
  try {
    decodedUser = verifyToken(authHeader);
  } catch (err) {
    return { error: err.message, status: 401 };
  }

  // Extract just the raw token string (after "Bearer ")
  const token = authHeader.split(' ')[1];

  // Check if this session still exists in the database (not logged out, not expired)
  try {
    const [sessions] = await db.execute(
      'SELECT id FROM user_sessions WHERE user_id = ? AND token = ? AND expires_at > NOW()',
      [decodedUser.id, token]
    );

    if (sessions.length === 0) {
      return { error: 'Session is invalid or has been logged out.', status: 401 };
    }

    // Everything looks good — return the user info and token
    return { user: decodedUser, token };
  } catch (dbErr) {
    console.error('Session DB verification error:', dbErr);
    return { error: 'Authentication database verification failed.', status: 500 };
  }
}


// requireRole — checks if the authenticated user has the right role
//
// How to use in a route (after authenticateToken):
//   const roleError = requireRole(['SYSTEM_ADMIN'], user);
//   if (roleError) return NextResponse.json({ error: roleError.error }, { status: roleError.status });
//
// allowedRoles — an array like ['SYSTEM_ADMIN'] or ['NORMAL_USER', 'STORE_OWNER']
export function requireRole(allowedRoles, user) {
  if (!user || !allowedRoles.includes(user.role)) {
    return { error: 'Access denied. Insufficient permissions.', status: 403 };
  }

  // null means "no error" — the user has the right role
  return null;
}
