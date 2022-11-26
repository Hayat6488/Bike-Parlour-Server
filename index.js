const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.djdi1bf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
       const bikesCategory =  client.db('bike-parlour').collection('categories');

       app.get('/categories', async(req, res) => {
        const query = {};
        const cursor = bikesCategory.find(query);
        const categories = await cursor.toArray();
        res.send(categories);
       })

    }
    finally {

    }
}

run().catch(err => console.error(err));



app.get('/', (req, res) => {
    res.send('server is on');
})

app.listen(port, () => {
    console.log(`BP server is running on port: ${port}`);
})