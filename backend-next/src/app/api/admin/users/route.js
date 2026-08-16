// GET  /api/admin/users — list all users (with optional search, role filter, and sorting)
// POST /api/admin/users — create a new user with any role
// Only accessible by SYSTEM_ADMIN users.
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db.js';
import { authenticateToken, requireRole } from '@/lib/middleware.js';
import { validateUserInput } from '@/lib/validations.js';


// ─── GET — list users ─────────────────────────────────────────────────────────
export async function GET(request) {
  // Auth check
  const { user, error, status } = await authenticateToken(request);
  if (error) return NextResponse.json({ error }, { status });

  const roleError = requireRole(['SYSTEM_ADMIN'], user);
  if (roleError) return NextResponse.json({ error: roleError.error }, { status: roleError.status });

  try {
    // Read query params from the URL: ?search=john&role=NORMAL_USER&sortBy=name&order=ASC
    const { searchParams } = new URL(request.url);
    const search  = searchParams.get('search')  || '';
    const role    = searchParams.get('role')    || '';
    const sortBy  = searchParams.get('sortBy')  || 'name';
    const order   = searchParams.get('order')   || 'ASC';

    // Only allow sorting by known columns to prevent SQL injection
    const allowedSortFields = {
      name:       'u.name',
      email:      'u.email',
      address:    'u.address',
      role:       'u.role',
      created_at: 'u.created_at',
    };
    const sortColumn = allowedSortFields[sortBy] || 'u.name';
    const sortOrder  = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Build the query — we also grab the store name and rating if the user is a store owner
    let sql = `
      SELECT u.id, u.name, u.email, u.address, u.role, u.created_at,
             s.name AS store_name,
             (SELECT AVG(r.rating) FROM ratings r WHERE r.store_id = s.id) AS store_rating
      FROM users u
      LEFT JOIN stores s ON s.owner_id = u.id
    `;

    const whereClauses = [];
    const params = [];

    // Filter by role if provided
    if (role) {
      whereClauses.push('u.role = ?');
      params.push(role);
    }

    // Search across name, email, and address
    if (search) {
      whereClauses.push('(u.name LIKE ? OR u.email LIKE ? OR u.address LIKE ?)');
      const wildcard = `%${search}%`;
      params.push(wildcard, wildcard, wildcard);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += ` ORDER BY ${sortColumn} ${sortOrder}`;

    const [users] = await db.execute(sql, params);

    // Format the result nicely
    const formattedUsers = users.map((u) => ({
      id:        u.id,
      name:      u.name,
      email:     u.email,
      address:   u.address,
      role:      u.role,
      createdAt: u.created_at,
      store: u.store_name
        ? {
            name:   u.store_name,
            rating: u.store_rating !== null
              ? parseFloat(parseFloat(u.store_rating).toFixed(2))
              : 0,
          }
        : null,
    }));

    return NextResponse.json(formattedUsers);
  } catch (err) {
    console.error('Admin users list error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}


// ─── POST — create user ───────────────────────────────────────────────────────
export async function POST(request) {
  // Auth check
  const { user, error, status } = await authenticateToken(request);
  if (error) return NextResponse.json({ error }, { status });

  const roleError = requireRole(['SYSTEM_ADMIN'], user);
  if (roleError) return NextResponse.json({ error: roleError.error }, { status: roleError.status });

  try {
    const { name, email, password, address, role: newRole } = await request.json();

    // Make sure the role is one of the valid options
    const validRoles = ['SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER'];
    if (!newRole || !validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be SYSTEM_ADMIN, NORMAL_USER, or STORE_OWNER.' },
        { status: 400 }
      );
    }

    // Validate name, email, password, address
    const { isValid, errors } = validateUserInput({ name, email, password, address });
    if (!isValid) {
      return NextResponse.json({ error: 'Validation failed.', details: errors }, { status: 400 });
    }

    // Check if email is already taken
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email is already in use.' }, { status: 400 });
    }

    // Hash password, generate ID, and insert
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await db.execute(
      `INSERT INTO users (id, name, email, password_hash, address, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, name, email, hashedPassword, address, newRole]
    );

    return NextResponse.json(
      { message: 'User created successfully.', userId },
      { status: 201 }
    );
  } catch (err) {
    console.error('Admin user create error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
