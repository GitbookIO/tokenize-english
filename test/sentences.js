var _ = require("lodash");
var fs = require("fs");
var path = require("path");
var should = require("should");

var tokenize = require('tokenize-text')();
var tokenizeHtml = require('tokenize-htmltext');

var english = require("../")(tokenize);

var TEST_HTML = fs.readFileSync(path.resolve(__dirname, './fixtures/test.html'), { encoding: 'utf-8' });

describe("Sentences Tokeniser", function() {
    it("should split correctly", function() {
        var sentences = english.sentences()("First. Second.");

        sentences[0].value.should.be.equal("First.");
        sentences[0].index.should.be.equal(0);
        sentences[0].offset.should.be.equal(6);

        sentences[1].value.should.be.equal(" Second.");
        sentences[1].index.should.be.equal(6);
        sentences[1].offset.should.be.equal(8);
    });

    it("should handle urls", function() {
        var sentences = english.sentences()("Google is accessible at https://www.google.fr.");

        sentences.length.should.be.equal(1);
        sentences[0].value.should.equal('Google is accessible at https://www.google.fr.');
    });

    it("should handle abbreviation (1)", function() {
        var sentences = english.sentences()("On Jan. 20, former Sen. Barack Obama became the 44th President of the U.S. Millions attended the Inauguration.");

        sentences.length.should.be.equal(2);
        sentences[0].value.should.equal('On Jan. 20, former Sen. Barack Obama became the 44th President of the U.S.');
        sentences[1].value.should.equal(' Millions attended the Inauguration.');
    });

    it("should handle abbreviation (2)", function() {
        var sentences = english.sentences()("Sen. Barack Obama became the 44th President of the US. Millions attended.");
        sentences.length.should.be.equal(2);
    });

    it("should handle abbreviation (3)", function() {
        var sentences = english.sentences()("Barack Obama, previously Sen. of lorem ipsum, became the 44th President of the U.S. Millions attended.");
        sentences.length.should.be.equal(2);
    });

    it("should handle dot in middle of word if followed by capital letter", function() {
        var sentences = english.sentences()("Hello Barney.The bird in the word.");
        sentences.length.should.be.equal(2);
        sentences[0].value.should.equal('Hello Barney.');
        sentences[1].value.should.equal('The bird in the word.');
    });

    it("should handle question- and exlamation mark", function() {
        var sentences = english.sentences()("Hello this is my first sentence? There is also a second! A third");
        sentences.length.should.be.equal(3);
    });

    it("should handle emails", function() {
        var sentences = english.sentences()("send me an email: gg@gggg.kk");
        sentences.length.should.be.equal(1);
    });

    it("should handle newline as boundaries", function() {
        var sentences = english.sentences()("This is my first sentence\nSecond");
        sentences.length.should.be.equal(2);

        sentences[0].index.should.be.equal(0);
        sentences[0].offset.should.be.equal(26);

        sentences[1].index.should.be.equal(26);
        sentences[1].offset.should.be.equal(6);
    });

    it("should extract correctly sentences from HTML (simple)", function() {
        var html = tokenizeHtml('<p>On <b>Jan. 20</b>, former <a href="#">Sen. Barack Obama</a> became the 44th President of the U.S. Millions attended the Inauguration.</p>');
        var sentences = english.sentences()(html);

        sentences.length.should.be.equal(2);
        sentences[0].value.should.equal('On Jan. 20, former Sen. Barack Obama became the 44th President of the U.S.');
        sentences[0].offset.should.equal(97);
        sentences[0].index.should.equal(3);

        sentences[1].value.should.equal(' Millions attended the Inauguration.');
        sentences[1].offset.should.equal(36);
        sentences[1].index.should.equal(100);
    });

    it("should extract correctly sentences from HTML (mid)", function() {
        var html = tokenizeHtml(TEST_HTML);
        var sentences = english.sentences()(html);

        sentences.length.should.be.equal(5);
    });

    it('should correctly merge tokens and split into sentences', function() {
        var tokens = [
            {
                value: "When an x86-based computer is turned on, it begins a complex path to get to the stage where control is transferred to our kernel's \"main\" routine (",
                index: 62,
                offset: 147
            },
            {
                value: "). For this course, we are only going to consider the BIOS boot method and not it's successor (UEFI).",
                index: 218,
                offset: 101
            }
        ];

        var sentences = english.sentences()(tokens);
        sentences.should.have.lengthOf(2);
        sentences[0].index.should.equal(62);
        sentences[0].offset.should.equal(158);
        sentences[0].value.should.equal('When an x86-based computer is turned on, it begins a complex path to get to the stage where control is transferred to our kernel\'s "main" routine ().');

        sentences[1].index.should.equal(220);
        sentences[1].offset.should.equal(99);
        sentences[1].value.should.equal(' For this course, we are only going to consider the BIOS boot method and not it\'s successor (UEFI).')
    });
});
