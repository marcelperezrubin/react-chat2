import express from "express";
import http from "http";
import morgan from "morgan";
import { Server as SocketServer } from "socket.io";
import { resolve, dirname } from "path";

import { PORT } from "./config.js";
import cors from "cors";

// Initializations
const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
});

// Middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));

app.use(express.static(resolve("frontend/dist")));

// Manejo de grupos y usuarios
const users = {};

io.on("connection", (socket) => {
  console.log(socket.id);

  socket.on("joinRoom", (room) => {
    console.log(`User ${socket.id} joined room ${room}`);
    socket.join(room);
    users[socket.id] = room;
  });

  socket.on("leaveRoom", (room) => {
    console.log(`User ${socket.id} left room ${room}`);
    socket.leave(room);
    // Puedes realizar otras acciones necesarias al salir de la sala
  });

  socket.on("message", (body) => {
    const room = users[socket.id];
    io.to(room).emit("message", {
      body,
      from: socket.id.slice(8),
    });
  });

  socket.on("disconnect", () => {
    const room = users[socket.id];
    io.to(room).emit("userDisconnected", socket.id.slice(8));
    delete users[socket.id];
  });
});


server.listen(PORT);
console.log(`server on port ${PORT}`);
