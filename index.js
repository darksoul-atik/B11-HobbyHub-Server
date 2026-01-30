const express = require("express");
const cors = require("cors");
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
  "mongodb+srv://hobby_hub:WLeOxp80adMTqVxo@darksoul.5bywpqf.mongodb.net/?retryWrites=true&w=majority&appName=DarkSoul";

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
      const commentData = {
        ...req.body,
        groupId: req.params.groupId,
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

    //EDITING/UPDATING OF A COMMENT
    app.patch("/groups/:groupId/comments/:commentId", async (req, res) => {
      const { commentId } = req.params;
      const { editedCommentText, editTime } = req.body;
      const filter = { _id: new ObjectId(commentId) };
      const updateDoc = {
        $set: {
          comment: editedCommentText,
          editedAt: editTime,
        },
      };
      const result = await commentCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    
  } finally {
  }
}
run().catch(console.dir);
