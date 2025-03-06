const express = require("express");
const bodyParser = require("body-parser");
const connection = require("./connection");

// Import Routes
// const categoryRoutes = require("./routes/category");
// const subcategoryRoutes = require("./routes/subcategory");
const productRoutes = require("./routes/product");
const userRoutes = require("./routes/user");
// const orderRoutes = require("./routes/order");
// const paymentRoutes = require("./routes/payment");

const app = express();
app.use(bodyParser.json()); // Middleware to parse JSON

// Routes
// app.use("/api/category", categoryRoutes);
// app.use("/api/subcategory", subcategoryRoutes);
app.use("/api/product", productRoutes);
app.use("/api/user", userRoutes);
// app.use("/api/order", orderRoutes);
// app.use("/api/payment", paymentRoutes);

app.get("/", (req, res) => {
    res.send("<h1>Toy Store API</h1>");
});


// Start Server
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
