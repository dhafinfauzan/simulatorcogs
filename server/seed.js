// Seed script — run with: npm run seed
import db from './db.js'

const seedUsers = db.prepare('INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)')
seedUsers.run('admin', 'admin123', 'admin')
seedUsers.run('user', 'user123', 'user')

db.prepare('DELETE FROM devices').run()

const insertDevice = db.prepare(`
  INSERT INTO devices (
    device_id, device_name, status, cogs, cogs_mrc,
    otc_enabled, default_otc_price,
    mrc_enabled, default_daily_fee, default_daily_incentive,
    default_active_days, default_active_rate, default_program_period
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

// COGS = Cash/OTC scheme, cogs_mrc = Credit/MRC scheme (from Excel Device sheet R37 vs R82)
insertDevice.run('5M', 'Device 5M', 'Active', 200000, 200000, 1, 225000, 1, 1500, 500, 22, 50, 12)
insertDevice.run('QS6', 'Soundbox QS6', 'Active', 323441, 383441, 1, 375000, 1, 2000, 700, 22, 50, 12)
insertDevice.run('QS5M', 'Soundbox QS5M', 'Active', 319200, 379200, 1, 350000, 1, 1800, 600, 22, 50, 12)
insertDevice.run('QS2', 'Soundbox QS2', 'Active', 318203, 493203, 1, 475000, 1, 2700, 900, 22, 50, 12)
insertDevice.run('QS3D', 'Soundbox QS3D', 'Active', 446250, 566250, 1, 599000, 1, 3000, 1000, 22, 50, 12)
insertDevice.run('P5K', 'EDC P5K 8GB', 'Active', 1268438, 1628438, 1, 1750000, 1, 8000, 2700, 22, 50, 12)
insertDevice.run('P5SE', 'EDC P5SE', 'Active', 1631438, 2051438, 1, 2250000, 1, 11000, 3700, 22, 50, 12)
insertDevice.run('Q3 MINI', 'EDC Q3 Mini', 'Active', 959888, 1259888, 1, 1499000, 1, 6800, 2300, 22, 50, 12)
insertDevice.run('Q3', 'EDC Q3', 'Active', 1685888, 2082675, 1, 2399000, 1, 11000, 3700, 22, 50, 12)
insertDevice.run('Q2', 'EDC Q2', 'Active', 2266688, 2746688, 1, 2850000, 1, 13600, 4500, 22, 50, 12)

console.log('Seed complete! 10 devices with dual COGS (OTC/MRC).')
