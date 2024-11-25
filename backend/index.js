require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const { body, validationResult } = require("express-validator"); // Deklarasi hanya sekali

// Inisialisasi aplikasi
const app = express();
const cors = require("cors");

const port = 3000;

// Konfigurasi CORS
app.use(
  cors({
    origin: process.env.FRONTEND, // Ganti dengan domain frontend Anda
    methods: ["GET", "POST", "PUT", "DELETE"], // Sesuaikan metode yang diperlukan
    credentials: true, // Jika menggunakan cookie atau sesi
  })
);

// Konfigurasi koneksi ke MySQL menggunakan environment variables
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Cek koneksi ke MySQL
db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    process.exit(1); // Keluar jika gagal terhubung
  }
  console.log("Connected to MySQL database");
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Endpoint untuk membuat produk baru (POST)
app.post(
  "/api/products",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ max: 255 })
      .withMessage("Name must not exceed 255 characters"),
    body("description")
      .trim()
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Description must not exceed 1000 characters"),
    body("price")
      .notEmpty()
      .withMessage("Price is required")
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),
    body("stock")
      .notEmpty()
      .withMessage("Stock is required")
      .isInt({ min: 0 })
      .withMessage("Stock must be a non-negative integer"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, stock } = req.body;
    const query =
      "INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)";
    db.query(query, [name, description, price, stock], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      res.status(201).json({
        message: "Product created",
        productId: result.insertId,
      });
    });
  }
);

// Endpoint untuk membaca semua produk (GET)
app.get("/api/products", (req, res) => {
  const query = "SELECT * FROM products";
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json(results);
  });
});

// Endpoint untuk memperbarui produk (PUT)
app.put(
  "/api/products/:id",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ max: 255 })
      .withMessage("Name must not exceed 255 characters"),
    body("description")
      .trim()
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Description must not exceed 1000 characters"),
    body("price")
      .notEmpty()
      .withMessage("Price is required")
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),
    body("stock")
      .notEmpty()
      .withMessage("Stock is required")
      .isInt({ min: 0 })
      .withMessage("Stock must be a non-negative integer"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price } = req.body;
    const query =
      "UPDATE products SET name = ?, description = ?, price = ? WHERE id = ?";
    db.query(
      query,
      [name, description, price, req.params.id],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Internal Server Error" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Product not found" });
        }

        res.json({ message: "Product updated" });
      }
    );
  }
);

// Endpoint untuk menghapus produk (DELETE)
app.delete("/api/products/:id", (req, res) => {
  const query = "DELETE FROM products WHERE id = ?";
  db.query(query, [req.params.id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product deleted" });
  });
});

// Menjalankan server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
