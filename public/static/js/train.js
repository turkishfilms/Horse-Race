const socket = io();

const savedStats = { balance: 10, weight: 10 };
const actions = {
  walked: {
    text: "Walk",
    sound: new Audio("assets/audio//horseRun.mp3"),
    stats: { weight: 0, balance: 1 },
  },
  fed: {
    text: "Feed",
    sound: new Audio("assets/audio//horseEat.mp3"),
    stats: { weight: 2, balance: -1 },
  },
  rested: {
    text: "Rest",
    sound: new Audio("assets/audio/horseSleep.mp3"),
    stats: { weight: 1, balance: 1 },
  },
  brushed: {
    text: "Brush",
    sound: new Audio("assets/audio/horseSleep.mp3"),
    stats: { weight: -1, balance: 2 },
  },
};

const LOBBY_IMG_WIDTH = 96;
const LOBBY_LEFT_OFFSET = 200;
const LOBBY_TEXT_HEIGHT = 80;
const ALPHA = 25;

let clientHorse = { color: 0, name: "horse" };
let playerAvatar
socket.on("returnHorseNameAndColor", ({ name, color }) => {
  clientHorse.name = name;
  clientHorse.color = color;
  document.getElementById("trainTitle").textContent = `Train ${name}`;

  playerAvatar = new p5(horseHead);
});

socket.emit("askForHorse");

socket.on("start", () => {
  window.location.href = "/race";
});

const makeActionsIntoButtons = (actions) => {
  for (let act in actions) {
    const action = actions[act];
    const button = document.createElement("button");
    button.id = action.text;
    button.textContent = action.text;
    button.addEventListener("click", () => handleStats(action.text));
    document.getElementById("trainOptions").appendChild(button);
  }
};

const makeShotgun = () => {
  const shotgun = document.getElementById("shotgun");

  shotgun.addEventListener("click", () => {
    const bullet = document.createElement("div");
    bullet.id = "bullet";
    document.body.append(bullet);
    playerAvatar.deadHorse();
    document.getElementById("profilePic").src =
      "assets/graphics/s_horseHeadDead.png";
      socket.emit('deleteHorse')
      window.location.href = "/"
  });
};

const makeActionCard = (stat) => {
  const trainedHistory = document.getElementById("trainedHistory");

  const statCard = document.createElement("h2");
  const styles = {
    backgroundColor: "grey",
    opacity: "0.9",
    borderBottom: "solid black 3px",
  };
  Object.keys(styles).forEach((style) => {
    statCard.style[style] = styles[style];
  });
  statCard.textContent = "You have " + stat + " your horse.";
  trainedHistory.prepend(statCard);
};

const statsDisplayObject = (stats) => {
  return {
    maxSpeed: { str: "Max Speed:  ", statDelta: stats.weight },
    weight: { str: "Weight:  ", statDelta: stats.weight },
    acceleration: { str: "Acceleration:  ", statDelta: -stats.weight },
    balance: { str: "Balance:  ", statDelta: stats.balance },
  };
};

function handleStats(stat) {
  const stats = statsDisplayObject(savedStats);
  makeActionCard(stat);
  updateSavedStats(stat);
  updateStatsDisplay(stats);
}

const updateSavedStats = (stat) => {
  for (let act in actions) {
    const action = actions[act];
    if (action.text !== stat) {
      continue;
    }
    action.sound.play();
    for (let delta in action.stats) {
      savedStats[delta] += action.stats[delta];
    }
  }
};

const updateStatsDisplay = (stats) => {
  Object.keys(stats).forEach((stat) => {
    console.log("update stats display: stat=> ", stat);
    document.getElementById(stat).textContent =
      stats[stat].str + stats[stat].statDelta;
  });
};

const readiedUp = () => {
  const horseNeighAudio = new Audio("assets/audio/horseNeigh.mp3");
  horseNeighAudio.play();
  socket.emit("ready", { stats: savedStats });
};

makeActionsIntoButtons(actions);
makeShotgun();
updateStatsDisplay(statsDisplayObject(savedStats));

