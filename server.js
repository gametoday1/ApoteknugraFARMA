const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Database Sementara di Memori (Aman, Tanpa Crash, Tanpa File Eksternal)
let usersList = [
    { email: 'admin@test.com', password: 'password123', role: 'owner' }
];

// Route Utama Membuka Aplikasi
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'APOTEK-FINAL.html'));
});

// Endpoint Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = usersList.find(u => u.email === email && u.password === password);
    
    if (!user) {
        return res.status(401).json({ success: false, message: "Email atau password salah!" });
    }
    res.json({ success: true, message: "Login berhasil!", role: user.role });
});

// Endpoint Register Akun Baru
app.post('/register', (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email dan password wajib diisi!" });
    }

    const existingUser = usersList.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ success: false, message: "Email sudah terdaftar!" });
    }

    usersList.push({ email, password, role: role || 'kasir' });
    res.json({ success: true, message: "Akun berhasil didaftarkan! Silakan login." });
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