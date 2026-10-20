const teamButtons = document.querySelectorAll(".team");
const startBtn = document.getElementById("startBtn");
const bidBtn = document.getElementById("bidBtn");
const pauseBtn = document.getElementById("pauseBtn");
const bidDisplay = document.getElementById("current-bid");
const playerBox = document.getElementById("current-player");
const timerDisplay = document.getElementById("timer-display");

const squadBox = document.getElementById("squad-box");
const squadTitle = document.getElementById("squad-title");
const squadBudget = document.getElementById("squad-budget");
const squadPlayers = document.getElementById("squad-players");

let selectedTeam;
let currentPlayer;
let currentBid = 0;
let hasBid = false;
let isPaused = false;
let timeLeft = 5000;
let timerStartedAt;
let auctionTimer;
let countdown;

teamButtons.forEach(button => {
    button.addEventListener("click", () => {
        teamButtons.forEach(team => team.classList.remove("selected"));
        button.classList.add("selected");
        selectedTeam = button.dataset.team;
        startBtn.disabled = false;
        startBtn.textContent = `START AUCTION AS ${selectedTeam} →`;
    });
});

startBtn.addEventListener("click", () => {
    if (!selectedTeam) return;
    document.getElementById("team-selection").hidden = true;
    document.getElementById("auction-section").hidden = false;
    showNextPlayer();
});

async function showNextPlayer() {
    clearTimeout(auctionTimer);
    clearInterval(countdown);
    bidBtn.disabled = true;
    isPaused = false;
    pauseBtn.textContent = "⏸️";

    const response = await fetch("/next-player");
    const player = await response.json();

    if (player.message) {
        playerBox.innerHTML = "<h3>All players auctioned!</h3>";
        bidDisplay.textContent = "";
        timerDisplay.textContent = "";
        return;
    }

    currentPlayer = player;
    currentBid = Number(player.base_price);
    hasBid = false;
    bidDisplay.textContent = `Current Bid: ₹${currentBid.toFixed(2)} Cr ${selectedTeam}`;

    const photo = player.name.toLowerCase().replaceAll(" ", "-");
    playerBox.innerHTML = `
        <img src="/images/${photo}.png" alt="${player.name}" class="player-photo"
             onerror="this.style.display='none'">
        <h3>${player.name}</h3>
        <p>Role: ${player.role}</p>
        <p>Country: ${player.country}</p>
        <p>Base Price: ₹${player.base_price} Cr</p>
        <p id="player-status">Bidding...</p>`;

    bidBtn.disabled = false;
    startTimer();
}

function updateCountdown() {
    const seconds = Math.ceil((timeLeft - (Date.now() - timerStartedAt)) / 1000);
    timerDisplay.textContent = `${Math.max(seconds, 0)}s`;
}

function startTimer() {
    clearTimeout(auctionTimer);
    clearInterval(countdown);
    if (isPaused) return;

    timeLeft = 5000;
    timerStartedAt = Date.now();
    updateCountdown();
    countdown = setInterval(updateCountdown, 200);
    auctionTimer = setTimeout(finishBidding, timeLeft);
}

pauseBtn.addEventListener("click", () => {
    if (!currentPlayer || bidBtn.disabled && !isPaused) return;

    if (isPaused) {
        isPaused = false;
        timerStartedAt = Date.now();
        countdown = setInterval(updateCountdown, 200);
        auctionTimer = setTimeout(finishBidding, timeLeft);
        bidBtn.disabled = false;
        pauseBtn.textContent = "⏸️";
    } else {
        timeLeft = Math.max(timeLeft - (Date.now() - timerStartedAt), 0);
        clearTimeout(auctionTimer);
        clearInterval(countdown);
        isPaused = true;
        bidBtn.disabled = true;
        pauseBtn.textContent = "▶️";
        timerDisplay.textContent = `${Math.ceil(timeLeft / 1000)}s`;
    }
});

bidBtn.addEventListener("click", () => {
    if (!currentPlayer || bidBtn.disabled) return;
    currentBid += 0.20;
    hasBid = true;
    bidDisplay.textContent = `Current Bid: ₹${currentBid.toFixed(2)} Cr ${selectedTeam}`;
    startTimer();
});

async function finishBidding() {
    clearInterval(countdown);
    bidBtn.disabled = true;

    const response = hasBid
        ? await fetch("/sell-player", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId: currentPlayer.id, teamCode: selectedTeam, soldPrice: currentBid })
        })
        : await fetch(`/unsold/${currentPlayer.id}`, { method: "POST" });

    const status = document.getElementById("player-status");
    if (response.ok && hasBid) {
        status.textContent = `SOLD to ${selectedTeam} for ₹${currentBid.toFixed(2)} Cr`;
    } else if (response.ok) {
        status.textContent = "UNSOLD";
    } else {
        status.textContent = "Could not update this player";
    }

    setTimeout(showNextPlayer, 2000);
}

document.getElementById("viewSquadBtn").addEventListener("click", async () => {
    const response = await fetch(`/team-squad/${selectedTeam}`);
    if (!response.ok) return alert("Could not load team squad");

    const data = await response.json();
    squadTitle.textContent = `${data.teamCode} Squad`;
    squadBudget.textContent = `Remaining Purse: ₹${Number(data.budget).toFixed(2)} Cr`;
    squadPlayers.innerHTML = data.players.length
        ? data.players.map(player => `<p><strong>${player.name}</strong> — ${player.role} — ₹${Number(player.sold_price).toFixed(2)} Cr</p>`).join("")
        : "No players bought yet.";
    squadBox.hidden = false;
});

document.getElementById("closeSquadBtn").addEventListener("click", () => {
    squadBox.hidden = true;
});
