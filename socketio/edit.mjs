import { liveDocuments, socketsInRooms } from "./vars.mjs";

import { ObjectId } from "mongodb";
import { updateDocument } from "../routes/documents.mjs";

// enable this to see logs
const enableConsoleLogs = false;

// info is { document, name }
const editName = (socket, io, info) => {
  enableConsoleLogs && console.log("socket.io: updating name:", info.name);

  let nameTimer;
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
};

// info is {document, body}
const editBody = (socket, io, info) => {
  enableConsoleLogs && console.log("socket.io: updating body:", info.body);

  let bodyTimer;
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
};

// info is { document, collabeditors }
const editCollabeditors = (socket, io, info) => {
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
};

export { editName, editBody, editCollabeditors };
