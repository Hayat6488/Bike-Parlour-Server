const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.djdi1bf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const bikesCategory = client.db('bike-parlour').collection('categories');
        const bikesCollection = client.db('bike-parlour').collection('bikes');
        const usersCollection = client.db('bike-parlour').collection('users');

        app.get('/categories', async (req, res) => {
            const query = {};
            const categories = await bikesCategory.find(query).toArray();
            res.send(categories);
        });

        app.get('/categories/:name', async (req, res) => {
            const name = req.params.name;
            const query = { name: name };
            const bikes = await bikesCollection.find(query).toArray();
            res.send(bikes);
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        app.get('/jwt', async(req, res) => {
            const uid = req.query.uid;
            const query = {uid: uid};
            const user = await usersCollection.findOne(query);
            if(user){
                const token = jwt.sign({uid}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1d'});
                return res.send({accessToken:  token})
            }
            console.log(user);
            res.status(403).send({accessToken:  ''})
        });

        app.get('/jwts', async(req, res) => {
            const uid = req.query.uid;
            const query = {uid: uid};
            const user = await usersCollection.findOne(query);
            if(!user){
                const token = jwt.sign({uid}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1d'});
                return res.send({accessToken:  token})
            }
            console.log(user);
            res.status(403).send({accessToken:  ''})
        });

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