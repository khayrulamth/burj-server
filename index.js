require('dotenv').config();
const express = require('express')
const app = express()
const cors = require('cors');
const port = 4000;
const admin = require('firebase-admin');
const { MongoClient } = require('mongodb');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.19mvk.mongodb.net/${process.env.DB_USER}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

//middleware for body and cors
app.use(express.json());
app.use(cors());

//firebase admin sdk
var serviceAccount = require("./configs/burj-al-khalifa-be3dd-firebase-adminsdk-5lgy5-fd8a7f9abe.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

client.connect(err => {
    const bookings = client.db("burjAlKhalifa").collection("bookings");
    //   console.log('database connection established');

    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        bookings.insertOne(newBooking)
            .then(result => {
                res.status(200).send(result.insertedCount > 0);
            })
        console.log(newBooking);
    })

    app.get('/bookings', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            console.log(idToken);
            admin.auth().verifyIdToken(idToken)
                .then((decodedToken) => {
                    const uid = decodedToken.uid;
                    console.log("uid", uid);
                    let tokenEmail = decodedToken.email;
                    if (tokenEmail === req.query.email) {
                        bookings.find({ email: req.query.email })
                            .toArray((err, documents) => {
                                res.send(documents)
                                console.log(tokenEmail, req.query.email);
                            })
                    }
                    else {
                        res.status(401).send('Unauthorized access');
                    }
                })
                .catch((error) => {
                    // Handle error
                });
        }
        else {
            res.status(401).send('Unauthorized access');
        }

        // idToken comes from the client app
    })

});

app.get('/', (req, res) => {
    res.send('Welcome to the new World!')
})

app.listen(port)