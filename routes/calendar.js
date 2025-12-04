const express = require('express');
const router = express.Router();
const db = require('../db.js');

const parseBool = (v) => {
  if (v === undefined || v === null) return false;
  const s = String(v).toLowerCase();
  return s === '1' || s === 'true' || s === 'yes';
};

const mapRow = (row) => ({
  id: String(row.id),
  employeeId: String(row.user_id),
  title: row.title || '',
  description: row.description || '',
  location: row.location || '',
  start: new Date(row.start_datetime).toISOString(),
  end: row.end_datetime ? new Date(row.end_datetime).toISOString() : null,
  allDay: !!row.all_day,
  status: row.status || 'SCHEDULED',
  createdAt: new Date(row.created_at).toISOString(),
  updatedAt: new Date(row.updated_at).toISOString(),
});

router.get('/calendar-events', async (req, res) => {
  try {
    const userIdHeader = req.headers['x-user-id'];
    const userIdQuery = req.query.userId;
    const userId = userIdQuery || userIdHeader;
    const from = req.query.from ? new Date(String(req.query.from)) : null;
    const to = req.query.to ? new Date(String(req.query.to)) : null;

    let sql = 'SELECT * FROM calendar_events WHERE 1=1';
    const params = [];
    if (userId) { sql += ' AND user_id = ?'; params.push(Number(userId)); }
    if (from) { sql += ' AND start_datetime >= ?'; params.push(from); }
    if (to) { sql += ' AND start_datetime <= ?'; params.push(to); }
    sql += ' ORDER BY start_datetime ASC LIMIT 5000';
    const [rows] = await db.query(sql, params);
    res.json(rows.map(mapRow));
  } catch (e) {
    res.status(500).json({ message: 'Failed to list events.' });
  }
});

router.post('/calendar-events', async (req, res) => {
  try {
    const { employeeId, title, description, location, start, end, allDay, status } = req.body || {};
    if (!employeeId || !title || !start) return res.status(400).json({ message: 'Missing required fields.' });
    const [result] = await db.query('INSERT INTO calendar_events SET ?', {
      user_id: Number(employeeId),
      title,
      description: description || null,
      location: location || null,
      start_datetime: new Date(start),
      end_datetime: end ? new Date(end) : null,
      all_day: parseBool(allDay) ? 1 : 0,
      status: status || 'SCHEDULED',
      created_at: new Date(),
      updated_at: new Date(),
    });
    const [rows] = await db.query('SELECT * FROM calendar_events WHERE id = ?', [result.insertId]);
    res.status(201).json(mapRow(rows[0]));
  } catch (e) {
    res.status(500).json({ message: 'Failed to create event.' });
  }
});

router.put('/calendar-events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, location, start, end, allDay, status } = req.body || {};
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description || null;
    if (location !== undefined) updates.location = location || null;
    if (start !== undefined) updates.start_datetime = start ? new Date(start) : null;
    if (end !== undefined) updates.end_datetime = end ? new Date(end) : null;
    if (allDay !== undefined) updates.all_day = parseBool(allDay) ? 1 : 0;
    if (status !== undefined) updates.status = status || 'SCHEDULED';
    updates.updated_at = new Date();
    if (Object.keys(updates).length === 1) return res.status(400).json({ message: 'No fields to update.' });
    const [result] = await db.query('UPDATE calendar_events SET ? WHERE id = ?', [updates, id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Event not found.' });
    const [rows] = await db.query('SELECT * FROM calendar_events WHERE id = ?', [id]);
    res.json(mapRow(rows[0]));
  } catch (e) {
    res.status(500).json({ message: 'Failed to update event.' });
  }
});

router.delete('/calendar-events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM calendar_events WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Event not found.' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete event.' });
  }
});

module.exports = router;
