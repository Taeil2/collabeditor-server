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
      // $or: [
      //   {
      //     "owner._id": parseInt(req.query.id),
      //     collabeditor: parseInt(req.query.id),
      //     // "collabeditor._id": parseInt(req.query.id), // contains userId
      //   },
      // ],
    })
    .sort({ updated: -1 })
    .limit(50)
    .toArray();

  res.send(results).status(200);
});

// Get a single document
router.get("/:id", async (req, res) => {
  let collection = await db.collection("documents");
  let result = await collection.findOne({ _id: ObjectId(req.params.id) });

  if (!result) res.send({ message: "not found" }).status(404);
  else res.send(result).status(200);
});

// Add a new document
router.post("/", async (req, res) => {
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

  console.log("creating document");
  console.log("id: ", result.insertedId);
  console.log("owner:", req.body.id);

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
router.delete("/:id", async (req, res) => {
  const query = { _id: ObjectId(req.params.id) };

  const collection = db.collection("documents");
  let result = await collection.deleteOne(query);

  res.send(result).status(200);
});

export default router;
