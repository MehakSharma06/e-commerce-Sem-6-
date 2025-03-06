const express = require("express");
const router = express.Router();
const connection = require("../connection"); // Assuming this is the connection with mysql2's promise API

// GET route to fetch all products
router.get("/", async (req, res) => {
  const { age } = req.query;  // Accept 'age' as a query parameter

  if (!age) {
    return res.status(400).json({ error: "Age parameter is required." });
  }

  try {
    // Query to fetch products where the user's age falls within the product's age range
    const query = `
      SELECT * FROM products 
      WHERE age_start <= ? AND age_end >= ?;
    `;
    
    const [results] = await connection.query(query, [age, age]);
    
    if (results.length === 0) {
      return res.status(404).json({ message: "No products found for the given age." });
    }

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: "SQL Error", details: err.message });
  }
});

// Function to check and create the table if it doesn't exist
const checkAndCreateProductsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(255) NOT NULL,
      age_start INT NOT NULL,
      age_end INT NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      status ENUM('available', 'unavailable') NOT NULL DEFAULT 'available'
    );
  `;

  try {
    await connection.query(createTableQuery);
    console.log("Checked and ensured products table exists.");
  } catch (err) {
    console.error("Error creating the products table:", err);
  }
};

// Check and create table on app start
checkAndCreateProductsTable();

// POST route to add a new product
router.post("/", async (req, res) => {
  const { name, category, age_start, age_end, price, status } = req.body;

  // Check if all required fields are provided
  if (!name || !category || age_start === undefined || age_end === undefined || price === undefined || status === undefined) {
    return res.status(400).json({ error: "All fields (name, category, age start, age end, price, status) are required." });
  }

  // SQL query to insert a new product into the products table
  const query = "INSERT INTO products (name, category, age_start, age_end, price, status) VALUES (?, ?, ?, ?, ?, ?)";

  try {
    const [results] = await connection.query(query, [name, category, age_start, age_end, price, status]);
    res.status(201).json({ message: "Product added successfully", productId: results.insertId });
  } catch (err) {
    res.status(500).json({ error: "SQL Error", details: err.message });
  }
});

// PUT route to update product details
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, category, age_start, age_end, price, status } = req.body;

  if (!name && !category && !age_start && !age_end && !price && !status) {
    return res.status(400).json({ error: "At least one field is required to update." });
  }

  const updates = [];
  const queryParams = [];

  if (name) {
    updates.push("name = ?");
    queryParams.push(name);
  }
  if (category) {
    updates.push("category = ?");
    queryParams.push(category);
  }
  if (age_start !== undefined) {
    updates.push("age_start = ?");
    queryParams.push(age_start);
  }
  if (age_end !== undefined) {
    updates.push("age_end = ?");
    queryParams.push(age_end);
  }
  if (price !== undefined) {
    updates.push("price = ?");
    queryParams.push(price);
  }
  if (status) {
    updates.push("status = ?");
    queryParams.push(status);
  }

  const updateQuery = `
    UPDATE products
    SET ${updates.join(", ")}
    WHERE id = ?;
  `;
  
  queryParams.push(id);

  try {
    const [results] = await connection.query(updateQuery, queryParams);

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.status(200).json({ message: "Product updated successfully." });
  } catch (err) {
    res.status(500).json({ error: "SQL Error", details: err.message });
  }
});

// DELETE route to delete a product by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const deleteQuery = "DELETE FROM products WHERE id = ?";

  try {
    const [results] = await connection.query(deleteQuery, [id]);

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.status(200).json({ message: "Product deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "SQL Error", details: err.message });
  }
});

module.exports = router;
