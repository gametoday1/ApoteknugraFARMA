const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Konfigurasi Database PostgreSQL (Bisa diganti URL Supabase nanti saat online)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'ISI_URL_DARI_SUPABASE_DI_SINI',
    ssl: { rejectUnauthorized: false }
});

// Inisialisasi Tabel Database Otomatis
async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL
            );
        `);
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS active_sessions (
                id SERIAL PRIMARY KEY,
                email TEXT,
                device_id TEXT,
                login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Akun Default
        await pool.query(`
            INSERT INTO users (email, password, role) 
            VALUES ('admin@test.com', 'password123', 'owner') 
            ON CONFLICT (email) DO NOTHING;
        `);
        
        console.log('Database berhasil terhubung & siap!');
    } catch (err) {
        console.error('Gagal inisialisasi database:', err.message);
    }
}
initDB();

// Route Utama Membuka Aplikasi
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'APOTEK-FINAL.html'));
});

// Endpoint Login (Validasi Email)
app.post('/login', async (req, res) => {
    const { email, password, deviceId } = req.body;
    try {
        const userRes = await pool.query(`SELECT * FROM users WHERE email = $1 AND password = $2`, [email, password]);
        if (userRes.rows.length === 0) {
            return res.status(401).json({ success: false, message: "Email atau password salah!" });
        }
        const user = userRes.rows[0];

        const sessionRes = await pool.query(`SELECT * FROM active_sessions`);
        const sessions = sessionRes.rows;
        const existingDevice = sessions.find(s => s.device_id === deviceId);

        if (!existingDevice) {
            if (sessions.length >= 2) {
                return res.status(403).json({ 
                    success: false, 
                    message: "Akses ditolak! Batas maksimal 2 perangkat aktif." 
                });
            }
            await pool.query(`INSERT INTO active_sessions (email, device_id) VALUES ($1, $2)`, [email, deviceId]);
        }

        res.json({ success: true, message: "Login berhasil!", role: user.role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint Logout
app.post('/logout', async (req, res) => {
    const { deviceId } = req.body;
    try {
        await pool.query(`DELETE FROM active_sessions WHERE device_id = $1`, [deviceId]);
        res.json({ success: true, message: "Berhasil logout." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Tambah Pengguna Baru
app.post('/tambah-user', async (req, res) => {
    const { email, password, role } = req.body;
    try {
        await pool.query(`INSERT INTO users (email, password, role) VALUES ($1, $2, $3)`, [email, password, role]);
        res.json({ success: true, message: "Akun berhasil ditambahkan!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Email sudah terdaftar!" });
    }
});

// Endpoint Kirim Email Laporan
app.post('/kirim-laporan-email', async (req, res) => {
    const { emailTujuan } = req.body;
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'emailkamu@gmail.com',
            pass: 'password_aplikasi_gmail'
        }
    });

    try {
        await transporter.sendMail({
            from: 'emailkamu@gmail.com',
            to: emailTujuan,
            subject: '📊 Laporan Otomatis Bulanan - Apotek Nugrah Farma',
            text: 'Halo Owner, berikut rekap otomatis bulanan sistem apotek.'
        });
        res.json({ success: true, message: "Laporan berhasil dikirim ke email!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal mengirim email." });
    }
});

app.listen(PORT, () => {
    console.log(`Server jalan di http://localhost:${PORT}`);
});