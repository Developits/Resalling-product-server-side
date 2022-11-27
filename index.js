const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const jwt = require("jsonwebtoken");
require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.17bd64i.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const categoryCollection = client.db("salvageYard").collection("category");
    const productsCollection = client.db("salvageYard").collection("products");
    const usersCollection = client.db("salvageYard").collection("users");
    const reviewsCollection = client.db("salvageYard").collection("reviews");
    const paymentsCollection = client.db("salvageYard").collection("payments");

    //-------------------------------------------------------//

    //calling category
    app.get("/category", async (req, res) => {
      const query = {};
      const result = await categoryCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/advertiseproduct", async (req, res) => {
      const query = { advertise: true, status: "available" };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    //-------------------------------------------------------//
  } finally {
  }
}
run().catch(console.log);

app.get("/", async (req, res) => {
  res.send("Salvage Yard server is running");
});

app.listen(port, () => console.log(`Salvage Yard running on ${port}`));
