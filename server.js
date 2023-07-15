import express from "express";
import cors from "cors";
import { join } from "path";
import { Server } from "socket.io";
import session from "express-session";
import sharedsession from "express-socket.io-session";
import router from "./routes.js";
import {
  handleFinale,
  handleLobbyJoin,
  handleOver,
  handleClients,
  handleNewHorse,
  handleAskForHorse,
  handleNewStats,
  handleReady,
  handleFrame,
  handleDisconnect,
  getLobbyData,
} from "./socketHandlers.js";
import { MESSAGES, RACE_CONFIG } from "./constants.js";

const app = express(),
  port = process.env.PORT || 3007;

const sessionMiddleware = session({
  secret: "changeit",
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: RACE_CONFIG.ONE_HOUR_IN_MILLISECONDS,
    secure: false, // true for http eeebsbs
    httpOnly: false, // if true prevents client side JS from reading the cookie
    sameSite: "lax", // protection against cross site request forgery attacks
  },
});

app.use(sessionMiddleware);
app.use(express.json());
app.use(cors());
app.use(express.static(join(process.cwd(), "public")));

let clients = {};

const clearEmptyClients = () => {
  for (let client in clients) {
    if (Object.keys(clients[client]).length === 0) {
      delete clients[client];
    }
  }
};

app.use("/", router);

const server = app.listen(port, () => console.log("Horses are racing " + port));

const io = new Server(server);
io.use(sharedsession(sessionMiddleware, { autoSave: true }));

io.on("connection", (socket) => {
  const clientKey = socket.handshake.session.id;
  clients[clientKey] = clients[clientKey] || {}; //FIXME: add supprt for arrays and stuff this need to be more thougtul

  const user = clients[clientKey];

  let clientNames = Object.values(clients)
    .filter((client) => client.horse && client.horse.name)
    .map((client) => client.horse.name);

  console.log(
    "User Assigned",
    user.horse ? user.horse.name : user,
    "Everyone",
    clientNames
  );

  socket.on(MESSAGES.CLIENTS, handleClients(socket, clients));

  socket.on(MESSAGES.NEW_HORSE, (socket) => {
    try {
      handleNewHorse(socket, clientKey, clients);
    } catch (error) {
      console.error(`Error handling new horse: ${error.message}`);
      socket.emit("error", {
        message: "An error occurred while creating a new horse.",
      });
    }
  });

  socket.on(MESSAGES.ASK_FOR_HORSE, () => {
    if (Object.keys(user).length === 0) return;
    handleAskForHorse({ horse: user.horse, socket: socket });
    console.log(user.horse.name);
  });

  socket.on(MESSAGES.JOIN_LOBBY, () => {
    if (Object.keys(user).length === 0) return;
    handleLobbyJoin(clients, io);
  });

  socket.on(MESSAGES.READY, (request) => {
    clearEmptyClients();
    if (Object.keys(user).length === 0) return;
    handleNewStats(request, user);
    handleReady(user, clientKey, clients, io);
  });

  socket.on(MESSAGES.FRAME, () => {
    if (Object.keys(user).length === 0) return;
    console.log("frame:user=> ", Object.keys(user));
    handleFrame(clients, io);
  });

  socket.on(MESSAGES.GET_STANDINGS, () => {
    if (Object.keys(user).length === 0) return;
    handleFinale(clientKey, clients, socket);
  });

  socket.on(MESSAGES.START_OVER, () => {
    if (Object.keys(user).length === 0) return;
    handleOver(clients);
    clients = {};
  });

  socket.on(MESSAGES.DELETE_HORSE, () => {
    if (Object.keys(user).length === 0) return;
    clients[clientKey] = {};
    io.emit(MESSAGES.UPDATE_LOBBY, getLobbyData(clients));
  });

  socket.on("disconnect", () => {
    handleDisconnect(clientKey);
  });
});

export const isAllClientsReady = (clientsList) => {
  return Object.values(clientsList).every((client) => {
    return client.ready;
  });
};
