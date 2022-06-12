// @ts-check
const { readFileSync } = require('fs');

const WORD_LIST = `${__dirname}/../words/words-3.txt`;

const words = readFileSync(WORD_LIST, 'utf8').trim().split('\n');

/**
 * @param {number} numWords
 */
const generatePhrase = (numWords) => {
  const phrase = [];

  for (let i = 0; i < numWords; i++) {
    phrase.push(words[Math.floor(Math.random() * words.length)]);
  }

  return phrase.join(' ');
};

module.exports = {
  generatePhrase,
};
