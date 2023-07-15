// import "./scripts/p5.min.js";

const giddyUpAudio = new Audio("./assets/audio/giddyUp.mp3");
const RED = { r: 255, g: 0, b: 0 };
const ALPHA = 25;
const IMAGEWIDTH = (IMAGEHEIGHT = 128);

const submitForm = (event) => {
  event.preventDefault();
  newHorse(
    numberToRGB(document.getElementById("colorChooser").value),
    document.getElementById("name").value
  );
  setTimeout(() => {
    window.location.href = "/train";
  }, 300);
};

const setColor = (p, degree) => {
  p.showHorse({ ...numberToRGB(degree), a: ALPHA });
};

const newHorse = (color, name) => {
  const socket = io();
  socket.emit("newHorse", { name: name, color: color || RED });
};

const numberToRGB = (number) => {
  let h = number / 360; //360 degress for hue rotate
  let s = 1,
    v = 1;
  let r, g, b, i, f, p, q, t;

  i = Math.floor(h * 6);
  f = h * 6 - i;
  p = v * (1 - s);
  q = v * (1 - f * s);
  t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      (r = v), (g = t), (b = p);
      break;
    case 1:
      (r = q), (g = v), (b = p);
      break;
    case 2:
      (r = p), (g = v), (b = t);
      break;
    case 3:
      (r = p), (g = q), (b = v);
      break;
    case 4:
      (r = t), (g = p), (b = v);
      break;
    case 5:
      (r = v), (g = p), (b = q);
      break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
};

window.onload = () => {
  document
    .getElementById("name")
    .addEventListener("click", () => giddyUpAudio.play());
  const colorChooser = document.getElementById("colorChooser");

  colorChooser.addEventListener("input", () =>
    setColor(my, colorChooser.value)
  );
};


const main = (p) => {
  p.clientHeight;
  p.clientWidth;
  p.horseHead;

  p.preload = () => {
    p.horseHead = p.loadImage(
      "/assets/graphics/s_horseHeadGS.png",
      () => console.log("Horse Head Image loaded fully!"),
      (err) => console.error("Error loading Horse Head image:", err)
    );
  };

  p.setup = () => {
    const div = document.getElementById("horseHead");
    const { clientWidth, clientHeight } = div;
    let cnv = p.createCanvas(clientWidth, clientHeight);
    cnv.parent("horseHead");
    p.background(255);
    p.showHorse({r:255,g:0,b:0,a:25})
  }; 

  p.addFilter = (img, { r, g, b, a }) => {
    img.loadPixels();
    for (let i = 0; i < img.width; i++) {
      for (let j = 0; j < img.height; j++) {
        let index = 4 * (j * img.width + i);
        let alpha = img.pixels[index + 3];
        let bright = (r + g + b) / 3;

        if (alpha !== 0) {
          // if pixel is not transparent
          img.pixels[index] += (r - bright) * (bright / 255); // Red
          img.pixels[index + 1] += (g - bright) * (bright / 255); // Green    ///get pixel, add color, subract brightness, increase contrast
          img.pixels[index + 2] += (b - bright) * (bright / 255); // Blue
          img.pixels[index + 3] += a; // Blue
        }
      }
      img.updatePixels()
    }
    return img
  };

  p.showHorse = (color) => {
    p.background(255); //white
    const pic = p.horseHead.get();
    p.addFilter(pic, color);
    p.image(pic, 0, 0, IMAGEWIDTH, IMAGEHEIGHT);
  };
};

const my = new p5(main);
window.my = my;
