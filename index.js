const express = require("express");
const cors = require("cors");
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@darksoul.5bywpqf.mongodb.net/?retryWrites=true&w=majority&appName=DarkSoul`;

// Create MongoDB client with connection pooling
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 10,
  minPoolSize: 1,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000,
});

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    await client.connect();
    cachedDb = client.db("hobbyhubDB");
    console.log("Connected to MongoDB!");
    return cachedDb;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

// Root route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

//////////////////////////////////////////  Group Section  ///////////////////////////////////////////////////////

// GET ALL THE GROUPS
app.get("/groups", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const groupCollection = db.collection("groups");
    const result = await groupCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ error: "Failed to fetch groups", details: error.message });
  }
});

// GET A GROUP BY ID
app.get("/groups/:id", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const groupCollection = db.collection("groups");
    const id = req.params.id;
    const group = await groupCollection.findOne({ _id: new ObjectId(id) });
    res.send(group);
  } catch (error) {
    console.error("Error fetching group:", error);
    res.status(500).json({ error: "Failed to fetch group", details: error.message });
  }
});

// CREATE GROUPS
app.post("/groups", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const groupCollection = db.collection("groups");
    const createGroups = req.body;
    const result = await groupCollection.insertOne(createGroups);
    res.send(result);
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ error: "Failed to create group", details: error.message });
  }
});

// UPDATE A GROUP
app.put("/groups/:id", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const groupCollection = db.collection("groups");
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const options = { upsert: true };
    const updatedGroup = req.body;
    const updatedDoc = {
      $set: updatedGroup,
    };
    const result = await groupCollection.updateOne(filter, updatedDoc, options);
    res.send(result);
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({ error: "Failed to update group", details: error.message });
  }
});

// DELETE A GROUP
app.delete("/groups/:id", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const groupCollection = db.collection("groups");
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await groupCollection.deleteOne(query);
    res.send(result);
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({ error: "Failed to delete group", details: error.message });
  }
});

// PATCH A GROUP
app.patch("/groups/:id", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const groupCollection = db.collection("groups");
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const updatedMembers = req.body;
    const updateDoc = {
      $set: { members: updatedMembers },
    };
    const result = await groupCollection.updateOne(filter, updateDoc);
    res.send(result);
  } catch (error) {
    console.error("Error patching group:", error);
    res.status(500).json({ error: "Failed to patch group", details: error.message });
  }
});

//////////////////////////////////////////  Comment Section  ///////////////////////////////////////////////////////

// POST A COMMENT
app.post("/groups/:groupId/comments", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const commentCollection = db.collection("comments");
    const { comment, commenterName, commenterPhoto } = req.body;

    const commentData = {
      comment: comment,
      commenterName,
      commenterPhoto,
      commentTime: new Date().toLocaleString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }),
      editedAt: null,
      groupId: req.params.groupId,
      replies: [],
    };

    const result = await commentCollection.insertOne(commentData);
    res.send(result);
  } catch (error) {
    console.error("Error posting comment:", error);
    res.status(500).json({ error: "Failed to post comment", details: error.message });
  }
});

// GET ALL COMMENT (OF THAT GROUP)
app.get("/groups/:groupId/comments", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const commentCollection = db.collection("comments");
    const result = await commentCollection
      .find({ groupId: req.params.groupId })
      .toArray();

    res.send(result);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments", details: error.message });
  }
});

// EDITING/UPDATING/REPLYING OF A COMMENT
app.patch("/groups/:groupId/comments/:commentId", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const commentCollection = db.collection("comments");
    const { commentId } = req.params;
    const { editedCommentText, repliedText, replyIndex } = req.body;

    const updateFields = {};

    if (editedCommentText !== undefined) {
      updateFields.comment = editedCommentText;
      updateFields.editedAt = new Date().toLocaleString("en-US");
    }

    if (repliedText !== undefined && replyIndex === undefined) {
      const newReply = {
        text: repliedText,
        repliedAt: new Date().toLocaleString("en-US"),
      };

      const result = await commentCollection.updateOne(
        { _id: new ObjectId(commentId) },
        { $push: { replies: newReply } }
      );

      return res.send(result);
    }

    if (repliedText !== undefined && replyIndex !== undefined) {
      const result = await commentCollection.updateOne(
        { _id: new ObjectId(commentId) },
        {
          $set: {
            [`replies.${replyIndex}.text`]: repliedText,
            [`replies.${replyIndex}.repliedAt`]: new Date().toLocaleString("en-US"),
          },
        }
      );

      return res.send(result);
    }

    if (Object.keys(updateFields).length > 0) {
      const result = await commentCollection.updateOne(
        { _id: new ObjectId(commentId) },
        { $set: updateFields }
      );

      return res.send(result);
    }

    res.send({ message: "No updates performed" });
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ error: "Failed to update comment", details: error.message });
  }
});

// DELETING A COMMENT
app.delete("/groups/:groupId/comments/:commentId", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const commentCollection = db.collection("comments");
    const { commentId } = req.params;
    const query = { _id: new ObjectId(commentId) };
    const result = await commentCollection.deleteOne(query);
    res.send(result);
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment", details: error.message });
  }
});

// DELETE A REPLY
app.delete("/groups/:groupId/comments/:commentId/replies/:replyIndex", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const commentCollection = db.collection("comments");
    const { commentId, replyIndex } = req.params;

    const comment = await commentCollection.findOne({
      _id: new ObjectId(commentId),
    });

    if (!comment || !comment.replies) {
      return res.status(404).send({ message: "Comment not found" });
    }

    comment.replies.splice(parseInt(replyIndex), 1);

    const result = await commentCollection.updateOne(
      { _id: new ObjectId(commentId) },
      { $set: { replies: comment.replies } }
    );

    res.send(result);
  } catch (error) {
    console.error("Error deleting reply:", error);
    res.status(500).json({ error: "Failed to delete reply", details: error.message });
  }
});

// For local development
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

// CRITICAL: Export for Vercel
module.exports = app;