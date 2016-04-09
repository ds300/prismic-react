var Document = require('prismic.io').Document;
var React = require('react');

Document.prototype.getReact = function (name, linkResolver) {
  var fragment = this.get(name);
  if (fragment && fragment.asReact) {
    return fragment.asReact(linkResolver);
  } else {
    return null;
  }
};

Document.prototype.asReact = function(linkResolver) {
  var children = [];
  for(var field in this.fragments) {
    var fragment = this.get(field);
    if (fragment && fragment.asReact) {
      children.push(React.createElement('section', {
        'data-field': field,
      }, fragment.asReact(linkResolver)));
    }
  }
  return children;
};
