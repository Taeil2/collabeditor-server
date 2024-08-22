import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";

const router = express.Router();

// Get a list of 50 documents
// TODO: filter by user
router.get("/", async (req, res) => {
  let collection = await db.collection("documents");
  let results = await collection
    .find({
      // "owner": userId,
      // "collabeditor": userId // contains userId
    })
    .sort({ date: -1 })
    .limit(50)
    .toArray();

  res.send(results).status(200);
});

// Get a single document
router.get("/:id", async (req, res) => {
  let collection = await db.collection("documents");
  let query = { _id: parseInt(req.params.id) };
  let result = await collection.findOne(query);

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});
``;

// Add a new document
router.post("/", async (req, res) => {
  let collection = await db.collection("documents");
  let newDocument = req.body;
  newDocument.date = new Date();
  let result = await collection.insertOne(newDocument);
  res.send(result).status(204);
});

// Update the document
// TODO: This example only updates "comments". Update the entire document.
router.patch("/:id", async (req, res) => {
  const query = { _id: ObjectId(req.params.id) };
  const updates = {
    $push: { comments: req.body },
  };

  let collection = await db.collection("posts");
  let result = await collection.updateOne(query, updates);

  res.send(result).status(200);
});

// Delete an entry
router.delete("/documents/:id", async (req, res) => {
  const query = { _id: ObjectId(req.params.id) };

  const collection = db.collection("documents");
  let result = await collection.deleteOne(query);

  res.send(result).status(200);
});

export default router;
