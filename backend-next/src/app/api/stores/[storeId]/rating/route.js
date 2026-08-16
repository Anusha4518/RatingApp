// POST /api/stores/[storeId]/rating — submit or update a rating for a specific store
// Only NORMAL_USER role can rate stores.
//
// In Next.js App Router, dynamic route params (like [storeId]) are passed
// as the second argument: { params }
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db.js';
import { authenticateToken, requireRole } from '@/lib/middleware.js';

export async function POST(request, { params }) {
  // Only normal users can submit ratings
  const { user, error, status } = await authenticateToken(request);
  if (error) return NextResponse.json({ error }, { status });

  const roleError = requireRole(['NORMAL_USER'], user);
  if (roleError) return NextResponse.json({ error: roleError.error }, { status: roleError.status });

  try {
    // Get the store ID from the URL (e.g. /api/stores/abc-123/rating)
    const { storeId } = params;

    // Get the rating value from the request body
    const { rating } = await request.json();

    // Rating must be a whole number between 1 and 5
    const ratingInt = parseInt(rating, 10);
    if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5.' },
        { status: 400 }
      );
    }

    // Make sure the store actually exists
    const [stores] = await db.execute('SELECT id FROM stores WHERE id = ?', [storeId]);
    if (stores.length === 0) {
      return NextResponse.json({ error: 'Store not found.' }, { status: 404 });
    }

    // Insert the rating — if the user already rated this store, update it instead
    // (ON DUPLICATE KEY UPDATE handles that because user_id + store_id is a unique pair)
    const ratingId = uuidv4();
    await db.execute(
      `INSERT INTO ratings (id, user_id, store_id, rating)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating)`,
      [ratingId, user.id, storeId, ratingInt]
    );

    return NextResponse.json({ message: 'Rating submitted successfully.' });
  } catch (err) {
    console.error('Store rating submission error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
