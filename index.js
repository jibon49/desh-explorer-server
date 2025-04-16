const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2zvoo0z.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// JWT Verification Middleware
const verifyToken = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  const token = req.headers.authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    await client.connect();

    const db = client.db("deshExplorerDB");
    const tourPackagesCollection = db.collection("tourPackages");
    const userCollection = db.collection("users");
    const groupTourCollection = db.collection("groupTour");

    // Tour Packages API
    app.get("/tourPackages", async (req, res) => {
      const result = await tourPackagesCollection.find().toArray();
      res.send(result);
    });

    app.get("/tourDetails/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await tourPackagesCollection.findOne(query);
      res.send(result);
    });

    //group tour
    app.get("/group-tours", async (req, res) => {
      const tours = await groupTourCollection.find().toArray();
      res.send(tours);
    });

    app.post("/group-tours", async (req, res) => {
      const tour = req.body;
      console.log(tour);
      const result = await groupTourCollection.insertOne(tour);
      res.send(result);
    });

    app.patch("/group-tours/:id/book", async (req, res) => {
      const id = req.params.id;
      const bookedSlots = req.body.slots || 1;

      const result = await groupToursCollection.updateOne(
        { _id: new ObjectId(id) },
        { $inc: { availableSlots: -bookedSlots } }
      );

      res.send(result);
    });

    // JWT Token Route
    app.post("/jwt", async (req, res) => {
      const { userMail } = req.body;

      const token = jwt.sign({ userMail }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "2h",
      });

      res.send({ token });
    });

    // Users API
    app.get("/users", verifyToken, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // GET user by email
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;

      if (!email) {
        return res
          .status(400)
          .json({ message: "Email query parameter is required" });
      }

      try {
        const result = await userCollection.find({ userMail: email }).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching user by email:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    app.patch("/users/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const { userName, userPhone } = req.body;

        const filter = { userMail: email };
        const updateDoc = {
          $set: {
            userName,
            userPhone,
          },
        };

        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        console.error("Error updating user info:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { userMail: user.userMail };
      const existingUser = await userCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "user already exist", insertedId: null });
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // MongoDB connection confirmation
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Connected to MongoDB!");
  } finally {
    // await client.close();
  }
}

// Run server
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Desh explorer running");
});

app.listen(port, () => {
  console.log(`🚀 Desh explorer is running on port ${port}`);
});
