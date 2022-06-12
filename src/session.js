const { generatePhrase } = require('./phrase-generator');

/** @typedef {import('ws').WebSocket} WebSocket */

class Session {
  name = generatePhrase(3);

  offer = {
    sdp: '',
    /** @type {string[]} */
    addresses: [],
    /** @type {WebSocket | undefined} */
    socket: undefined,
  };

  answer = {
    sdp: '',
    /** @type {string[]} */
    addresses: [],
    /** @type {WebSocket | undefined} */
    socket: undefined,
  };
}

module.exports = { Session };
