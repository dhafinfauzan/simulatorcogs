// Seed script — run with: npm run seed
// COGS (modal beli) disimpan dalam USD. Field lain (harga jual, fee) tetap IDR.
// Konversi COGS USD→IDR terjadi di client via kurs settings (usd_rate).
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
    default_setup_fee, default_active_days, default_active_rate, default_program_period,
    price_tiers
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

// cogs & cogs_mrc dalam USD (legacy IDR ÷ 16000). Sisanya IDR apa adanya.
// Q2 cogs = $120/pc (berlaku min. beli 24 pcs → lihat price_tiers).
const U = 16000
insertDevice.run('5M', 'Device 5M', 'Active', 200000/U, 200000/U, 1, 225000, 1, 1500, 500, 0, 22, 50, 12, '[]')
insertDevice.run('QS6', 'Soundbox QS6', 'Active', 323441/U, 383441/U, 1, 375000, 1, 2000, 700, 0, 22, 50, 12, '[]')
insertDevice.run('QS5M', 'Soundbox QS5M', 'Active', 319200/U, 379200/U, 1, 350000, 1, 1800, 600, 0, 22, 50, 12, '[]')
insertDevice.run('QS2', 'Soundbox QS2', 'Active', 318203/U, 493203/U, 1, 475000, 1, 2700, 900, 0, 22, 50, 12, '[]')
insertDevice.run('QS3D', 'Soundbox QS3D', 'Active', 446250/U, 566250/U, 1, 599000, 1, 3000, 1000, 0, 22, 50, 12, '[]')
insertDevice.run('P5K', 'EDC P5K 8GB', 'Active', 1268438/U, 1628438/U, 1, 1750000, 1, 8000, 2700, 0, 22, 50, 12, '[]')
insertDevice.run('P5SE', 'EDC P5SE', 'Active', 1631438/U, 2051438/U, 1, 2250000, 1, 11000, 3700, 0, 22, 50, 12, '[]')
insertDevice.run('Q3 MINI', 'EDC Q3 Mini', 'Active', 959888/U, 1259888/U, 1, 1499000, 1, 6800, 2300, 0, 22, 50, 12, '[]')
insertDevice.run('Q3', 'EDC Q3', 'Active', 1685888/U, 2082675/U, 1, 2399000, 1, 11000, 3700, 0, 22, 50, 12, '[]')
insertDevice.run('Q2', 'EDC Q2', 'Active', 120, 2746688/U, 1, 2850000, 1, 13600, 4500, 0, 22, 50, 12,
  JSON.stringify([{ min_qty: 24, price: 120 }]))

console.log('Seed complete! 10 devices (COGS in USD, rest IDR).')
