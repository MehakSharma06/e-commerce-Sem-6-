const mysql = require("mysql2");

// Database name
const dbName = "toy_store";

// Create an initial connection to MySQL (without a database)
const connection = mysql.createConnection({
    host: "localhost",
    user: "root", // Change if your MySQL username is different
    password: "Mehak@08", // Change if you set a password
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Connect to MySQL and create the database if it doesn't exist
connection.connect((err) => {
    if (err) {
        console.error("Error connecting to MySQL: " + err.message);
        return;
    }
    console.log("Connected to MySQL!");

    connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`, (err) => {
        if (err) {
            console.error("Error creating database: " + err.message);
            return;
        }
        console.log(`Database ${dbName} is ready!`);

        // Close the initial connection after database creation
        connection.end((err) => {
            if (err) console.error("Error closing initial connection: " + err.message);
        });
    });
});

// Create a new connection with the specified database
const dbConnection = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "Mehak@08",
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10, // Allow up to 10 concurrent connections
    queueLimit: 0
});

// Export the connection pool
module.exports = dbConnection.promise();
