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

  io.on("connection", (socket) => {
    // setInterval(() => {
    //   console.log(liveDocuments);
    // }, 30000);

    console.log("");

    console.log("io connection: id:", socket.id);

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

      console.log("socket join: id:", socket.id);
    });

    // info is {document, user}
    socket.on("leave", (info) => {
      enableConsoleLogs &&
        console.log(
          `socket.io: ${info.user?.name} left room ${info.document._id}`
        );

      // if it only has one user, delete the document
      if (
        liveDocuments[info.document._id] && // check for document
        Object.keys(liveDocuments[info.document._id].currentUsers).length === 1
      ) {
        delete liveDocuments[info.document?._id];
      } else {
        // otherwise, remove the user and send the updated document
        delete liveDocuments[info.document?._id]?.currentUsers[info.user._id];
        io.to(info.document._id).emit(
          "leave",
          liveDocuments[info.document._id]
        );
      }

      // console.log("live documents: ", liveDocuments);
      console.log("socket leave: id:", socket.id);
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

    socket.on("connect", (e) => {
      console.log("socket connect: id:", socket.id);
    });

    socket.on("disconnect", (e) => {
      console.log("socket disconnect: id:", socket.id);
    });
  });
};
