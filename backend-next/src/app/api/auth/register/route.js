// POST /api/auth/register — creates a new normal user account
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db.js';
import { validateUserInput } from '@/lib/validations.js';

export async function POST(request) {
  try {
    // 1. Read the JSON body sent by the user
    const { name, email, password, address } = await request.json();

    // 2. Validate all the fields (name length, email format, password strength, etc.)
    const { isValid, errors } = validateUserInput({ name, email, password, address });
    if (!isValid) {
      return NextResponse.json(
        { error: 'Validation failed.', details: errors },
        { status: 400 }
      );
    }

    // 3. Check if someone already registered with this email
    const [existing] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Email is already registered.' },
        { status: 400 }
      );
    }

    // 4. Hash the password so we never store the raw password in the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Generate a unique ID for the new user
    const userId = uuidv4();

    // 6. Insert the new user into the database
    await db.execute(
      `INSERT INTO users (id, name, email, password_hash, address, role)
       VALUES (?, ?, ?, ?, ?, 'NORMAL_USER')`,
      [userId, name, email, hashedPassword, address]
    );

    return NextResponse.json(
      { message: 'Registration successful.', userId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
