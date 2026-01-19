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
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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

    const groupCollection = client.db("hobbyhubDB").collection("groups");

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
  } finally {
  }
}
run().catch(console.dir);
