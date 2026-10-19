
const teamButtons = document.querySelectorAll(".team");
const startBtn = document.getElementById("startBtn");

let selectedTeam = null;

teamButtons.forEach(button => {
    button.addEventListener("click", () => {
        //first we will remove the selected 
        teamButtons.forEach(team => team.classList.remove("selected"));
        //then add classlist to whicher is clicked
        //button.classList.add("selected");
        selectedTeam = button.dataset.team;  //select values from html

        startBtn.disabled = false;
        startBtn.textContent = `START AUCTION AS ${selectedTeam} →`;
    });
});


startBtn.addEventListener("click", async () => {
    if (!selectedTeam) return;

    // Hide team selection and show auction
    document.getElementById("team-selection").hidden = true;
    document.getElementById("auction-section").hidden = false;

    // Function to display the next player
    async function showNextPlayer() {

        // Get a random player from the backend
        const response = await fetch("/next-player");
        const player = await response.json();

        // Stop if no players are left
        if (player.message === "No players left") {
            document.getElementById("current-player").innerHTML =
                "<h3>All players auctioned!</h3>";
            return;
        }

        // Display the player's details
        document.getElementById("current-player").innerHTML = `
            <h3>${player.name}</h3>
            <p>Role: ${player.role}</p>
            <p>Country: ${player.country}</p>
            <p>Base Price: ₹${player.base_price} Cr</p>
            <p id="player-status">Bidding...</p>
        `;

        // Wait 5 seconds before marking the player unsold
        setTimeout(async () => {
            await fetch(`/unsold/${player.id}`, { method: "POST" });

            // Show the unsold status
            document.getElementById("player-status").textContent = "UNSOLD";

            // Wait 1 more second, then show the next player
            setTimeout(showNextPlayer, 1000);
        }, 5000);
    }

    // Start the auction
    showNextPlayer();
});


// Fetch players from the backend
fetch("/players")
    .then(response => response.json())
    .then(players => {
        const playersList = document.getElementById("players-list");

        players.forEach(player => {
            const playerCard = document.createElement("div");

            playerCard.innerHTML = `
                <h3>${player.name}</h3>
                <p>Role: ${player.role}</p>
                <p>Country: ${player.country}</p>
                <p>Base Price: ₹${player.base_price} Cr</p>
                <p>Rating: ${player.rating}</p>
            `;

            playersList.appendChild(playerCard);
        });
    })
    .catch(error => console.error("Error fetching players:", error));