import { server } from "../index.mjs";
import { Server } from "socket.io";

import { join, leave } from "./joinAndLeave.mjs";
import { editName, editBody, editCollabeditors } from "./edit.mjs";

// enable this to see logs
const enableConsoleLogs = false;

export const runSocketIo = () => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
    },
  });

  io.on("connection", (socket) => {
    enableConsoleLogs &&
      console.log("socket.io: socket connecting to io: id:", socket.id);

    // see joinAndLeave.mjs for join and leave functions
    // use join event instead of connect, because document is not gathered yet.
    // socket.on("connect", (e) => {});
    socket.on("join", (info) => {
      join(socket, io, info);
    });
    // disconnect handles events like page refresh, navigating away
    socket.on("disconnect", () => {
      // enableConsoleLogs && console.log("socket.io: socket disconnecting: id:", socket.id);
      leave(socket, io);
    });
    // leave handles in app events like returning home
    socket.on("leave", () => {
      // enableConsoleLogs && console.log("socket.io: socket leaving: id:", socket.id);
      leave(socket, io);
    });

    // see edit.mjs for editing functions
    socket.on("name", (info) => {
      editName(socket, io, info);
    });
    socket.on("body", (info) => {
      editBody(socket, io, info);
    });
    socket.on("collabeditors", (info) => {
      editCollabeditors(socket, io, info);
    });
  });
};
