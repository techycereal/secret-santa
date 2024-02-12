// Import required modules
const http = require('http');             // HTTP module to create an HTTP server.
const express = require('express');       // Express framework for handling requests and responses.
const db = require('./database');         // Custom database module for database operations.
const bodyParser = require('body-parser'); // Middleware for parsing incoming request bodies.
const cors = require('cors');             // Middleware for enabling CORS (Cross-Origin Resource Sharing).

// Initialize an Express application
const app = express();

// Middleware setup
app.use(cors());                           // Enable CORS for all routes.
app.use(bodyParser.json());                // Parse JSON bodies of incoming requests.

// POST endpoint to create a new group
app.post('/createGroup', async (req, res) => {
    console.log(req.body);
    const response = await db.createGroup(req.body.groupName);
    res.send(response);                     // Send the response from the database operation.
});

// POST endpoint to add a new member to a group
app.post('/add', async (req, res) => {
    const response = await db.add(req.body.groupCode, req.body.name);
    console.log('here')
    res.send(response);                     // Send the response from the database operation.
});

// POST endpoint for admin sign-in
app.post('/adminsignin', async (req, res) => {
    const response = await db.adminSignIn(req.body.groupCode, req.body.adminCode);
    res.send(response);                     // Send the response from the database operation.
});

// GET endpoint to randomize elements within a group
app.get('/random/:code', async (req, res) => {
    db.randomize(req.params.code);
    return res.send('true');                // Always returns 'true'.
});

app.get('/getallpairs/:groupcode', async (req, res) => {
    const myPairs = await db.getAllPairs(req.params.groupcode);
    res.send(myPairs);                // Always returns 'true'.
});

app.get('/getpairs/:code/:groupcode', async (req, res) => {
    const myPairs = await db.getpairs(req.params.code, req.params.groupcode);
    res.send(myPairs);                // Always returns 'true'.
});

// GET endpoint for user sign-in using a group code
app.get('/signin/:code', async (req, res) => {
    const signedIn = await db.signin(req.params.code);
    res.send(signedIn);                      // Send the response from the database operation.
});

// GET endpoint for retrieving sign-in information
app.get('/signins/:code', async (req, res) => {
    const signedIn = await db.signins(req.params.code);
    res.send(signedIn);                      // Send the response from the database operation.
});

// POST endpoint to write a list for a group
app.post('/write_list', async (req, res) => {
    const response = await db.write(req.body.groupCode, req.body.user, req.body.item);
    res.send(response);                     // Send the response from the database operation.
});

// POST endpoint to delete a user from a group
app.post('/deleteuser', async (req, res) => {
    const response = await db.removeUser(req.body.groupCode, req.body.personId);
    res.send(response);                     // Send the response from the database operation.
});

app.get('/deletegroup/:code', async (req, res) => {
    const groupCode = req.params.code
    const response = await db.deleteGroup(groupCode);
    res.send(response);                     // Send the response from the database operation.
});

// Create an HTTP server and listen on port 5000
const server = http.createServer(app);
server.listen(5000);
