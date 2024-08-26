import express from "express";
import cors from "cors";
import "./loadEnvironment.mjs";
import "express-async-errors";
import documents from "./routes/documents.mjs";
import users from "./routes/users.mjs";

// socket.io imports
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";

const PORT = process.env.PORT || 5050;
const app = express();

// for socket.io
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

app.use(cors());
app.use(express.json());

const __dirname = dirname(fileURLToPath(import.meta.url));

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

io.on("connection", (socket) => {
  let title = "";
  let body = "";

  let users = [
    {
      id: 123,
      cursorLocation: "title",
      cursorPosition: 1,
    },
  ];

  console.log("a user connected");

  socket.on("connect", (document) => {
    console.log(document);
  });

  socket.on("title", (key) => {
    title += key;
    io.emit("chat message", msg);
  });

  socket.on("body", (key) => {
    body += key;
    io.emit("chat message", msg);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  // emit message to all except for the emitting socket
  // socket.broadcast.emit("hi");
});

// Load the /documents routes
app.use("/documents", documents);

// Load the /users routes
app.use("/users", users);

// Global error handling
app.use((err, _req, res, next) => {
  res.status(500).send("Uh oh! An unexpected error occured.");
});

server.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
