const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
const jwt = require("jsonwebtoken")
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET || 'mieayam';

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'databases_api'
});

db.connect((err) => {
  if (err) console.log('❌ Koneksi gagal:', err);
  else console.log('✅ Terhubung ke MySQL');
});

/// LOGIN
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';

  db.query(sql, [username, password], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }

    if (result.length > 0) {
        const user = result[0];
        const token = jwt.sign(
          { id: user.id, username: user.username, email: user.email },
          SECRET_KEY,
          { expiresIn: '1h' }
        );

        return res.json({
          success: true,
          message: 'Login berhasil',
          token,
          user: { id: user.id, username: user.username, email: user.email }
        });
    } else {
      return res.json({ success: false, message: 'Username atau password salah' });
    }
  });
});



function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const token = bearerHeader.split(" ")[1];
    jwt.verify(token, SECRET_KEY, (err, authData) => {
      if (err) return res.status(403).json({ message: "Token tidak valid!" });
      req.user = authData;
      next();
    });
  } else {
    res.status(403).json({ message: "Token tidak ditemukan!" });
  }
}

// GET data
app.get('/data', (req, res) => {
  const sql = 'SELECT * FROM produk';
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: 'Gagal ambil data', error: err });
    res.json(result);
  });
});

// POST tambah produk
app.post('/tambah', (req, res) => {
  const { nama, harga, stok } = req.body;
  const sql = 'INSERT INTO produk (nama, harga, stok) VALUES (?, ?, ?)';
  db.query(sql, [nama, harga, stok], (err) => {
    if (err) return res.status(500).json({ message: 'Gagal tambah data', error: err });
    res.json({ success: true, message: 'Data berhasil ditambah' });
  });
});

// PUT edit produk
app.put('/edit/:id', (req, res) => {
  const { id } = req.params;
  const { nama, harga, stok } = req.body;
  const sql = 'UPDATE produk SET nama=?, harga=?, stok=? WHERE id=?';
  db.query(sql, [nama, harga, stok, id], (err) => {
    if (err) return res.status(500).json({ message: 'Gagal update', error: err });
    res.json({ success: true, message: 'Data berhasil diubah' });
  });
});

// DELETE produk
app.delete('/hapus/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM produk WHERE id=?';
  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ message: 'Gagal hapus data', error: err });
    res.json({ success: true, message: 'Data berhasil dihapus' });
  });
});

app.listen(3000, () => console.log('🚀 Server berjalan di http://localhost:3000'));