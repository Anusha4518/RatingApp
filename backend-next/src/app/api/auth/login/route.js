// POST /api/auth/login — checks credentials and returns a JWT token
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db.js';
import { generateToken } from '@/lib/auth.js';

export async function POST(request) {
  try {
    // 1. Read email and password from the request body
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // 2. Look up the user by email
    const [users] = await db.execute(
      'SELECT id, name, email, password_hash, address, role FROM users WHERE email = ?',
      [email]
    );

    // If no user found, give a vague error (don't reveal whether email exists)
    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const user = users[0];

    // 3. Compare the plain-text password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // 4. Create a JWT token for this user
    const tokenPayload = { id: user.id, email: user.email, role: user.role };
    const token = generateToken(tokenPayload);

    // 5. Delete any old sessions for this user (only one active session at a time)
    await db.execute(
      'DELETE FROM user_sessions WHERE user_id = ?',
      [user.id]
    );

    // 6. Store the new session in the database with a 24-hour expiry
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // now + 1 day
    await db.execute(
      'INSERT INTO user_sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [sessionId, user.id, token, expiresAt]
    );

    // 7. Return the token and basic user info to the client
    return NextResponse.json({
      message: 'Login successful.',
      token,
      user: {
        id:      user.id,
        name:    user.name,
        email:   user.email,
        address: user.address,
        role:    user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
