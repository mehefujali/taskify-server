const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.negmw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    
    const database = client.db("taskify");
    const taskCollection = database.collection("tasks");
    const userCollection = database.collection("users");

    app.get("/tasks/:email", async (req, res) => {
      const { email } = req.params;

      try {
        const todo = await taskCollection
          .find({ category: "todo", userEmail: email })
          .toArray();
        const inProgress = await taskCollection
          .find({ category: "inProgress", userEmail: email })
          .toArray();
        const done = await taskCollection
          .find({ category: "done", userEmail: email })
          .toArray();
        res.send({ todo, inProgress, done });
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch tasks" });
      }
    });
    app.get("/task/:id", async (req, res) => {
      const { id } = req.params;

      try {
        const result = await taskCollection.findOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch tasks" });
      }
    });

    app.post("/tasks", async (req, res) => {
      try {
        const task = req.body;
        const result = await taskCollection.insertOne(task);
        const newTask = { _id: result.insertedId, ...task };
        res.status(201).send(newTask);
      } catch (error) {
        res.status(500).send({ error: "Failed to add task" });
      }
    });
    app.post("/user", async (req, res) => {
      try {
        const user = req.body;
        const extUser = await userCollection.findOne({ email: user.email });
        if (extUser) {
          return 
        }
        const result = await userCollection.insertOne(user);

        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to add user" });
      }
    });

    app.put("/tasks/drag/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { category, order } = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: { category, order } };
        const result = await taskCollection.updateOne(filter, updateDoc);
        if (result.modifiedCount === 0) {
          return res.status(404).send({ error: "Task not found" });
        }
        const updatedTask = await taskCollection.findOne(filter);
        res.send(updatedTask);
      } catch (error) {
        res.status(500).send({ error: "Failed to update task order" });
      }
    });
    app.put("/tasks/update/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { title, description } = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: { title, description } };
        const result = await taskCollection.updateOne(filter, updateDoc);
        if (result.modifiedCount === 0) {
          return res.status(404).send({ error: "Task not found" });
        }
        const updatedTask = await taskCollection.findOne(filter);
        res.send(updatedTask);
      } catch (error) {
        res.status(500).send({ error: "Failed to update task order" });
      }
    });

    app.delete("/tasks/:id", async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: "Invalid ObjectId" });
        }
        const result = await taskCollection.deleteOne({
          _id: new ObjectId(id),
        });
        if (result.deletedCount === 0) {
          return res.status(404).send({ error: "Task not found" });
        }
        res.send({ message: "Task deleted" });
      } catch (error) {
        res.status(500).send({ error: "Failed to delete task" });
      }
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
