const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Konfigurasi Database SQLite Lokal
const dbFile = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Gagal buka database:', err.message);
    } else {
        console.log('Terhubung ke database SQLite.');
    }
});

// Inisialisasi Tabel Users & Akun Default Owner
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        )
    `, () => {
        // Buat akun default otomatis jika belum ada
        db.get(`SELECT * FROM users WHERE email = ?`, ['admin@test.com'], (err, row) => {
            if (!row) {
                db.run(`INSERT INTO users (email, password, role) VALUES (?, ?, ?)`, 
                    ['admin@test.com', 'password123', 'owner']);
            }
        });
    });
});

// Route Utama (Membuka Aplikasi)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'APOTEK-FINAL.html'));
});

// Endpoint Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ? AND password = ?`, [email, password], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
        }
        if (!row) {
            return res.status(401).json({ success: false, message: "Email atau password salah!" });
        }
        res.json({ success: true, message: "Login berhasil!", role: row.role });
    });
});

// Endpoint Daftar Akun Baru (Register)
app.post('/register', (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email dan password wajib diisi!" });
    }
    
    db.run(`INSERT INTO users (email, password, role) VALUES (?, ?, ?)`, 
        [email, password, role || 'kasir'], 
        function(err) {
            if (err) {
                return res.status(400).json({ success: false, message: "Email sudah terdaftar!" });
            }
            res.json({ success: true, message: "Akun berhasil didaftarkan! Silakan login." });
        }
    );
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