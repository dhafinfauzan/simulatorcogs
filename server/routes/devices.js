import { Router } from 'express'
import db from '../db.js'
import { requireAuth, requireAdmin } from './auth.js'

const router = Router()

router.use(requireAuth)

// GET /api/devices — list all (with optional status filter)
router.get('/', (req, res) => {
  const { status, search } = req.query
  let sql = 'SELECT * FROM devices'
  const conditions = []
  const params = []

  if (status && status !== 'all') {
    conditions.push('LOWER(status) = LOWER(?)')
    params.push(status)
  }
  if (search) {
    conditions.push('(device_id LIKE ? OR device_name LIKE ?)')
    params.push(`%${search}%`, `%${search}%`)
  }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ')
  sql += ' ORDER BY created_at DESC'

  const rows = db.prepare(sql).all(...params)
  res.json(rows)
})

// GET /api/devices/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Device not found.' })
  res.json(row)
})

// POST /api/devices — admin only
router.post('/', requireAdmin, (req, res) => {
  const d = req.body
  if (!d.device_id || !d.device_name) {
    return res.status(400).json({ error: 'Device ID and Device Name are required.' })
  }
  try {
    const stmt = db.prepare(`
      INSERT INTO devices (
        device_id, device_name, status, cogs, cogs_mrc,
        otc_enabled, default_otc_price,
        mrc_enabled, default_daily_fee, default_daily_incentive,
        default_setup_fee, default_active_days, default_active_rate, default_program_period
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      d.device_id, d.device_name, d.status || 'Active', d.cogs || 0, d.cogs_mrc || d.cogs || 0,
      d.otc_enabled ? 1 : 0, d.default_otc_price || 0,
      d.mrc_enabled ? 1 : 0, d.default_daily_fee || 0, d.default_daily_incentive || 0,
      d.default_setup_fee || 0, d.default_active_days || 22, d.default_active_rate || 50, d.default_program_period || 12
    )
    res.status(201).json({ id: result.lastInsertRowid, message: 'Device added successfully.' })
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Device ID already exists.' })
    }
    res.status(500).json({ error: 'Failed to add device.' })
  }
})

// PUT /api/devices/:id — admin only
router.put('/:id', requireAdmin, (req, res) => {
  const d = req.body
  const existing = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Device not found.' })

  try {
    db.prepare(`
      UPDATE devices SET
        device_id = ?, device_name = ?, status = ?, cogs = ?, cogs_mrc = ?,
        otc_enabled = ?, default_otc_price = ?,
        mrc_enabled = ?, default_daily_fee = ?, default_daily_incentive = ?,
        default_setup_fee = ?, default_active_days = ?, default_active_rate = ?, default_program_period = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      d.device_id, d.device_name, d.status, d.cogs, d.cogs_mrc !== undefined ? d.cogs_mrc : d.cogs,
      d.otc_enabled ? 1 : 0, d.default_otc_price,
      d.mrc_enabled ? 1 : 0, d.default_daily_fee, d.default_daily_incentive,
      d.default_setup_fee || 0, d.default_active_days, d.default_active_rate, d.default_program_period,
      req.params.id
    )
    res.json({ message: 'Device berhasil diperbarui.' })
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Device ID is already in use.' })
    }
    res.status(500).json({ error: 'Failed to update device.' })
  }
})

// PATCH /api/devices/:id/toggle — activate/deactivate
router.patch('/:id/toggle', requireAdmin, (req, res) => {
  const row = db.prepare('SELECT status FROM devices WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Device not found.' })
  const newStatus = row.status === 'Active' ? 'Inactive' : 'Active'
  db.prepare('UPDATE devices SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(newStatus, req.params.id)
  res.json({ status: newStatus, message: `Device ${newStatus === 'Active' ? 'activated' : 'deactivated'}.` })
})

// DELETE /api/devices/:id — admin only
router.delete('/:id', requireAdmin, (req, res) => {
  const row = db.prepare('SELECT id FROM devices WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Device not found.' })
  db.prepare('DELETE FROM devices WHERE id = ?').run(req.params.id)
  res.json({ message: 'Device deleted.' })
})

export default router
