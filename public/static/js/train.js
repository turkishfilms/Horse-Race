//putting horse name in the title
let horseName;
fetch("/horseName")
  .then((response) => response.text())
  .then((name) => {
    horseName = name;
    document.getElementById("trainTitle").textContent = `Train ${name}`;
    console.log("yeah");
  });

const actions = {
  walked: {
    text: "Walk",
    sound: new Audio("assets/audio//horseRun.mp3"),
    stats: { weight: 1, balance: -1 },
  },
  fed: {
    text: "Feed",
    sound: new Audio("assets/audio//horseEat.mp3"),
    stats: { weight: -1, balance: 1 },
  },
  rested: {
    text: "Rest",
    sound: new Audio("assets/audio/horseSleep.mp3"),
    stats: { weight: -1, balance: -1 },
  },
};

const makeActionsIntoButtons = () => {
  for (let act in actions) {
    const action = actions[act];
    const button = document.createElement("button");
    button.id = action.text;
    button.textContent = action.text;
    button.addEventListener("click", () => changeStat(action.text));
    document.getElementById("trainOptions").appendChild(button);
  }
};

const trainedHistory = document.getElementById("trainedHistory");
const submitButton = document.getElementById("readyUp");
makeActionsIntoButtons();
const horseNeighAudio = new Audio("assets/audio/horseNeigh.mp3");

submitButton.addEventListener("click", () => readiedUp());

const savedStats = { balance: 0, weight: 0 };

function changeStat(stat) {
  //stat += 1; edit the class of the horse here to change stat based on parameter stat which receives walk, feed, and rest
  const statChanged = document.createElement("h2");
  statChanged.style.backgroundColor = "grey";
  statChanged.style.opacity = "0.9";
  statChanged.textContent = "You have " + stat + " your horse.";
  statChanged.style.borderBottom = "solid black 3px";

  for (let act in actions) {
    const action = actions[act];
    if (action.text == stat) {
      action.sound.play();
      for (let delta in action.stats) {
        savedStats[delta] += action.stats[delta];
      }
    }
  }

  trainedHistory.prepend(statChanged);
}

const readiedUp = () => {
  horseNeighAudio.play();
  //send stat updates to server
  //tell them we are ready
  fetch("/statsUp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: horseName, stats: savedStats }),
  })
    .then((response) => {
      return response.json();
    })
    .then((Rs) => {
      console.log("nice", Rs);
    });
};
