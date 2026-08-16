// PATCH /api/auth/change-password — lets a logged-in user update their password
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db.js';
import { authenticateToken } from '@/lib/middleware.js';

export async function PATCH(request) {
  // Only logged-in users can change their password
  const { user, error, status } = await authenticateToken(request);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const { oldPassword, newPassword } = await request.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Old password and new password are required.' },
        { status: 400 }
      );
    }

    // Get the current password hash from the database
    const [users] = await db.execute(
      'SELECT password_hash FROM users WHERE id = ?',
      [user.id]
    );
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Make sure the old password the user typed matches what we have stored
    const isMatch = await bcrypt.compare(oldPassword, users[0].password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Incorrect old password.' },
        { status: 400 }
      );
    }

    // Validate the new password — same rules as registration
    if (newPassword.length < 8 || newPassword.length > 16) {
      return NextResponse.json(
        { error: 'New password must be between 8 and 16 characters.' },
        { status: 400 }
      );
    }

    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasSpecial   = /[^A-Za-z0-9]/.test(newPassword);
    if (!hasUppercase || !hasSpecial) {
      return NextResponse.json(
        { error: 'New password must include at least one uppercase letter and at least one special character.' },
        { status: 400 }
      );
    }

    // Hash the new password and save it
    const newHash = await bcrypt.hash(newPassword, 10);
    await db.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newHash, user.id]
    );

    return NextResponse.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
