import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../lib/db.js';
import { validateUserInput } from '../lib/validations.js';
import { generateToken } from '../lib/auth.js';
import { authenticateToken } from '../lib/middleware.js';

const router = express.Router();


router.post('/register', async (req, res) => {
  try {
    const { name, email, password, address } = req.body;

    const { isValid, errors } = validateUserInput({ name, email, password, address });
    if (!isValid) {
      return res.status(400).json({ error: 'Validation failed.', details: errors });
    }

    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await db.execute(
      `INSERT INTO users (id, name, email, password_hash, address, role) 
       VALUES (?, ?, ?, ?, ?, 'NORMAL_USER')`,
      [userId, name, email, hashedPassword, address]
    );

    return res.status(201).json({ message: 'Registration successful.', userId });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const [users] = await db.execute(
      'SELECT id, name, email, password_hash, address, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const tokenPayload = { id: user.id, email: user.email, role: user.role };
    const token = generateToken(tokenPayload);

    
    await db.execute(
      'DELETE FROM user_sessions WHERE user_id = ?',
      [user.id]
    );

    
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.execute(
      'INSERT INTO user_sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [sessionId, user.id, token, expiresAt]
    );

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


router.post('/logout', authenticateToken, async (req, res) => {
  try {
    await db.execute(
      'DELETE FROM user_sessions WHERE user_id = ? AND token = ?',
      [req.user.id, req.token]
    );
    return res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


router.patch('/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required.' });
    }

    const [users] = await db.execute('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect old password.' });
    }

    if (newPassword.length < 8 || newPassword.length > 16) {
      return res.status(400).json({ error: 'New password must be between 8 and 16 characters.' });
    }

    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
    if (!hasUppercase || !hasSpecial) {
      return res.status(400).json({
        error: 'New password must include at least one uppercase letter and at least one special character.'
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

    return res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
