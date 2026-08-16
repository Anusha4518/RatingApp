// POST /api/auth/logout — deletes the user's current session from the database
import { NextResponse } from 'next/server';
import db from '@/lib/db.js';
import { authenticateToken } from '@/lib/middleware.js';

export async function POST(request) {
  // Check the token — only logged-in users can log out
  const { user, token, error, status } = await authenticateToken(request);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    // Delete this specific session from the database
    await db.execute(
      'DELETE FROM user_sessions WHERE user_id = ? AND token = ?',
      [user.id, token]
    );

    return NextResponse.json({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
