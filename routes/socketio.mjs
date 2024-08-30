import { server } from "../index.mjs";
import { Server } from "socket.io";

import { ObjectId } from "mongodb";
import { updateDocument } from "./documents.mjs";

// enable this to see logs
const enableConsoleLogs = true;

export const runSocketIo = () => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
    },
  });

  const liveDocuments = {};
  const socketsInRooms = {};
  io.on("connection", (socket) => {
    enableConsoleLogs &&
      console.log("socket.io: socket connecting to io: id:", socket.id);

    // connect event is not working
    // socket.on("connect", (e) => {});

    // disconnect from server (includes refresh, )
    socket.on("disconnect", () => {
      enableConsoleLogs &&
        console.log("socket.io: socket disconnecting: id:", socket.id);

      disconnecting();
    });

    socket.on("leave", () => {
      enableConsoleLogs &&
        console.log("socket.io: socket leaving: id:", socket.id);

      disconnecting();
    });

    // disconnection occurs on two events (disconnect (from server), leave room)
    const disconnecting = () => {
      const leavingRoom = socketsInRooms[socket.id];
      // if they're the last socket in the document, delete the document and the room
      if (
        liveDocuments[leavingRoom] && // check for document
        Object.keys(liveDocuments[leavingRoom].currentUsers).length === 1
      ) {
        // do you need to check if the socket id matches?
        delete liveDocuments[leavingRoom];
      } else {
        // otherwise, remove the user and send the updated document
        delete liveDocuments[leavingRoom]?.currentUsers[socket.id];
        io.to(leavingRoom).emit("leave", liveDocuments[leavingRoom]);
      }

      // console.log(liveDocuments);
    };

    socket.on("message", (message) => {
      console.log("sent message:", message);
    });

    // info is {document, user}
    socket.on("join", (info) => {
      enableConsoleLogs &&
        console.log(
          `socket.io: ${info.user.name} joined room ${info.document._id}`
        );

      // if the document is active (has a socket.io session),
      if (info.document._id in liveDocuments) {
        // don't replace the document
      } else {
        // if the document does not exist, set the document in session
        liveDocuments[info.document._id] = info.document;
      }

      let userInfo;
      // if the title is empty, put the cursor in the title
      if (liveDocuments[info.document._id].title === "") {
        userInfo = {
          userId: info.user._id,
          cursorLocation: "title",
          cursorCharLocation: [0, 0],
          cursorPixelLocation: [
            [1, 1],
            [1, 1],
          ],
        };
      } else {
        // otherwise, set the cursor in the body
        userInfo = {
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
      liveDocuments[info.document._id].currentUsers[socket.id] = userInfo;

      // join the session for the document id
      socket.join(info.document._id);
      // keep track of which socket id is in which rooms
      socketsInRooms[socket.id] = info.document._id;
      io.to(info.document._id).emit("join", liveDocuments[info.document._id]);

      enableConsoleLogs && console.log("Updated live documents", liveDocuments);
    });

    let nameTimer;
    // info is { document, user }
    socket.on("name", (info) => {
      enableConsoleLogs && console.log("socket.io: updating name:", info.name);

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
        enableConsoleLogs && console.log("socket.io: saving name:", info.name);
      }, 500);

      console.log("socket name: id:", socket.id);
    });

    let bodyTimer;
    // info is {document, user, body, key}
    socket.on("body", (info) => {
      enableConsoleLogs && console.log("socket.io: updating body:", info.body);
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
        enableConsoleLogs && console.log("updating body:", info.body);
      }, 500);

      console.log("socket body: id:", socket.id);
    });

    // info is { document, collabeditors }
    socket.on("collabeditors", (info) => {
      enableConsoleLogs &&
        console.log("socket.io: updating collabeditors:", info.collabeditors);

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

      console.log("socket collabeditors: id:", socket.id);
    });
  });
};
