const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const { query } = require("express");
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vzv196q.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const productCollection = client.db("Ema-John-main").collection("products");
    const cartCollection = client.db("Ema-John-main").collection("cart");

    //get products
    app.get("/allproducts", async (req,res)=>{
      const query = {};
      const cursor = productCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })
    //get products with pagination
    app.get("/products", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const query = {};
      const cursor = productCollection.find(query);
      let products;
      if(page){
        products = await cursor.skip(page*size).limit(size).toArray();
      }
      else{
        products = await cursor.limit(10).toArray();
      }
      res.send(products);
    });
    //get amount of data
    app.get("/productCount", async (req, res) => {
      const count = await productCollection.estimatedDocumentCount();
      res.send({count});
    });
    //get cart
    app.get("/cart", async (req, res) => {
      const query = {};
      const cursor = cartCollection.find(query);
      const cart = await cursor.toArray();
      res.send(cart);
    });
    
    //post product to cart
    app.post("/cart", async (req, res) => {
      const newproduct = req.body;
      const result = await cartCollection.insertOne(newproduct);
    });
    //update cart product
    app.put("/cart",async(req,res)=>{
      const updatedProduct = req.body
      const id = updatedProduct._id;
      const filter = {_id:id};
      const options = { upsert: true };
      const updatedDoc = {
            $set: {
              quantity: updatedProduct.quantity
            }
      };
      const result = await cartCollection.updateOne(filter, updatedDoc ,options);
      res.send(result)

    })
     //delete cart product
     app.delete('/cart' , async(req,res)=>{
      const id = req.body._id;
      if(id){
        const query = {_id:id};
        const result = await cartCollection.deleteOne(query);
        res.send(result)
      }
      else{
        const query = {img:{$regex:"https"}};
        const result = await cartCollection.deleteMany(query);
        res.send(result )
      } 
    })
  }
  
  finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Ema-john server running");
});

app.listen(port, () => {
  console.log("Listening at port", port);
});
