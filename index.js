const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
    const complainCollection = db.collection("complains");
    const hotelsCollection = db.collection("hotels");
    const customTourCollection = db.collection("usercustomtour");
    const paymentsCollection = db.collection("payments");
    const reviewsCollection = db.collection("reviews");

    // Tour Packages API
    app.get("/tourPackages", async (req, res) => {
      const result = await tourPackagesCollection.find().toArray();
      res.send(result);
    });

    app.post("/api/tourPackages", async (req, res) => {
      const tour = req.body;
      console.log(tour);
      const result = await tourPackagesCollection.insertOne(tour);
      res.send(result);
    });

    app.patch("/tourPackages/update/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;

      try {
        console.log("Received update for tour package:", updatedData);

        const result = await tourPackagesCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );
        res.send(result);
      } catch (err) {
        console.error("❌ Failed to update tour package", err);
        res.status(500).json({ error: "Failed to update tour package" });
      }
    });

    // app.get("/tourPackages/:id", async (req, res) => {
    //   const id = req.params.id;
    //   try {
    //     const result = await tourPackagesCollection.findOne({
    //       _id: new ObjectId(id),
    //     });
    //     if (!result) {
    //       return res.status(404).json({ message: "Tour package not found" });
    //     }
    //     res.json(result);
    //   } catch (error) {
    //     console.error("Error fetching tour package by ID:", error);
    //     res.status(500).json({ error: "Server error" });
    //   }
    //   console.log("Fetching tour package by ID:", id);
    // });

    app.get("/tourDetails/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await tourPackagesCollection.findOne(query);
      res.send(result);
    });

    app.delete("/tourPackages/:id", async (req, res) => {
      const id = req.params.id;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      try {
        const result = await tourPackagesCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Package not found" });
        }

        res.json(result);
      } catch (err) {
        console.error("Failed to delete package", err);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    //group tour
    app.get("/group-tours", async (req, res) => {
      const tours = await groupTourCollection.find().toArray();
      res.send(tours);
    });

    app.post("/group-tours", async (req, res) => {
      const tour = req.body;
      const result = await groupTourCollection.insertOne(tour);
      res.send(result);
    });

    app.patch("/group-tours/:id/book", async (req, res) => {
      const id = req.params.id;
      const bookedSlots = req.body.slots || 1;

      const result = await groupTourCollection.updateOne(
        { _id: new ObjectId(id) },
        { $inc: { availableSlots: -bookedSlots } }
      );

      res.send(result);
    });

    app.patch("/group-tours/update/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;

      try {
        const result = await groupTourCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );
        res.send(result);
      } catch (err) {
        console.error("Failed to update group tour", err);
        res.status(500).json({ error: "Failed to update group tour" });
      }
    });

    // app.get("/group-tours/:id", async (req, res) => {
    //   const id = req.params.id;
    //   try {
    //     // Check if ID is valid ObjectId
    //     if (!ObjectId.isValid(id)) {
    //       return res.status(400).json({ message: "Invalid ID format" });
    //     }

    //     const result = await groupTourCollection.findOne({
    //       _id: new ObjectId(id),
    //     });
    //     if (!result) {
    //       return res.status(404).json({ message: "Tour not found" });
    //     }
    //     res.json(result);
    //   } catch (error) {
    //     console.error("Error fetching tour by ID:", error);
    //     res.status(500).json({ error: "Server error" });
    //   }
    // });

    app.get("/group-tours/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await groupTourCollection.findOne(query);
      res.send(result);
    });

    app.delete("/group-tours/:id", async (req, res) => {
      const id = req.params.id;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      try {
        const result = await groupTourCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Package not found" });
        }

        res.json(result);
      } catch (err) {
        console.error("Failed to delete package", err);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // user custom tour
    app.post("/usercustomtour", async (req, res) => {
      try {
        const booking = req.body;
        booking.status = "pending";
        booking.createdAt = new Date();

        const result = await customTourCollection.insertOne(booking);
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: "Failed to book custom tour" });
      }
    });

    app.get("/api/custom-bookings", async (req, res) => {
      const tours = await customTourCollection.find().toArray();
      res.send(tours);
    });

    app.delete("/api/custom-bookings/:id", async (req, res) => {
      const id = req.params.id;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      try {
        const result = await customTourCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Package not found" });
        }

        res.json(result);
      } catch (err) {
        console.error("Failed to delete package", err);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/group-tours/user/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const tours = await groupTourCollection
          .find({ "createdBy.email": email })
          .toArray();
        res.json(tours);
        console.log("Fetching group tours for user:", email);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    // Add delete endpoint
    app.delete("/group-tours/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await groupTourCollection.deleteOne({
          _id: new ObjectId(id),
        });
        if (result.deletedCount === 0) {
          return res.status(404).json({ message: "Tour not found" });
        }
        res.json({ message: "Tour deleted successfully" });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
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

    // Update user by ID (for role changes)
    app.patch("/users/id/:id", async (req, res) => {
      const id = req.params.id;
      const { userRole } = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      if (!userRole) {
        return res.status(400).json({ error: "userRole is required" });
      }

      try {
        const result = await userCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { userRole } }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        res.json(result);
      } catch (err) {
        console.error("Failed to update user role", err);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Delete user by ID
    app.delete("/users/id/:id", async (req, res) => {
      const id = req.params.id;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      try {
        const result = await userCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        res.json(result);
      } catch (err) {
        console.error("Failed to delete user", err);
        res.status(500).json({ error: "Internal server error" });
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

    // complians
    app.post("/complain", async (req, res) => {
      const complaint = req.body;
      try {
        const result = await complainCollection.insertOne(complaint);
        res.status(200).json({
          message: "Complaint submitted",
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error("Error inserting complaint:", error);
        res.status(500).json({ error: "Failed to store complaint" });
      }
    });

    // get hotels info
    app.get("/hotels", async (req, res) => {
      try {
        const hotels = await hotelsCollection.find().toArray();
        res.send(hotels);
      } catch (err) {
        res.status(500).send({ error: "Failed to fetch hotels" });
      }
    });

    app.post("/hotels", async (req, res) => {
      const hotel = req.body;
      try {
        const result = await hotelsCollection.insertOne(hotel);
        res.status(200).json({
          message: "Hotel added successfully",
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error("Error inserting hotel:", error);
        res.status(500).json({ error: "Failed to add hotel" });
      }
    });

    // stripe payment gateway
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // payments
    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const result = await db.collection("payments").insertOne(payment);
      res.send(result);
      console.log("Payment info:", payment);
    });

    app.get("/payments", async (req, res) => {
      const payments = await paymentsCollection.find().toArray();
      res.send(payments);
    });

    app.get("/payments/tour/:tourId", async (req, res) => {
      try {
        const tourId = req.params.tourId;
        if (!tourId) {
          return res.status(400).json({ message: "Tour ID is required" });
        }

        const payments = await paymentsCollection
          .find({
            tourId: tourId,
          })
          .toArray();

        res.json(payments);
        console.log(payments);
      } catch (err) {
        console.error("Error fetching payments:", err);
        res
          .status(500)
          .json({ message: "Server error while fetching payments" });
      }
    });

    app.get("/payments/:email", async (req, res) => {
      const email = req.params.email;

      if (!email) {
        return res
          .status(400)
          .json({ message: "Email query parameter is required" });
      }

      try {
        const result = await paymentsCollection
          .find({ userEmail: email })
          .toArray();
        res.send(result);
        console.log("Fetching payments for user:", email);
        console.log(result);
      } catch (error) {
        console.error("Error fetching user by email:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    // complains
    app.get("/complains", async (req, res) => {
      try {
        const complains = await complainCollection.find().toArray();
        res.send(complains);
      } catch (err) {
        res.status(500).send({ error: "Failed to fetch hotels" });
      }
    });

    app.post("/complains", async (req, res) => {
      const complains = req.body;
      const result = await db.collection("complains").insertOne(complains);
      res.send(result);
      console.log("complains info:", complains);
    });

    // reviews
    app.get("/reviews", async (req, res) => {
      try {
        const reviews = await reviewsCollection.find().toArray();
        res.send(reviews);
      } catch (err) {
        res.status(500).send({ error: "Failed to fetch reviews" });
      }
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
