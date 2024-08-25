import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";

const router = express.Router();

// Get a list of users
router.get("/", async (req, res) => {
  console.log("getting users");

  let collection = await db.collection("users");
  let results = await collection.find({}).toArray();

  res.send(results).status(200);
});

// Get a single user
router.get("/user/", async (req, res) => {
  let collection = await db.collection("users");
  let result = await collection.findOne(req.query);

  if (!result) res.send({ message: "not found" }).status(404);
  else res.send(result).status(200);
});

// Add a new user
router.post("/", async (req, res) => {
  console.log("adding user", req.body);

  let collection = await db.collection("users");

  const newUser = {
    email: req.body.email,
    name: req.body.name,
    created: new Date(),
  };

  let result = await collection.insertOne(newUser);
  res.send(result).status(204);
});

// Update a user
router.patch("/:id", async (req, res) => {
  const query = { _id: ObjectId(req.params.id) };
  const updates = {
    $set: req.body,
  };

  let collection = await db.collection("users");
  let result = await collection.updateOne(query, updates);

  res.send(result).status(200);
});

// Delete an entry
// router.delete("/:id", async (req, res) => {
//   const query = { _id: ObjectId(req.params.id) };

//   const collection = db.collection("users");
//   let result = await collection.deleteOne(query);

//   res.send(result).status(200);
// });

export default router;
