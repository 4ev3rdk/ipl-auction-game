
const express = require("express");
const mysql = require("mysql2");


const app = express();
const PORT = 3000;


const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root@123",
    database: "ipl_auction"
});


db.connect((err) => {
    if (err) {
        console.log("Database connection failed:", err.message);
        return;
    }

    console.log("Connected to MySQL!");
});

db.query(`
    UPDATE players
    SET status = 'available',
        sold_to = NULL,
        sold_price = NULL
`);

db.query("UPDATE teams SET budget = 120.00");

console.log("Auction reset successfully!");

app.use(express.static("public"));
app.use(express.json());

// route to get a player 
app.get("/next-player", (req, res) => {
    db.query(
        "SELECT * FROM players WHERE status = 'available' ORDER BY RAND() LIMIT 1",
        (err, results) => { //callback function
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

//route for unsold player
app.post("/unsold/:id", (req, res) => {
    db.query(
        "UPDATE players SET status = 'unsold' WHERE id = ?",
        [req.params.id],
        (err) => {
            if (err) return res.status(500).send("Database update failed");
            res.send("Player marked unsold");
        }
    );
});

//route for sold player
app.post("/sell-player", (req, res) => {
    const { playerId, teamCode, soldPrice } = req.body;

    db.query(
        "SELECT budget FROM teams WHERE team_code = ?",
        [teamCode],
        (err, teams) => {
            if (err || teams.length === 0) {
                return res.status(400).send("Team not found");
            }

            if (Number(soldPrice) > Number(teams[0].budget)) {
                return res.status(400).send("Not enough budget");
            }

            db.query(
                "UPDATE players SET status = 'sold', sold_to = ?, sold_price = ? WHERE id = ? AND status = 'available'",
                [teamCode, soldPrice, playerId],
                (err, result) => {
                    if (err || result.affectedRows === 0) {
                        return res.status(400).send("Could not sell player");
                    }

                    db.query(
                        "UPDATE teams SET budget = budget - ? WHERE team_code = ?",
                        [soldPrice, teamCode],
                        (err) => {
                            if (err) {
                                return res.status(500).send("Budget update failed");
                            }

                            res.send("Player sold successfully");
                        }
                    );
                }
            );
        }
    );
});



app.get("/team-squad/:teamCode", (req, res) => {
    const teamCode = req.params.teamCode;

    db.query(
        `SELECT name, role, country, sold_price
         FROM players
         WHERE sold_to = ? AND status = 'sold'`,
        [teamCode],
        (err, players) => {
            if (err) {
                return res.status(500).send("Failed to fetch squad");
            }

            db.query(
                "SELECT budget FROM teams WHERE team_code = ?",
                [teamCode],
                (err, teams) => {
                    if (err || teams.length === 0) {
                        return res.status(500).send("Failed to fetch team budget");
                    }

                    res.json({ teamCode, budget: teams[0].budget, players });
                }
            );
        }
    );
});


// Start the server and listen on the specified port
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
