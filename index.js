import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
const app = express();
const port = process.env.PORT || 3000;
dotenv.config();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mvfiisx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });

    const allJobsCollection = client.db("JobstockDB").collection("allJobs");
    const userCollection = client.db("JobstockDB").collection("Users");

    app.get("/jobs", async (req, res) => {
      const cursor = allJobsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await allJobsCollection.findOne(query);
      res.send(result);
    });

    app.post("/jobs/:id", async (req, res) => {
      const { userId } = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const job = await allJobsCollection.findOne(query);

      let appliedUsers = job.appliedUsers || [];
      if (!appliedUsers.includes(userId)) {
        appliedUsers.push(userId);
      }

      allJobsCollection.updateOne(query, { $set: { appliedUsers } });

      res.send("applicant pushed");
    });

    app.get("/users", async (req, res) => {
      const email = req.query.email;
      let query = {};

      if (email) {
        query.email = email;
      }

      const cursor = userCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    app.post("/users/:id", async (req, res) => {
      const { jobId } = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const user = await userCollection.findOne(query);

      let myAppliedJobs = user.myAppliedJobs || [];
      if (!myAppliedJobs.includes(jobId)) {
        myAppliedJobs.push(jobId);
      }

      userCollection.updateOne(query, { $set: { myAppliedJobs } });

      res.send("success!!!!!!!!!!!!!!!!!");
    });

    app.put("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const { _id, ...updatedData } = req.body;

      const result = await userCollection.findOneAndUpdate(
        query,
        { $set: updatedData },
        { returnDocument: "after" }
      );

      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const { email } = req.body;
      const existingUser = await userCollection.findOne({ email });

      if (existingUser) {
        return res.send("user is already axists.");
      }

      const newUser = req.body;
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("JobStock server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
