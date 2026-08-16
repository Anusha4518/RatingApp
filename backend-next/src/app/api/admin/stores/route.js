// GET  /api/admin/stores — list all stores with owner info and average rating
// POST /api/admin/stores — create a new store and assign it to a store owner
// Only accessible by SYSTEM_ADMIN users.
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db.js';
import { authenticateToken, requireRole } from '@/lib/middleware.js';


// ─── GET — list stores ────────────────────────────────────────────────────────
export async function GET(request) {
  // Auth check
  const { user, error, status } = await authenticateToken(request);
  if (error) return NextResponse.json({ error }, { status });

  const roleError = requireRole(['SYSTEM_ADMIN'], user);
  if (roleError) return NextResponse.json({ error: roleError.error }, { status: roleError.status });

  try {
    // Read query params: ?search=coffee&sortBy=name&order=ASC
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const order  = searchParams.get('order')  || 'ASC';

    const allowedSortFields = {
      name:    's.name',
      email:   's.email',
      address: 's.address',
      rating:  'average_rating',
    };
    const sortColumn = allowedSortFields[sortBy] || 's.name';
    const sortOrder  = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Join with users to get the owner name, and ratings to get the average
    let sql = `
      SELECT s.id, s.name, s.email, s.address, s.owner_id,
             u.name AS owner_name,
             COALESCE(AVG(r.rating), 0) AS average_rating
      FROM stores s
      LEFT JOIN users u ON s.owner_id = u.id
      LEFT JOIN ratings r ON r.store_id = s.id
    `;

    const params = [];
    if (search) {
      sql += ' WHERE (s.name LIKE ? OR s.address LIKE ? OR s.email LIKE ?)';
      const wildcard = `%${search}%`;
      params.push(wildcard, wildcard, wildcard);
    }

    sql += ' GROUP BY s.id, u.id';
    sql += ` ORDER BY ${sortColumn} ${sortOrder}`;

    const [stores] = await db.execute(sql, params);

    const formattedStores = stores.map((s) => ({
      id:            s.id,
      name:          s.name,
      email:         s.email,
      address:       s.address,
      ownerId:       s.owner_id,
      ownerName:     s.owner_name,
      averageRating: parseFloat(parseFloat(s.average_rating).toFixed(2)),
    }));

    return NextResponse.json(formattedStores);
  } catch (err) {
    console.error('Admin stores list error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}


// ─── POST — create store ──────────────────────────────────────────────────────
export async function POST(request) {
  // Auth check
  const { user, error, status } = await authenticateToken(request);
  if (error) return NextResponse.json({ error }, { status });

  const roleError = requireRole(['SYSTEM_ADMIN'], user);
  if (roleError) return NextResponse.json({ error: roleError.error }, { status: roleError.status });

  try {
    const { name, email, address, ownerId } = await request.json();

    // Validate store name length
    if (!name || name.length < 10 || name.length > 60) {
      return NextResponse.json(
        { error: 'Store name must be between 10 and 60 characters.' },
        { status: 400 }
      );
    }

    // Validate store address length
    if (!address || address.length < 10 || address.length > 400) {
      return NextResponse.json(
        { error: 'Store address must be between 10 and 400 characters.' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Store email must be valid.' },
        { status: 400 }
      );
    }

    // An owner must be provided
    if (!ownerId) {
      return NextResponse.json(
        { error: 'Store owner is required.' },
        { status: 400 }
      );
    }

    // Make sure the owner exists and has the STORE_OWNER role
    const [owners] = await db.execute(
      'SELECT role FROM users WHERE id = ?',
      [ownerId]
    );
    if (owners.length === 0) {
      return NextResponse.json(
        { error: 'Selected store owner does not exist.' },
        { status: 404 }
      );
    }
    if (owners[0].role !== 'STORE_OWNER') {
      return NextResponse.json(
        { error: 'Selected user is not a Store Owner.' },
        { status: 400 }
      );
    }

    // Make sure the store email is not already used
    const [existingStore] = await db.execute(
      'SELECT id FROM stores WHERE email = ?',
      [email]
    );
    if (existingStore.length > 0) {
      return NextResponse.json(
        { error: 'Store email is already in use.' },
        { status: 400 }
      );
    }

    // Insert the new store
    const storeId = uuidv4();
    await db.execute(
      `INSERT INTO stores (id, name, email, address, owner_id)
       VALUES (?, ?, ?, ?, ?)`,
      [storeId, name, email, address, ownerId]
    );

    return NextResponse.json(
      { message: 'Store created successfully.', storeId },
      { status: 201 }
    );
  } catch (err) {
    console.error('Admin store create error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
