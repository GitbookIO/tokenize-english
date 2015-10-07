var _ = require("lodash");
var should = require("should");

var tokenize = require('tokenize-text')();
var english = require("../")(tokenize);

describe("Sentences Tokeniser", function() {
    it("should split correctly", function() {
        var sentences = english.sentences()("First. Second.");
        _.pluck(sentences, "value").should.be.eql(["First.", "Second."]);

        sentences[0].index.should.be.equal(0);
        sentences[0].offset.should.be.equal(6);

        sentences[1].index.should.be.equal(7);
        sentences[1].offset.should.be.equal(7);
    });

    it("should handle urls", function() {
        var sentences = english.sentences()("Google is accessible at https://www.google.fr.");
        sentences.length.should.be.equal(1);
    });

    it("should handle abbreviation (1)", function() {
        var sentences = english.sentences()("On Jan. 20, former Sen. Barack Obama became the 44th President of the U.S. Millions attended the Inauguration.");
        sentences.length.should.be.equal(2);
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
        sentences[0].offset.should.be.equal(25);

        sentences[1].index.should.be.equal(26);
        sentences[1].offset.should.be.equal(6);
    });
});
