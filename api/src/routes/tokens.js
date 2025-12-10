const express = require('express');
const router = express.Router();
const db = require('../db');
const redis = require('../redisClient');

const queueKey = (counterId) => `queue:counter:${counterId}`;

// Create token - calls DB create_token function
router.post('/', async (req, res) => {
  const { service_id, assigned_counter = null, created_by = null, reserved = false, meta = {} } = req.body;
  const prefix = process.env.TOKEN_PREFIX || 'B';

  try {
    // Call the DB function create_token(p_prefix, p_service_id, p_assigned_counter, p_created_by, p_reserved, p_meta)
    const result = await db.query(
      'SELECT * FROM create_token($1::text, $2::int, $3::int, $4::text, $5::bool, $6::jsonb)',
      [prefix, service_id, assigned_counter, created_by, reserved, JSON.stringify(meta)]
    );

    // Postgres returns setof (token_id, token_number) — result.rows[0] contains columns
    const { token_id, token_number } = result.rows[0];

    // Push token id to Redis queue if assigned_counter specified; otherwise operator/admin will assign later
    if (assigned_counter) {
      await redis.rpush(queueKey(assigned_counter), token_id.toString());
    }

    // Emit an event (we'll get io from req.app.locals)
    const io = req.app.locals.io;
    if (io && assigned_counter) {
      io.to(`counter:${assigned_counter}`).emit('token:created', { token_id, token_number, assigned_counter });
    }

    res.status(201).json({ token_id, token_number });
  } catch (err) {
    console.error('create token error', err);
    res.status(500).json({ error: 'Failed to create token', details: err.message });
  }
});

// Peek token
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const { rows } = await db.query('SELECT * FROM tokens WHERE id = $1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Token not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Operator: call next token from counter queue
router.post('/call/:counterId', async (req, res) => {
  const counterId = req.params.counterId;
  const operator = req.body.operator || 'system';
  const redisKey = queueKey(counterId);

  try {
    // BRPOPLPUSH style: pop leftmost (front of queue)
    // We use LPOP to dequeue (simple, non-blocking)
    const tokenId = await redis.lpop(redisKey);
    if (!tokenId) return res.status(404).json({ error: 'No tokens in queue' });

    // Update token status in DB
    await db.query('UPDATE tokens SET status = $1, called_at = now(), assigned_counter = $2 WHERE id = $3', ['called', counterId, tokenId]);

    // Audit will be inserted by trigger
    // Emit socket event
    const io = req.app.locals.io;
    if (io) {
      io.to(`counter:${counterId}`).emit('token:called', { token_id: tokenId, counter: counterId });
      io.to('kiosk:all').emit('token:called', { token_id: tokenId, counter: counterId });
    }

    res.json({ token_id: tokenId });
  } catch (err) {
    console.error('call token error', err);
    res.status(500).json({ error: err.message });
  }
});

// Serve token (mark served)
router.post('/serve/:id', async (req, res) => {
  const tokenId = req.params.id;
  try {
    await db.query('UPDATE tokens SET status = $1, in_service_at = now(), served_at = now() WHERE id = $2', ['served', tokenId]);
    const io = req.app.locals.io;
    if (io) io.emit('token:served', { token_id: tokenId });
    res.json({ ok: true, token_id: tokenId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
