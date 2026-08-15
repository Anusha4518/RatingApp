import express from 'express';
import db from '../lib/db.js';
import { authenticateToken, requireRole } from '../lib/middleware.js';

const router = express.Router();

router.use(authenticateToken, requireRole(['STORE_OWNER']));

router.get('/dashboard', async (req, res) => {
  try {
    const [stores] = await db.execute(
      'SELECT id, name FROM stores WHERE owner_id = ?',
      [req.user.id]
    );

    if (stores.length === 0) {
      return res.json({
        storeName: null,
        averageRating: 0,
        ratings: []
      });
    }

    const store = stores[0];

    const [[avgResult]] = await db.execute(
      'SELECT COALESCE(AVG(rating), 0) AS average_rating FROM ratings WHERE store_id = ?',
      [store.id]
    );

    const [raters] = await db.execute(
      `SELECT u.name, u.email, u.address, r.rating, r.created_at 
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       WHERE r.store_id = ?
       ORDER BY r.created_at DESC`,
      [store.id]
    );

    const formattedRaters = raters.map(r => ({
      name: r.name,
      email: r.email,
      address: r.address,
      rating: r.rating,
      createdAt: r.created_at
    }));

    return res.json({
      storeName: store.name,
      averageRating: parseFloat(parseFloat(avgResult.average_rating).toFixed(2)),
      ratings: formattedRaters
    });
  } catch (error) {
    console.error('Owner dashboard stats error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
