// GET /api/stores — list all stores with average rating and the current user's rating
// Accessible by any logged-in user.
import { NextResponse } from 'next/server';
import db from '@/lib/db.js';
import { authenticateToken } from '@/lib/middleware.js';

export async function GET(request) {
  // Any logged-in user can see the stores
  const { user, error, status } = await authenticateToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    // Read optional search query: ?search=bakery
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // The query gets:
    //   - The overall average rating for each store (from all users)
    //   - The current user's own rating for each store (so the UI can show it)
    let sql = `
      SELECT s.id, s.name, s.address, s.email,
             COALESCE(AVG(r_all.rating), 0)   AS average_rating,
             COALESCE(
               (SELECT r_user.rating
                FROM ratings r_user
                WHERE r_user.store_id = s.id AND r_user.user_id = ?),
             0) AS user_rating
      FROM stores s
      LEFT JOIN ratings r_all ON r_all.store_id = s.id
    `;

    // The first parameter is always the current user's ID
    const params = [user.id];

    if (search) {
      sql += ' WHERE (s.name LIKE ? OR s.address LIKE ?)';
      const wildcard = `%${search}%`;
      params.push(wildcard, wildcard);
    }

    sql += ' GROUP BY s.id';
    sql += ' ORDER BY s.name ASC';

    const [stores] = await db.execute(sql, params);

    const formattedStores = stores.map((s) => ({
      id:            s.id,
      name:          s.name,
      address:       s.address,
      email:         s.email,
      averageRating: parseFloat(parseFloat(s.average_rating).toFixed(2)),
      userRating:    parseInt(s.user_rating, 10),
    }));

    return NextResponse.json(formattedStores);
  } catch (err) {
    console.error('Stores list error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
