require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');

// initialize
const app = express();

// middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

const port = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.send('Hello World!')
})

// start server
app.listen(port, () => {
    console.log(`Server listening on ${port}`)
});

module.exports = app;
