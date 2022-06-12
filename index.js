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
app.get('/k/:key', (req, res) => {
  const { key } = req.params;
  // The table name is the source address of the request.
  const tableName = req.socket.remoteAddress;

  const value = database.get(tableName, key);

  res.send(value);
});

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
app.post('/k/:key', (req, res) => {
  const { key } = req.params;
  // The table name is the source address of the request.
  const tableName = req.socket.remoteAddress;
  // The value is the body of the request.
  const value = req.body;

  database.set(tableName, key, value);

  console.log('value', value);

  res.send('OK');
});
