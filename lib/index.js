/*
Sentence Boundary Detection (SBD)
Split text into sentences with a vanilla rule based approach (i.e working ~95% of the time).

Split a text based on period, question and exclamation marks.
Skips (most) abbreviations (Mr., Mrs., PhD.)
Skips numbers/currency
Skips urls, websites, email addresses, phone nr.
Counts ellipsis and ?! as single punctuation
*/

var _ = require("lodash");

var utils = require("./utils");
var abbreviations = require('./abbreviations');

function isCapitalized(str) {
    return /^[A-Z][a-z].*/.test(str) || isNumber(str);
}

// Start with opening quotes or capitalized letter
function isSentenceStarter(str) {
    return isCapitalized(str) || /``|"|'/.test(str.substring(0,2));
}

function isCommonAbbreviation(str) {
    return ~abbreviations.indexOf(str.replace(/\W+/g, ''));
}

// This is going towards too much rule based
function isTimeAbbreviation(word, next) {
    if (word === "a.m." || word === "p.m.") {
        var tmp = next.replace(/\W+/g, '').slice(-3).toLowerCase();

        if (tmp === "day") {
            return true;
        }
    }

    return false;
}

function isDottedAbbreviation(word) {
    var matches = word.replace(/[\(\)\[\]\{\}]/g, '').match(/(.\.)*/);
    return matches && matches[0].length > 0;
}

// TODO look for next words, if multiple capitalized -> not sentence ending
function isCustomAbbreviation(str) {
    if (str.length <= 3)
        return true;

    return isCapitalized(str);
}

// Uses current word count in sentence and next few words to check if it is
// more likely an abbreviation + name or new sentence.
function isNameAbbreviation(wordCount, words) {
    if (words.length > 0) {
        if (wordCount < 5 && words[0].length < 6 && isCapitalized(words[0])) {
            return true;
        }

        var capitalized = words.filter(function(str) {
            return /[A-Z]/.test(str.charAt(0));
        });

        return capitalized.length >= 3;
    }

    return false;
}

function isNumber(str, dotPos) {
    if (dotPos) {
        str = str.slice(dotPos-1, dotPos+2);
    }

    return !isNaN(str);
}

// Phone number matching
// http://stackoverflow.com/a/123666/951517
function isPhoneNr(str) {
    return str.match(/^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/);
}

// Match urls / emails
// http://stackoverflow.com/a/3809435/951517
function isURL(str) {
    return str.match(/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/);
}

// Starting a new sentence if beginning with capital letter
// Exception: The word is enclosed in brackets
function isConcatenated(word) {
    var i = 0;

    if ((i = word.indexOf(".")) > -1 ||
        (i = word.indexOf("!")) > -1 ||
        (i = word.indexOf("?")) > -1)
    {
        var c = word.charAt(i + 1);

        // Check if the next word starts with a letter
        if (c.match(/[a-zA-Z].*/)) {
            return [word.slice(0, i), word.slice(i+1)];
        }
    }

    return false;
}

function isBoundaryChar(word) {
    return word === "." ||
           word === "!" ||
           word === "?";
}

// http://tech.grammarly.com/blog/posts/How-to-Split-Sentences.html
function tokenizeSentences(tokenize, opts) {
    opts = _.defaults(opts || {}, {
        newlineBoundary: true
    });

    return tokenize.flow(
        // Split into words
        tokenize.re(/\S+/),
        tokenize.splitAndMerge(function(word, token, prev, next) {
            var endOfSentence = [word, null];

            // Newline boundaries
            if (word === "\n" && opts.newlineBoundary) return endOfSentence;

            // Increase count of words
            //wordCount++;

            // Add the word to current sentence
            //if (current.length == 0) sentenceIndex = token.index;
            //current.push(word);

            // Sub-sentences (Bijzin?), reset counter
            /*if (~word.indexOf(',')) {
                wordCount = 0;
            }*/

            if (isBoundaryChar(word)      ||
                utils.endsWithChar(word, "?!"))
            {
                return endOfSentence;
            }

            // A dot might indicate the end sentences
            // Exception: The next sentence starts with a word (non abbreviation)
            //            that has a capital letter.
            if (utils.endsWithChar(word, '.')) {

                // Check if there is a next word
                if (next) {
                    // This should be improved with machine learning

                    // Single character abbr.
                    if (word.length === 2 && isNaN(word.charAt(0))) {
                        return word;
                    }

                    // Common abbr. that often do not end sentences
                    if (isCommonAbbreviation(word)) {
                        return word;
                    }

                    // Next word starts with capital word, but current sentence is
                    // quite short
                    if (isSentenceStarter(next.value)) {
                        if (isTimeAbbreviation(word, next.value)) {
                            return word;
                        }

                        // Dealing with names at the start of sentences
                        /*if (isNameAbbreviation(wordCount, words.slice(i, 6))) {
                            return word;
                        }*/

                        if (isNumber(next.value) && isCustomAbbreviation(word)) {
                            return word;
                        }
                    }
                    else {
                        // Skip ellipsis
                        if (utils.endsWith(word, "..")) {
                            return word;
                        }

                        //// Skip abbreviations
                        // Short words + dot or a dot after each letter
                        if (isDottedAbbreviation(word) || isCustomAbbreviation(word)) {
                            return word;
                        }
                    }
                }

                return endOfSentence;
            }

            // Check if the word has a dot in it
            if ((index = word.indexOf(".")) > -1) {
                if (isNumber(word, index)) {
                    return word;
                }

                // Custom dotted abbreviations (like K.L.M or I.C.T)
                if (isDottedAbbreviation(word)) {
                    return word;
                }

                // Skip urls / emails and the like
                if (isURL(word) || isPhoneNr(word)) {
                    return word;
                }
            }

            /*if (temp = isConcatenated(word)) {
                current.pop();
                current.push(temp[0]);

                pushCurrent();
                current.push(temp[1]);
                sentenceIndex = token.index + temp[0].length + 1;
            }*/

            return word;
        })
    );
};

module.exports = function(tokenize) {
    return {
        sentences: _.partial(tokenizeSentences, tokenize)
    };
};
