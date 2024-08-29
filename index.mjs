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

import { ObjectId } from "mongodb";
import { updateDocument } from "./routes/documents.mjs";

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

const liveDocuments = {};

io.on("connection", (socket) => {
  // setInterval(() => {
  //   console.log(liveDocuments);
  // }, 30000);

  // info is {document, user}
  socket.on("join", (info) => {
    console.log(`${info.user.name} joined room ${info.document._id}`);

    // if the document is active (has a socket.io session),
    if (info.document._id in liveDocuments) {
      // don't replace the document
    } else {
      // if the document does not exist, set the document in session
      liveDocuments[info.document._id] = info.document;
    }

    let cursorInfo;
    // if the title is empty, put the cursor in the title
    if (liveDocuments[info.document._id].title === "") {
      cursorInfo = {
        cursorLocation: "title",
        cursorCharLocation: [0, 0],
        cursorPixelLocation: [
          [1, 1],
          [1, 1],
        ],
      };
    } else {
      // otherwise, set the cursor in the body
      cursorInfo = {
        cursorLocation: "body",
        cursorPosition: [0, 0],
        cursorPixelLocation: [
          [1, 1],
          [1, 1],
        ],
      };
    }

    // if current users does not exist, initiate it
    if (!("currentUsers" in liveDocuments[info.document._id])) {
      liveDocuments[info.document._id].currentUsers = {};
    }
    liveDocuments[info.document._id].currentUsers[info.user._id] = cursorInfo;

    // join the session for the document id
    socket.join(info.document._id);
    io.to(info.document._id).emit("join", liveDocuments[info.document._id]);

    // console.log("live documents: ", liveDocuments);
  });

  // info is {document, user}
  socket.on("leave", (info) => {
    console.log(`${info.user?.name} left room ${info.document._id}`);

    // if it only has one user, delete the document
    if (
      liveDocuments[info.document._id] && // check for document
      Object.keys(liveDocuments[info.document._id].currentUsers).length === 1
    ) {
      delete liveDocuments[info.document?._id];
    } else {
      // otherwise, remove the user and send the updated document
      delete liveDocuments[info.document?._id]?.currentUsers[info.user._id];
      io.to(info.document._id).emit("leave", liveDocuments[info.document._id]);
    }

    // console.log("live documents: ", liveDocuments);
  });

  let nameTimer;
  socket.on("name", (info) => {
    // info is { document, user }
    clearInterval(nameTimer);
    liveDocuments[info.document?._id].name = info.name;

    io.to(info.document._id).emit("name", liveDocuments[info.document._id]);

    // save document after 500 ms of no input
    nameTimer = setTimeout(() => {
      const query = { _id: ObjectId(info.document._id) };
      const updates = {
        $set: {
          name: info.name,
        },
      };

      updateDocument(query, updates);
      console.log("updating name", info.name);
    }, 500);
  });

  let bodyTimer;
  socket.on("body", (info) => {
    // info is {document, user, body, key}
    clearInterval(bodyTimer);
    if (liveDocuments[info.document?._id]) {
      liveDocuments[info.document?._id].content = info.body;
    }

    io.to(info.document._id).emit("body", liveDocuments[info.document._id]);

    // save document after 500 ms of no input
    bodyTimer = setTimeout(() => {
      const query = { _id: ObjectId(info.document._id) };
      const updates = {
        $set: {
          content: info.body,
        },
      };

      updateDocument(query, updates);
      console.log("updating body", info.body);
    }, 500);
  });

  socket.on("collabeditors", (info) => {
    // info is { document, collabeditors }
    console.log("updating collabeditors", info.collabeditors);

    liveDocuments[info.document?._id].collabeditors = info.collabeditors;

    io.to(info.document._id).emit(
      "collabeditors",
      liveDocuments[info.document._id]
    );

    const query = { _id: ObjectId(info.document._id) };
    const updates = {
      $set: {
        collabeditors: info.collabeditors,
      },
    };

    updateDocument(query, updates);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
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