//p5 stuff for the lobby
const lobbyPanel = (p5) => {
  p5.clientHeight;
  p5.clientWidth;
  p5.horseImg;
  p5.allHorseData = [];

  p5.preload = () => {
    p5.horseImg = p5.loadImage(
      "/assets/graphics/s_horseHeadGS.png",
      () => console.log("Image loaded fully!"),
      (err) => console.error("Error loading image:", err)
    );
  };

  p5.setup = () => {
    const div = document.getElementById("clientsBar");
    const { clientWidth, clientHeight } = div;
    p5.clientHeight = clientHeight;
    p5.clientWidth = clientWidth;
    p5.fill(0);

    let cnv = p5.createCanvas(p5.clientWidth, p5.clientHeight);
    cnv.parent("clientsBar");

    socket.on("updateLobby", (horses) => {
      console.log("updstaionglobby: horse=> ",horses)
      p5.allHorseData = []
      p5.updateHorseData(horses);
      p5.showHorses(p5.allHorseData)
    });
    socket.emit("joinLobby")
  };

  p5.updateHorseData = (data) => {
    for (let client in data) {
      const horseIndex = p5.allHorseData.findIndex(
        (horse) => horse.name === client
      )

      if (horseIndex === -1) {
        const newPic = p5.addFilter(p5.horseImg.get(), data[client].color);

        const newHorseData = {
          name: client,
          images: [p5.horseImg.get(), newPic],
          ready: data[client].ready,
        };
        p5.allHorseData.push(newHorseData);
      } else {
        p5.allHorseData[horseIndex].ready = data[client].ready;
      }
    }
  };

  p5.showHorses = (horses) => {
    p5.clear();
    let index = 0;
    for (let horse of horses) {
      p5.showHorse(horse, index);
      index++;
    }
  };

  p5.showHorse = (horse, index) => {
    p5.fill(0);
    const horseData = p5.allHorseData.find((h) => h.name === horse.name);
    const img = horseData.ready ? horseData.images[1] : horseData.images[0];
    p5.image(img, index * LOBBY_IMG_WIDTH + LOBBY_LEFT_OFFSET, 0);
    p5.text(
      horseData.name,
      index * LOBBY_IMG_WIDTH + LOBBY_LEFT_OFFSET,
      LOBBY_TEXT_HEIGHT
    );
  };

  p5.addFilter = (img, { r, g, b, a = ALPHA }) => {
    img.loadPixels();
    for (let i = 0; i < img.width; i++) {
      for (let j = 0; j < img.height; j++) {
        const index = 4 * (j * img.width + i);
        const alpha = img.pixels[index + 3];
        const bright = (r + g + b) / 3;
        if (alpha !== 0) {
          // if pixel is not transparent
          img.pixels[index] += (r - bright) * (bright / 255); // Red
          img.pixels[index + 1] += (g - bright) * (bright / 255); // Green    ///get pixel, add color, subract brightness, increase contrast
          img.pixels[index + 2] += (b - bright) * (bright / 255); // Blue
          img.pixels[index + 3] += a;
        }
      }
      img.updatePixels();
    }
    p5.image(img, r, 0);
    return img;
  };
};

const lobbySketch = new p5(lobbyPanel);

const horseHead = (p5) => {
  p5.preload = () => {
    p5.horseHeadImg = p5.loadImage(
      "/assets/graphics/s_horseHeadGS.png",
      () => console.log("Grey Scale Horse Head Image loaded fully!"),
      (err) => console.error("Error loading Grey Scale Horse Head Image:", err)
    );
  };

  p5.setup = () => {
    const div = document.getElementById("profilePic2");
    const { clientWidth, clientHeight } = div;
    p5.clientHeight = clientHeight;
    p5.clientWidth = clientWidth;
    let cnv = p5.createCanvas(p5.clientWidth, p5.clientHeight);
    cnv.parent("profilePic2");

    p5.image(
      p5.addFilter(p5.horseHeadImg, clientHorse.color),
      0,
      0,
      p5.horseHeadImg.width * 2,
      p5.horseHeadImg.height * 2
    );
  };

  p5.addFilter = (img, { r, g, b, a = ALPHA }) => {
    img.loadPixels();
    for (let i = 0; i < img.width; i++) {
      for (let j = 0; j < img.height; j++) {
        const index = 4 * (j * img.width + i);
        const alpha = img.pixels[index + 3];
        const bright = (r + g + b) / 3;
        if (alpha !== 0) {
          // if pixel is not transparent
          img.pixels[index] += (r - bright) * (bright / 255); // Red
          img.pixels[index + 1] += (g - bright) * (bright / 255); // Green    ///get pixel, add color, subract brightness, increase contrast
          img.pixels[index + 2] += (b - bright) * (bright / 255); // Blue
          img.pixels[index + 3] += a;
        }
      }
      img.updatePixels();
    }
    return img;
  };

  p5.deadHorse = () => {
    p5.clear();
  };
};
