const express=require("express")
const app=express()
const jwt = require('jsonwebtoken');
require('dotenv').config()
const cors = require("cors");
app.use(cors());
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { query } = require('express')

const port = process.env.PORT || 8000;
app.use(express.json());
app.get('/',(req,res)=>{
    res.send("Hello Southern Loft  backend sever")
})
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorize Access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
    })
    next();
}
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7auxx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const Productcollection=client.db("mahirafu").collection("product-item")
        //auth
        app.post('/token', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({ accessToken })
        })
        //api
       app.get('/inventory',async(req,res)=>{
        const query={}
        const result=Productcollection.find(query)
        const item=await result.toArray()
        res.send(item)
       })
       //specific item find
       app.get('/inventory/:id',async(req,res)=>{
           const id=(req.params.id);
           const query={_id:ObjectId(id)}
           const result=await Productcollection.findOne(query)
           res.send(result)
       })
     //add new item
     app.post('/inventory',async(req,res)=>{
         const doc =req.body;
         const result=await Productcollection.insertOne(doc)
         res.send(result)
         
     })
     //my item
     app.get('/myitem', verifyJWT, async (req, res) => {
        const decodedEmail = req.decoded.email;
        const email = req.query.email;
        console.log(email);
        if (email === decodedEmail) {
            const query = { email: email };
            const cursor = Productcollection.find(query);
            const myItem = await cursor.toArray();
            res.send(myItem);
        } else {
            res.status(403).send({ message: 'Forbidden Access' })
        }
    })
     //delete specific item
     app.delete('/inventory/:id',async(req,res)=>{
         const id=req.params.id;
         const query={_id:ObjectId(id)}
         const result = await Productcollection.deleteOne(query);
         res.send(result)

     })
     //update specific item
     app.put('/inventory/:id', async (req, res) => {
        const id = req.params.id;
        const updatedQuantity = req.body.updatedQuantity;
        console.log(updatedQuantity);
        const filter = { _id: ObjectId(id) };
        console.log(filter);
        const options = { upsert: true };
        const updatedDoc = {
            $set: {
                quantity: updatedQuantity
            }
        };
        const result = await Productcollection.updateOne(filter, updatedDoc, options);
            
            res.send(result);

        })

    }
    finally{

    }

}
run().catch(console.dir)
app.listen(port,()=>{
    console.log(`Running server ${port}`);
})