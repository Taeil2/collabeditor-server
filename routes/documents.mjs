import express from "express";
import db from "../db/conn.mjs";

import { ObjectId } from "mongodb";

const router = express.Router();

// enable this to see logs
const enableConsoleLogs = true;

router.get("/", async (req, res) => {
  enableConsoleLogs &&
    console.log("documents: getting documents for user", req.query._id);

  let collection = await db.collection("documents");
  let results = await collection
    .find({
      $or: [{ owner: req.query._id }, { "collabeditors._id": req.query._id }],
    })
    .sort({ updated: -1 })
    .limit(50)
    .toArray();

  res.send(results).status(200);
});

// Get a single document
router.get("/:_id", async (req, res) => {
  enableConsoleLogs &&
    console.log("documents: getting document id", req.params._id);

  let collection = await db.collection("documents");
  let result = await collection.findOne({ _id: ObjectId(req.params._id) });

  if (!result) res.send({ message: "not found" }).status(404);
  else res.send(result).status(200);
});

// Add a new document
router.post("/", async (req, res) => {
  enableConsoleLogs &&
    console.log("documents: creating document for user", req.body._id);

  let collection = await db.collection("documents");

  const newDocument = {
    name: "",
    content: "",
    owner: req.body._id,
    collabeditors: [],
    updated: new Date(),
    created: new Date(),
  };

  let result = await collection.insertOne(newDocument);

  res.send(result).status(204);
});

// Update the document
router.patch("/:_id", async (req, res) => {
  const query = { _id: ObjectId(req.params._id) };
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
router.delete("/:_id", async (req, res) => {
  enableConsoleLogs &&
    console.log("documents: deleting document", req.params._id);

  const query = { _id: ObjectId(req.params._id) };

  const collection = db.collection("documents");
  let result = await collection.deleteOne(query);

  res.send(result).status(200);
});

export { updateDocument };
export default router;
