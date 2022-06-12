// @ts-check
require('dotenv').config();
const { Server } = require('ws');
const { getLogger } = require('loglevel');
const { Session } = require('./session');

const logger = getLogger('websocket');
logger.setDefaultLevel('INFO');

const { PORT = '80' } = process.env;

// Max payload is 1MB
const MAX_PAYLOAD_SIZE = 1024 * 1024 * 1;
/** Max number of errors before shunning a client */
const MAX_STRIKE_COUNT = 10;

const server = new Server({
  port: Number(PORT),
  maxPayload: MAX_PAYLOAD_SIZE,
});

server.on('listening', () => {
  logger.info(`Server listening on port ${PORT}`);
});

server.on('error', (error) => {
  logger.error(error);
});

/** @type {Map<string, Session>} */
const sessions = new Map();

server.on('connection', (ws, req) => {
  let strikes = 0;
  /** @type {Session | undefined} */
  let session = undefined;

  // Get the address of the client
  const address = req.socket.remoteAddress;

  // Log the connection
  logger.info(`Connection from ${address}`);

  ws.on('error', (error) => {
    logger.error('Error from client', address, error.message);

    if (++strikes >= MAX_STRIKE_COUNT) {
      logger.error('Too many errors, closing connection');
      ws.pause();
    }

    logger.warn(`${address} ${strikes} strikes`);
  });

  /** @type {Record<string, (value: string) => void>} */
  const handler = {
    s(value) {
      if (value) {
        session = sessions.get(value);

        if (!session) {
          logger.error(`Session ${value} not found`);
          ws.send('!=Session not found');
          return;
        }

        // Connect this client to the session
        session.answer.socket = ws;

        // If there is an offer, send it to the client
        if (session.offer.sdp) {
          ws.send(`o=${session.offer.sdp}`);
        }

        // If there are addresses, send them to the client
        if (session.offer.addresses.length) {
          for (const address of session.offer.addresses) {
            ws.send(`c=${address}`);
          }
        }
      } else {
        session = new Session();
        sessions.set(session.name, session);
        ws.send(`s=${session.name}`);
      }
    },
    o(value) {
      if (!session) {
        logger.error('Session not found');
        return;
      }

      session.offer.sdp = value;
      session.offer.socket = ws;

      // If there is a participant, send the offer to the participant
      if (session.answer.socket) {
        session.answer.socket.send(`o=${value}`);
      }
    },
    a(value) {
      if (!session) {
        logger.error('Session not found');
        return;
      }

      session.answer.sdp = value;
      session.answer.socket = ws;

      // If there is a participant, send the answer to the participant
      if (session.offer.socket) {
        session.offer.socket.send(`a=${value}`);
      }
    },
    c(value) {
      if (!session) {
        logger.error('Session not found');
        return;
      }

      // If this socket is the offer socket
      if (session.offer.socket === ws) {
        session.offer.addresses.push(value);

        // If there is a participant, send the address to the participant
        if (session.answer.socket) {
          session.answer.socket.send(`c=${value}`);
        }
      } else {
        session.answer.addresses.push(value);

        // If there is an offer, send the address to the offer
        if (session.offer.socket) {
          session.offer.socket.send(`c=${value}`);
        }
      }
    },
  };

  ws.on('message', (message) => {
    const text = message.toString('utf8');
    logger.info(`Message from ${address} // ${text}`);

    const character = text[0];
    const value = text.slice(2).trim();

    try {
      if (!handler[character]) {
        throw new Error(`Unknown character ${character}`);
      }

      handler[character](value);
    } catch (error) {
      logger.error(error);
    }
  });
});
