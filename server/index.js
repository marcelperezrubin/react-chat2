import mysql2 from "mysql2"
import express from "express";
import http from "http";
import morgan from "morgan";
import { Server as SocketServer } from "socket.io";
import { resolve, dirname } from "path";

import { PORT, DB_CONFIG } from "./config.js";
import cors from "cors";

// Create the connection to the database

const dbConnection = mysql2.createConnection(DB_CONFIG);



// Connect to database
dbConnection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL');
  }
});

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

// Management of groups and users
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


process.on('SIGINT', () => {
  console.log('Closing MySQL connection...');
  dbConnection.end((err) => {
    if (err) {
      console.error('Error closing MySQL connection:', err);
    } else {
      console.log('MySQL connection closed');
    }
    process.exit();
  });
});

app.get('/api/data', (req, res) => {
  const sql = 'SELECT * FROM my_table';
  dbConnection.query(sql, (err, result) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.json(result);
    }
  });
});

// Path to store data in the database only for the "main room"
app.post('/api/data', (req, res) => {
  const { room, body } = req.body;

// Check if the message comes from the desired room
  if (room === 'main room') {
    const sql = 'INSERT INTO my_table (room, message) VALUES (?, ?)';
    
    dbConnection.query(sql, [room, body], (err, result) => {
      if (err) {
        console.error('Error executing query:', err);
        res.status(500).send('Internal Server Error');
      } else {
        res.json({ success: true, message: 'Data inserted successfully' });
      }
    });
  } else {
   // If the message does not come from the desired room, you can send a response indicating that it was not stored
    res.json({ success: false, message: 'Data not stored for this room'});
  }
});



// Close the connection when the server shuts down
process.on('SIGINT', () => {
  console.log('Closing MySQL connection...');
  dbConnection.end((err) => {
    if (err) {
      console.error('Error closing MySQL connection:', err);
    } else {
      console.log('MySQL connection closed');
    }
    process.exit();
  });
});


server.listen(PORT);
console.log(`server on port ${PORT}`);
