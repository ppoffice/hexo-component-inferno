/**
 * Pure option splitting for the Hexo tabs tag and its individual tab comments.
 * @module util/tab-options
 */

/**
 * Split a tabs option at its first colon, without trimming or interpreting the value.
 * @param {string} option An option such as <code>title:Step 1: Install</code>.
 * @returns {string[]} The key and value, or only the key when there is no colon.
 */
function splitOption(option) {
  const index = option.indexOf(':');
  return index === -1 ? [option] : [option.slice(0, index), option.slice(index + 1)];
}

/**
 * Split individual tab comment options on ASCII spaces, respecting leading single or double quotes.
 * Quotes within bare tokens are literal. Backslashes inside quotes protect the next character from
 * closing the token, but remain in the result; they do not escape spaces in bare tokens.
 * @param {string} source The option text inside a <code>&lt;!-- tab ... --&gt;</code> comment.
 * @returns {string[]} Options with enclosing quotes removed and all other characters preserved.
 * @throws {Error} For an unclosed quoted option or a non-space character after its closing quote.
 */
function splitTabOptions(source) {
  const options = [];
  const EOL = -1;

  let i = 0;
  let state = 1;
  let begin = 0;

  while (i <= source.length) {
    const c = i < source.length ? source.charAt(i) : '';
    switch (state) {
      case 1: // Start of an option
        if (c === ' ') {
          state = 1;
          begin = i + 1;
        } else if (c === '"') {
          state = 2;
          begin = i + 1;
        } else if (c === "'") {
          state = 4;
          begin = i + 1;
        } else if (c === '') {
          state = EOL;
        } else {
          state = 7;
        }
        break;
      case 2: // Double-quoted option
        if (c === '\\') {
          state = 3;
        } else if (c === '"') {
          state = 6;
        }
        break;
      case 3: // Escaped character in a double-quoted option
        state = 2;
        break;
      case 4: // Single-quoted option
        if (c === '\\') {
          state = 5;
        } else if (c === "'") {
          state = 6;
        }
        break;
      case 5: // Escaped character in a single-quoted option
        state = 4;
        break;
      case 6: // The preceding character closed the quote
        options.push(source.substring(begin, i - 1));
        begin = i + 1;
        if (c === ' ') {
          state = 1;
        } else if (c === '') {
          state = EOL;
        } else {
          throw new Error(`malformatted tab options: ${source}`);
        }
        break;
      case 7: // Bare option
        if (c === ' ') {
          options.push(source.substring(begin, i));
          begin = i + 1;
          state = 1;
        } else if (c === '') {
          options.push(source.substring(begin, i));
          begin = i + 1;
          state = EOL;
        }
        break;
    }
    i++;
  }

  if (state !== EOL) {
    throw new Error(`malformatted tab options: ${source}`);
  }

  return options;
}

module.exports = { splitOption, splitTabOptions };
