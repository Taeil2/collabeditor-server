import express from "express";
import db from "../db/conn.mjs";

import { ObjectId } from "mongodb";

const router = express.Router();

// enable this to see logs
const enableConsoleLogs = false;

router.get("/", async (req, res) => {
  enableConsoleLogs &&
    console.log("documents: getting documents for user", req.query.id);

  let collection = await db.collection("documents");
  let results = await collection
    .find({
      $or: [{ owner: req.query.id }, { "collabeditors.id": req.query.id }],
    })
    .sort({ updated: -1 })
    .limit(50)
    .toArray();

  res.send(results).status(200);
});

// Get a single document
router.get("/:id", async (req, res) => {
  enableConsoleLogs &&
    console.log("documents: getting document id", req.params.id);

  let collection = await db.collection("documents");
  let result = await collection.findOne({ _id: ObjectId(req.params.id) });

  if (!result) res.send({ message: "not found" }).status(404);
  else res.send(result).status(200);
});

// Add a new document
router.post("/", async (req, res) => {
  enableConsoleLogs &&
    console.log("documents: creating document for user", req.body.id);

  let collection = await db.collection("documents");

  const newDocument = {
    name: "",
    content: "",
    owner: req.body.id,
    collabeditors: [],
    updated: new Date(),
    created: new Date(),
  };

  let result = await collection.insertOne(newDocument);

  res.send(result).status(204);
});

// Update the document
router.patch("/:id", async (req, res) => {
  const query = { _id: ObjectId(req.params.id) };
  const updates = {
    $set: req.body,
  };

  const result = updateDocument(query, updates);

  res.send(result).status(200);
});

const updateDocument = async (query, updates) => {
  enableConsoleLogs && console.log("documents: updating document", query._id);

  let collection = await db.collection("documents");
  let result = await collection.updateOne(query, updates);

  return result;
};

// Delete an entry
router.delete("/:id", async (req, res) => {
  enableConsoleLogs &&
    console.log("documents: deleting document", req.params.id);

  const query = { _id: ObjectId(req.params.id) };

  const collection = db.collection("documents");
  let result = await collection.deleteOne(query);

  res.send(result).status(200);
});

export { updateDocument };
export default router;
