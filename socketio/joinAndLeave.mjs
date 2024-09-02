import { liveDocuments, socketsInRooms } from "./vars.mjs";

// enable this to see logs
const enableConsoleLogs = false;

// info is {document, user}
const join = (socket, io, info) => {
  enableConsoleLogs &&
    console.log(
      `socket.io: ${socket.id} joined room ${info.document._id} (${info.user.name})`
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
      userId: info.user._id,
      cursorLocation: "body",
      cursorPosition: [0, 0],
      cursorPixelLocation: [
        [1, 1],
        [1, 1],
      ],
    };
  }

  // if live users does not exist, initiate it
  if (!("liveUsers" in liveDocuments[info.document._id])) {
    liveDocuments[info.document._id].liveUsers = {};
  }
  liveDocuments[info.document._id].liveUsers[socket.id] = userInfo;

  // join the session for the document id
  socket.join(info.document._id);
  // keep track of which socket id is in which rooms
  socketsInRooms[socket.id] = info.document._id;
  io.to(info.document._id).emit("join", liveDocuments[info.document._id]);

  enableConsoleLogs && console.log("Updated live documents", liveDocuments);
};

// leave uses socket and not any more information, because disconnection does not provide any information.
const leave = (socket, io) => {
  const leavingRoom = socketsInRooms[socket.id];
  // if they're the last socket in the document, delete the document and the room
  if (
    liveDocuments[leavingRoom] && // check for document
    Object.keys(liveDocuments[leavingRoom].liveUsers).length === 1
  ) {
    // do you need to check if the socket id matches?
    delete liveDocuments[leavingRoom];
  } else {
    // otherwise, remove the user and send the updated document
    delete liveDocuments[leavingRoom]?.liveUsers[socket.id];
    io.to(leavingRoom).emit("leave", liveDocuments[leavingRoom]);
  }
};

export { join, leave };
