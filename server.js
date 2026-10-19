
const express = require("express");
const mysql = require("mysql2");

// Create the Express application
const app = express();
const PORT = 3000;

// Database connection settings
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root@123",
    database: "ipl_auction"
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.log("Database connection failed:", err.message);
        return; // Stop this function if connection fails
    }

    console.log("Connected to MySQL!");
});

// Allow the browser to access html,css and js file
app.use(express.static("public"));

// API route: return all players from the database
// app.get("/players", (req, res) => {
//     // Execute an SQL query
//     db.query("SELECT * FROM players", (err, results) => {
//         if (err) {
//             // Send an error response if the query fails
//             return res.status(500).send("Database query failed");
//         }

//         // Send the player records as JSON
//         res.json(results);
//     });  
// });

// Get one random available player for the auction
app.get("/next-player", (req, res) => {
    db.query(
        "SELECT * FROM players WHERE status = 'available' ORDER BY RAND() LIMIT 1",
        (err, results) => {
            if (err) {
                return res.status(500).send("Database query failed");
            }

            if (results.length === 0) {
                return res.json({ message: "No players left" });
            }

            res.json(results[0]);
        }
    );
});


// Route to mark a player as unsold
app.post("/unsold/:id", (req, res) => {

    // Update the player's status in the database
    db.query(
        "UPDATE players SET status = 'unsold' WHERE id = ?",
        [req.params.id],

        (err) => {
            // Send an error if the database update fails
            if (err) {
                return res.status(500).send("Database update failed");
            }

            // Confirm that the player is marked unsold
            res.send("Player marked unsold");
        }
    );
});



// Place above app.listen()

// Route to place a bid
app.post("/bid", express.json(), (req, res) => {
    const { playerId, teamCode, bidAmount } = req.body;

    // Check the team's remaining budget
    db.query(
        "SELECT budget FROM teams WHERE team_code = ?",
        [teamCode],
        (err, teams) => {
            if (err || teams.length === 0) {
                return res.status(400).send("Team not found");
            }

            if (bidAmount > teams[0].budget) {
                return res.status(400).send("Not enough budget");
            }

            // Accept the bid
            res.json({ message: "Bid accepted", bidAmount });
        }
    );
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
