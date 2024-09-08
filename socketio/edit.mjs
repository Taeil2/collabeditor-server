import { liveDocuments, socketsInRooms } from "./vars.mjs";

import { ObjectId } from "mongodb";
import { updateDocument } from "../routes/documents.mjs";

// enable this to see logs
const enableConsoleLogs = false;

// info is {document, content}
const edit = (socket, io, document) => {
  enableConsoleLogs && console.log("socket.io: updating document:", document);

  let saveTimer;
  clearInterval(saveTimer);
  liveDocuments[document?._id] = document;

  io.to(document._id).emit("edit", liveDocuments[document._id]);

  // save document after 500 ms of no input
  saveTimer = setTimeout(() => {
    const query = { _id: ObjectId(document._id) };

    // remove _id from the document update
    const documentUpdates = {
      ...document,
    };
    delete documentUpdates._id;
    delete documentUpdates.liveUsers;
    const updates = {
      $set: documentUpdates,
    };

    updateDocument(query, updates);
    enableConsoleLogs && console.log("updating document:", document);
  }, 500);
};

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

// info is {document, content}
const editContent = (socket, io, info) => {
  enableConsoleLogs &&
    // console.log("socket.io: updating content:", info.content);
    console.log("socket.io: updating content:", info);

  let contentTimer;
  clearInterval(contentTimer);
  if (liveDocuments[info.document?._id]) {
    liveDocuments[info.document?._id].content = info.content;
  }

  io.to(info.document._id).emit("content", liveDocuments[info.document._id]);

  // save document after 500 ms of no input
  contentTimer = setTimeout(() => {
    const query = { _id: ObjectId(info.document._id) };
    const updates = {
      $set: {
        content: info.content,
      },
    };

    updateDocument(query, updates);
    // enableConsoleLogs && console.log("updating content:", info.content);
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

export { edit, editName, editContent, editCollabeditors };
