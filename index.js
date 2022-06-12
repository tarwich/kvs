require('dotenv').config();
const express = require('express');
const { Database } = require('./database');

const { PORT = '80' } = process.env;

const database = new Database();
const app = express();

// Install body parsers
app.use(express.text());
app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
app.get('/k/:table/:key', (req, res) => {
  const { table, key } = req.params;

  const value = database.get(table, key)?.value;

  res.send(value);
});

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
app.post('/k/:table/:key', (req, res) => {
  const { table, key } = req.params;
  const author = req.socket.remoteAddress;
  // The value is the body of the request.
  const value = req.body;

  // Prevent writes if author empty
  if (!author) {
    console.log('Author is empty');
    res.status(400).send('Invalid author');
    return;
  }

  database.set(table, key, value, author);

  res.send('OK');
});
