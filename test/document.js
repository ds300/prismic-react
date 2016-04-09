require('../index.js');

var prismic = require('prismic.io');

var expect = require('chai').expect;

describe('documents', () => {
  it('are serializable', () => {
    expect(new prismic.Document().asReact()).to.eql([]);
  });
});
