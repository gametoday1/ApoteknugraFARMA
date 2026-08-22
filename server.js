const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

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

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'APOTEK-FINAL.html'));
});

// Endpoint Login yang toleran terhadap nama field frontend (bisa email atau username)
app.post('/login', (req, res) => {
    const emailOrUser = req.body.email || req.body.username || req.body.user;
    const password = req.body.password;
    
    if (!emailOrUser || !password) {
        return res.status(400).json({ success: false, message: "Email dan password wajib diisi!" });
    }

    const cleanInput = emailOrUser.trim().toLowerCase();
    const users = getUsers();
    
    const foundUser = users.find(u => 
        (u.email.toLowerCase() === cleanInput || u.username === cleanInput) && u.password === password
    );

    if (!foundUser) {
        return res.status(401).json({ success: false, message: "Akun tidak ditemukan atau password salah! Silakan register dulu." });
    }
    
    res.json({ success: true, message: "Login berhasil!", role: foundUser.role });
});

// Endpoint Register yang fleksibel
app.post('/register', (req, res) => {
    const emailOrUser = req.body.email || req.body.username || req.body.user;
    const password = req.body.password;
    
    if (!emailOrUser || !password) {
        return res.status(400).json({ success: false, message: "Email dan password wajib diisi!" });
    }

    const cleanInput = emailOrUser.trim().toLowerCase();
    const users = getUsers();
    
    const existing = users.find(u => u.email.toLowerCase() === cleanInput);
    if (existing) {
        return res.status(400).json({ success: false, message: "Akun sudah terdaftar, silakan login!" });
    }

    users.push({ email: cleanInput, username: cleanInput, password, role: 'owner' });
    saveUsers(users);
    
    res.json({ success: true, message: "Pendaftaran berhasil! Silakan login." });
});

app.listen(PORT, () => {
    console.log(`Server jalan di http://localhost:${PORT}`);
});