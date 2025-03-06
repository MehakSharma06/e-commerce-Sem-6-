const express = require("express");
const router = express.Router();
const dbConnection = require("../connection"); // Import the database connection
const crypto = require("crypto");
const nodemailer = require("nodemailer");

let otpStore = {};  // Temporary storage for OTPs (in a real app, you'd want a more permanent solution)

// Setup nodemailer for email sending
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',      // Use Gmail's SMTP server
  port: 465,                   // Secure port for SSL
  secure: true,                // Use SSL
  auth: {
    user: '9020recordskalra@gmail.com',  // Sender's email address
    pass: 'vfjpnzcnottebxff',           // App password or regular Gmail password
  },
  connectionTimeout: 10000,  // Timeout after 10 seconds if connection is not established
});


// Function to create the users table if it doesn't exist
 async function createUsersTable() {
    try {
        await dbConnection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                address TEXT,
                age INT,
                password VARCHAR(255) NOT NULL,
                usertype VARCHAR(50) NOT NULL DEFAULT 'user' 
            )
        `);
        console.log("Users table is ready!");
    } catch (err) {
        console.error("Error creating table:", err);
    }
}

// Call the function to create the table
createUsersTable();

// ✅ Register API - Inserts user data into the database
router.post("/register", async (req, res) => {
    const { name, phone, email, address, age, password, confirmPassword, usertype } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match" });
    }

    try {
        const [result] = await dbConnection.query(
            "INSERT INTO users (name, phone, email, address, age, password, usertype) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [name, phone, email, address, age, password, usertype || 'user'] // Default to 'user' if no usertype is provided
        );
        res.status(201).json({ message: "User registered successfully", userId: result.insertId });
    } catch (err) {
        console.error("Error registering user:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// ✅ Login API - Checks email and password
router.post("/user-login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await dbConnection.query(
            "SELECT * FROM users WHERE email = ? AND password = ? AND usertype = 'user'",
            [email, password]
        );

        if (users.length > 0) {
            res.status(200).json({ message: "User login successful", userDetails: users[0] });
        } else {
            res.status(401).json({ error: "Invalid email, password." });
        }
    } catch (err) {
        console.error("Error during user login:", err);
        res.status(500).json({ error: "Database error" });
    }
});

router.post("/admin-login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await dbConnection.query(
            "SELECT * FROM users WHERE email = ? AND password = ? AND usertype = 'admin'",
            [email, password]
        );

        if (users.length > 0) {
            res.status(200).json({ message: "Admin login successful", userDetails: users[0] });
        } else {
            res.status(401).json({ error: "Invalid email, password, or user type. Admins only." });
        }
    } catch (err) {
        console.error("Error during admin login:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// ✅ Forgot Password API - Request an OTP for resetting password
router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;

    try {
        // Check if the email exists in the database
        const [user] = await dbConnection.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (user.length > 0) {
            // Generate OTP
            const otp = crypto.randomInt(100000, 999999).toString();
            otpStore[email] = otp;  // Store the OTP temporarily (you might want to set a timeout to expire it)

            // Send OTP to the user's email
            const mailOptions = {
                from: 'your-email@gmail.com', // Replace with your email
                to: email,
                subject: 'Password Reset OTP',
                text: `Your OTP for password reset is ${otp}. It is valid for 10 minutes.`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return res.status(500).json({ error: "Error sending OTP email" });
                }
                res.status(200).json({ message: "OTP sent successfully" });
            });
        } else {
            res.status(404).json({ error: "Email not found" });
        }
    } catch (err) {
        console.error("Error during forgot password:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// ✅ Verify OTP and Reset Password API
router.post("/verify-otp", async (req, res) => {
    const { email, otp, newPassword, confirmPassword } = req.body;

    // Validate OTP
    if (otpStore[email] !== otp) {
        return res.status(400).json({ error: "Invalid OTP" });
    }

    // Check if the passwords match
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match" });
    }

    try {
        // Update the password in the database
        const [result] = await dbConnection.query(
            "UPDATE users SET password = ? WHERE email = ?",
            [newPassword, email]
        );

        if (result.affectedRows > 0) {
            res.status(200).json({ message: "Password updated successfully" });
        } else {
            res.status(400).json({ error: "Error updating password" });
        }
    } catch (err) {
        console.error("Error during password reset:", err);
        res.status(500).json({ error: "Database error" });
    }
});
// ✅ Get All Users API
router.get("/all-users", async (req, res) => {
    try {
        const [users] = await dbConnection.query("SELECT * FROM users");
        res.status(200).json(users);
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ error: "Database error" });
    }
});

module.exports = router;
