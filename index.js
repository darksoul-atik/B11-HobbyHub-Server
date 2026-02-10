const express = require("express");
const cors = require("cors");
require('dotenv').config()

const app = express();
const port = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");


const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@darksoul.5bywpqf.mongodb.net/?retryWrites=true&w=majority&appName=DarkSoul`;



const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );

    //////////////////////////////////////////  MongoDB Collection Section  ///////////////////////////////////////////////////////

    const groupCollection = client.db("hobbyhubDB").collection("groups");
    const commentCollection = client.db("hobbyhubDB").collection("comments");

    //////////////////////////////////////////  Group Section  ///////////////////////////////////////////////////////

    //GET ALL THE GROUPS
    app.get("/groups", async (req, res) => {
      const result = await groupCollection.find().toArray();
      res.send(result);
    });

    //GET A GROUP BY ID
    app.get("/groups/:id", async (req, res) => {
      const id = req.params.id;
      const group = await groupCollection.findOne({ _id: new ObjectId(id) });
      res.send(group);
    });

    //CREATE GROUPS
    app.post("/groups", async (req, res) => {
      const createGroups = req.body;
      const result = await groupCollection.insertOne(createGroups);
      res.send(result);
    });

    //UPDATE A GROUP
    app.put("/groups/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedGroup = req.body;
      const updatedDoc = {
        $set: updatedGroup,
      };
      const result = await groupCollection.updateOne(
        filter,
        updatedDoc,
        options,
      );
      res.send(result);
    });

    //DELETE A GROUP
    app.delete("/groups/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await groupCollection.deleteOne(query);
      res.send(result);
    });

    //PATCH A GROUP
    app.patch("/groups/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedMembers = req.body;
      const updateDoc = {
        $set: { members: updatedMembers },
      };
      const result = await groupCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    //////////////////////////////////////////  Comment Section  ///////////////////////////////////////////////////////

    //POST A COMMENT
    app.post("/groups/:groupId/comments", async (req, res) => {
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
    });

    //GET ALL COMMENT (OF THAT GROUP)
    app.get("/groups/:groupId/comments", async (req, res) => {
      const result = await commentCollection
        .find({ groupId: req.params.groupId })
        .toArray();

      res.send(result);
    });

    //EDITING/UPDATING//REPLYING OF A COMMENT
    app.patch("/groups/:groupId/comments/:commentId", async (req, res) => {
      const { commentId } = req.params;
      const { editedCommentText, repliedText, replyIndex } = req.body;

      const updateFields = {};

      // Edit comment
      if (editedCommentText !== undefined) {
        updateFields.comment = editedCommentText;
        updateFields.editedAt = new Date().toLocaleString("en-US");
      }

      // Add new reply (HOST)
      if (repliedText !== undefined && replyIndex === undefined) {
        const newReply = {
          text: repliedText,
          repliedAt: new Date().toLocaleString("en-US"),
        };

        const result = await commentCollection.updateOne(
          { _id: new ObjectId(commentId) },
          { $push: { replies: newReply } },
        );

        return res.send(result);
      }

      // Edit existing reply (HOST)
      if (repliedText !== undefined && replyIndex !== undefined) {
        const result = await commentCollection.updateOne(
          { _id: new ObjectId(commentId) },
          {
            $set: {
              [`replies.${replyIndex}.text`]: repliedText,
              [`replies.${replyIndex}.repliedAt`]:
                new Date().toLocaleString("en-US"),
            },
          },
        );

        return res.send(result);
      }

      // Update comment fields if needed
      if (Object.keys(updateFields).length > 0) {
        const result = await commentCollection.updateOne(
          { _id: new ObjectId(commentId) },
          { $set: updateFields },
        );

        return res.send(result);
      }

      res.send({ message: "No updates performed" });
    });

    //DELETING A COMMENT
    app.delete("/groups/:groupId/comments/:commentId", async (req, res) => {
      const { groupId, commentId } = req.params;
      const query = { _id: new ObjectId(commentId) };
      const result = await commentCollection.deleteOne(query);
      res.send(result);
    });

    //DELETE A REPLY
    app.delete(
      "/groups/:groupId/comments/:commentId/replies/:replyIndex",
      async (req, res) => {
        const { commentId, replyIndex } = req.params;

        // Get the comment first
        const comment = await commentCollection.findOne({
          _id: new ObjectId(commentId),
        });

        if (!comment || !comment.replies) {
          return res.status(404).send({ message: "Comment not found" });
        }

        // Remove the reply at the specified index
        comment.replies.splice(parseInt(replyIndex), 1);

        // Update the comment with the modified replies array
        const result = await commentCollection.updateOne(
          { _id: new ObjectId(commentId) },
          { $set: { replies: comment.replies } },
        );

        res.send(result);
      },
    );
  } finally {
  }
}
run().catch(console.dir);