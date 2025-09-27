// db.js

const mongoose = require('mongoose');

//const dbURI = 'mongodb+srv://ahmedadeel164722:20020Chand@cluster0.nx4zcye.mongodb.net/assoonaspossible?retryWrites=true&w=majority'; 
//const dbURI = 'mongodb+srv://sufianali122nb:1234sufi@cluster0.0qnf0nx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; 
// const dbURI = 'mongodb+srv://eservices908:u0jn1XgFubvsPyIB@asap-cluster.mlctjlz.mongodb.net/?retryWrites=true&w=majority&appName=ASAP-Cluster'; 
 const dbURI = 'mongodb+srv://inquiriesesa_db_user:12345678usamabhai@cluster0.nnuct9e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });

const dbConnection = mongoose.connection;

dbConnection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

dbConnection.once('open', () => {
  console.log('Connected to MongoDB');
});

module.exports = dbConnection;