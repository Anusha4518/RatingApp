// GET /api/admin/dashboard — returns total counts of users, stores, and ratings
// Only accessible by SYSTEM_ADMIN users.
import { NextResponse } from 'next/server';
import db from '@/lib/db.js';
import { authenticateToken, requireRole } from '@/lib/middleware.js';

export async function GET(request) {
  // Step 1: Check that the request has a valid login token
  const { user, error, status } = await authenticateToken(request);
  if (error) return NextResponse.json({ error }, { status });

  // Step 2: Check that the logged-in user is an admin
  const roleError = requireRole(['SYSTEM_ADMIN'], user);
  if (roleError) return NextResponse.json({ error: roleError.error }, { status: roleError.status });

  try {
    // Count all users
    const [[usersResult]]   = await db.execute('SELECT COUNT(*) AS total FROM users');
    // Count all stores
    const [[storesResult]]  = await db.execute('SELECT COUNT(*) AS total FROM stores');
    // Count all ratings
    const [[ratingsResult]] = await db.execute('SELECT COUNT(*) AS total FROM ratings');

    return NextResponse.json({
      totalUsers:   usersResult.total,
      totalStores:  storesResult.total,
      totalRatings: ratingsResult.total,
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
