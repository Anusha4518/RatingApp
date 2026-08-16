// GET /api/admin/ratings — list all ratings with user and store info
// Supports optional search by user name or store name.
// Only accessible by SYSTEM_ADMIN users.
import { NextResponse } from 'next/server';
import db from '@/lib/db.js';
import { authenticateToken, requireRole } from '@/lib/middleware.js';

export async function GET(request) {
  // Auth check
  const { user, error, status } = await authenticateToken(request);
  if (error) return NextResponse.json({ error }, { status });

  const roleError = requireRole(['SYSTEM_ADMIN'], user);
  if (roleError) return NextResponse.json({ error: roleError.error }, { status: roleError.status });

  try {
    // Read the optional search query from the URL: ?search=coffee
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Join ratings with users and stores to get full details
    let sql = `
      SELECT r.id, r.rating, r.created_at,
             u.name    AS user_name,
             u.email   AS user_email,
             u.address AS user_address,
             s.name    AS store_name
      FROM ratings r
      JOIN users  u ON r.user_id  = u.id
      JOIN stores s ON r.store_id = s.id
    `;

    const params = [];
    if (search) {
      sql += ' WHERE (u.name LIKE ? OR s.name LIKE ?)';
      const wildcard = `%${search}%`;
      params.push(wildcard, wildcard);
    }

    sql += ' ORDER BY r.created_at DESC';

    const [ratings] = await db.execute(sql, params);

    const formattedRatings = ratings.map((r) => ({
      id:          r.id,
      userName:    r.user_name,
      userEmail:   r.user_email,
      userAddress: r.user_address,
      storeName:   r.store_name,
      rating:      r.rating,
      createdAt:   r.created_at,
    }));

    return NextResponse.json(formattedRatings);
  } catch (err) {
    console.error('Admin ratings list error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
