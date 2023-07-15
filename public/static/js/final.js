const socket = io();
socket.on("standings", ({ myHorseName, standings }) => {
  const winLossHeader = document.getElementById("winLossMessage");
  const podium = document.getElementById("podium");
  for (let horse in standings) {
    if (horse == myHorseName) {
      if (standings[horse] == 0) {
        winLossHeader.textContent = "You Win";
        document.title = "Winner Chicken Dinner";
      } else {
        winLossHeader.textContent = "You Lost";
        document.title = "Better Luck next Time";

        const myImage = document.getElementById("finalImage");
        myImage.src = "assets/graphics/s_horseHeadDead.png";
      }
    }
    const horseDiv = document.createElement("h2");
    horseDiv.textContent = `${horse} finished in position ${
      standings[horse] + 1
    }!`;
    podium.appendChild(horseDiv);
  }
});

socket.emit("getStandings");
