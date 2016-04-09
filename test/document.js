"use strict";

require('../index.js');

var prismic = require('prismic.io');

var expect = require('chai').expect;

var lbc = require('./lesbonneschoses');
var React = require('react');
var ReactDOM = require('react-dom/server');

var linkResolver = (doc) => "#my_link";

describe('documents', () => {
  it('are serializable', () => {
    expect(new prismic.Document().asReact()).to.eql([]);
  });
  it('can serialize all of lesbonneschoses', done => {
    lbc.then(docs => {
      docs.forEach((doc, i) => {
        try {
          ReactDOM.renderToStaticMarkup(React.createElement('div', null, doc.asReact(linkResolver)));
        } catch (E) {
          console.error(E);
          throw E;
        }
      });
    }).then(done);
  });
});
