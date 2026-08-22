const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// File database JSON lokal (murni kosong/inisialisasi awal array kosong)
const dbFile = path.join(__dirname, 'users.json');

function getUsers() {
    if (!fs.existsSync(dbFile)) {
        fs.writeFileSync(dbFile, JSON.stringify([], null, 2));
    }
    return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
}

function saveUsers(users) {
    fs.writeFileSync(dbFile, JSON.stringify(users, null, 2));
}

// Route Utama Membuka Halaman Web
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'APOTEK-FINAL.html'));
});

// Endpoint Register: Wajib daftar dulu dari web
app.post('/register', (req, res) => {
    const { email, password, role } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email dan password wajib diisi!" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = getUsers();
    
    const existingUser = users.find(u => u.email === cleanEmail);
    if (existingUser) {
        return res.status(400).json({ success: false, message: "Email sudah terdaftar, silakan langsung login!" });
    }

    users.push({ email: cleanEmail, password, role: role || 'owner' });
    saveUsers(users);
    
    res.json({ success: true, message: "Pendaftaran berhasil! Silakan login." });
});

// Endpoint Login: Cek mutlak dari data yang sudah didaftarkan
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email dan password wajib diisi!" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = getUsers();
    
    const user = users.find(u => u.email === cleanEmail && u.password === password);
    if (!user) {
        return res.status(401).json({ success: false, message: "Email atau password salah, atau belum terdaftar!" });
    }
    
    res.json({ success: true, message: "Login berhasil!", role: user.role });
});

app.listen(PORT, () => {
    console.log(`Server jalan di http://localhost:${PORT}`);
});