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

    // available products api
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const status = "available";
      const query = { categoryid: id, status: status };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    // booked product api
    app.put("/products/:id", async (req, res) => {
      const id = req.params.id;
      const product = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: "booked",
          buyername: product.buyername,
          buyeremail: product.buyeremail,
          phone: product.phone,
          meetinglocation: product.location,
        },
      };
      const result = await productsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // Booked my order api

    app.get("/myorders", async (req, res) => {
      const user = req.query.user;
      const query = { buyername: user };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    // Booked my order payment

    app.get("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    // Payment Intend

    app.post("/create-payment-intent", async (req, res) => {
      const booked = req.body;
      const price = booked.resellingprice;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // payment processed

    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      const id = payment.bookingId;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: "paid",
          transactionId: payment.transactionId,
        },
      };

      const updatedResult = await productsCollection.updateOne(
        filter,
        updatedDoc
      );

      res.send(result);

      // My products api
      app.get("/products", async (req, res) => {
        const user = req.query.user;
        const query = { sellername: user };
        const result = await productsCollection.find(query).toArray();
        res.send(result);
      });

      // delete product api
      app.delete("/products/:id", async (req, res) => {
        const id = req.params.id;
        const filter = { _id: ObjectId(id) };
        const result = await productsCollection.deleteOne(filter);
        res.send(result);
      });

      //Show Advertise api

      app.put("/productsadvertise/:id", async (req, res) => {
        const id = req.params.id;
        const filter = { _id: ObjectId(id) };
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            advertise: true,
          },
        };
        const result = await productsCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        res.send(result);
      });

      // booked my buyer api

      app.get("/bookedbuyer", async (req, res) => {
        const user = req.query.user;
        const query = { sellername: user, status: "booked", status: "paid" };
        const result = await productsCollection.find(query).toArray();
        res.send(result);
      });

      //add products api
      app.post("/products", async (req, res) => {
        const product = req.body;
        const result = await productsCollection.insertOne(product);
        res.send(result);
      });

      //------------------------------------------------------//

      // sellerData needed

      app.get("/sellerdata", async (req, res) => {
        const name = req.query.name;
        const query = { name: name };
        const result = await usersCollection.findOne(query);
        res.send(result);
      });

      app.get("/allsellers", async (req, res) => {
        const type = "seller";
        const query = { accountType: type };
        const result = await usersCollection.find(query).toArray();
        res.send(result);
      });

      app.get("/allbuyers", async (req, res) => {
        const type = "buyer";
        const query = { accountType: type };
        const result = await usersCollection.find(query).toArray();
        res.send(result);
      });
    });
  } finally {
  }
}
run().catch(console.log);

app.get("/", async (req, res) => {
  res.send("Salvage Yard server is running");
});

app.listen(port, () => console.log(`Salvage Yard running on ${port}`));
