
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

startBtn.addEventListener("click", () => {
    if (!selectedTeam) return;

    alert(`Welcome, ${selectedTeam}! Your auction journey begins soon.`);
});
