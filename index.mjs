import express from "express";
import cors from "cors";
import "./loadEnvironment.mjs";
import "express-async-errors";
import documents from "./routes/documents.mjs";
import users from "./routes/users.mjs";
import { runSocketIo } from "./routes/socketio.mjs"; // not really a route

// socket.io imports
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const PORT = process.env.PORT || 5050;
const app = express();

// for socket.io
export const server = createServer(app);

app.use(cors());
app.use(express.json());

const __dirname = dirname(fileURLToPath(import.meta.url));

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

// Load the /documents routes
app.use("/documents", documents);

// Load the /users routes
app.use("/users", users);

// Run socket.io
runSocketIo();

// Global error handling
app.use((err, _req, res, next) => {
  res.status(500).send("Uh oh! An unexpected error occured.");
});

server.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
