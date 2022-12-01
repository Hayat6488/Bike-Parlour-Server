const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const stripe = require("stripe")(process.env.STRIPE_SEC)

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.djdi1bf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}

async function run() {
    try {
        const bikesCategory = client.db('bike-parlour').collection('categories');
        const bikesCollection = client.db('bike-parlour').collection('bikes');
        const selectedBikes = client.db('bike-parlour').collection('selectedProduct');
        const usersCollection = client.db('bike-parlour').collection('users');
        const paymentCollection = client.db('bike-parlour').collection('payments');

        app.get('/categories', async (req, res) => {
            const query = {};
            const categories = await bikesCategory.find(query).toArray();
            res.send(categories);
        });

        app.get('/advertised', async (req, res) => {
            const query = { advertise: true };
            const categories = await bikesCollection.find(query).toArray();
            res.send(categories);
        });

        app.get('/categories/:name', async (req, res) => {
            const name = req.params.name;
            const query = { category: name };
            const bikes = await bikesCollection.find(query).toArray();
            res.send(bikes);
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.post('/myorders', async (req, res) => {
            const bike = req.body;
            const result = await selectedBikes.insertOne(bike);
            res.send(result);
        });

        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.get('/myorders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { uid: id };
            const result = await selectedBikes.find(query).toArray();
            res.send(result);
        });

        app.get('/myorders/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await selectedBikes.findOne(query);
            const result = [product];
            res.send(result);
        });

        app.put('/myorders/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateData = req.body;
            const updatedData = {
                $set: {
                    paid: updateData.paid
                }
            }
            const result = await selectedBikes.updateOne(query, updatedData, options);
            res.send(result);
        });

        app.put('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateData = req.body;
            const updatedData = {
                $set: {
                    report: updateData.report
                }
            }
            const result = await bikesCollection.updateOne(query, updatedData, options);
            res.send(result);
        });
        

        app.put('/myproducts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateData = req.body;
            const updatedData = {
                $set: {
                    sold: updateData.paid,
                    advertise: updateData.advertise
                }
            }
            const result = await bikesCollection.updateOne(query, updatedData, options);
            res.send(result);
        });

        app.get('/myproducts', async (req, res) => {
            const uid = req.params.uid;
            const query = { uid: uid };
            const result = await bikesCollection.find(query).toArray();
            res.send(result);
        });

        app.post('/bikes', async (req, res) => {
            const bike = req.body;
            const result = await bikesCollection.insertOne(bike);
            res.send(result);
        });

        app.post('/payments', async (req, res) => {
            const bike = req.body;
            const result = await paymentCollection.insertOne(bike);
            res.send(result);
        });

        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        app.get('/user', async (req, res) => {
            const id = req.query.uid;
            const query = { uid: id };
            const result = await usersCollection.findOne(query);
            const user = [result];
            res.send(user);
        });

        app.get('/users/buyer', async (req, res) => {
            const buyer = 'Buyer';
            const query = { role: buyer };
            console.log(usersCollection);
            const result = await usersCollection.find(query).toArray();
            const user = [result];
            res.send(user);
        });

        app.get('/users/seller', async (req, res) => {
            const seller = 'Seller';
            const query = { role: seller };
            const result = await usersCollection.find(query).toArray();
            const user = [result];
            res.send(user);
        });

        app.get('/products/reported', async (req, res) => {
            const report = true;
            const query = { report: report };
            const products = await bikesCollection.find(query).toArray();
            res.send(products);
        });

        app.get('/jwt', async (req, res) => {
            const uid = req.query.uid;
            const query = { uid: uid };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ uid }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
                return res.send({ accessToken: token })
            }
            console.log(user);
            res.status(403).send({ accessToken: '' })
        });

        app.delete('/myproducts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await bikesCollection.deleteOne(query);
            res.send(result);
        });

        app.delete('/users/buyer/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        });

        app.delete('/users/seller/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        });

        app.put('/users/seller/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateData = req.body;
            const updatedData = {
                $set: {
                    verified: updateData.verified
                }
            }
            const result = await usersCollection.updateOne(query, updatedData, options);
            res.send(result);
        });

        app.put('/myproducts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateData = req.body;
            const updatedData = {
                $set: {
                    advertise: updateData.advertise
                }
            }
            const result = await bikesCollection.updateOne(query, updatedData, options);
            res.send(result);
        });

        app.get('/jwts', async (req, res) => {
            const uid = req.query.uid;
            const query = { uid: uid };
            const user = await usersCollection.findOne(query);
            if (!user) {
                const token = jwt.sign({ uid }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
                return res.send({ accessToken: token })
            }
            console.log(user);
            res.status(403).send({ accessToken: '' })
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