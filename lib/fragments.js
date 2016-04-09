"use strict";

var prismic = require('prismic.io');
var React = require('react');

var F = prismic.Fragments;
var initField = prismic.initField;
var el = React.createElement.bind(React);

F.Text.asReact =
  F.Select.prototype.asReact =
  F.Color.prototype.asReact =
  F.Number.prototype.asReact =
  function () {
    return el('span', null, this.value.toString());
  };

F.DocumentLink.prototype.asReact = function (ctx) {
  var url = this.url(ctx);
  return el('a', {href: url}, url);
};

F.WebLink.prototype.asReact = function () {
  return el('a', {href: this.url()}, this.url());
};

F.FileLink.prototype.asReact = function () {
  return el('a', {href: this.url()}, this.value.file.name);
};

F.ImageLink.prototype.asReact = function () {
  return el('a', {href: this.url()}, el('img', {src: this.url(), alt: this.alt}));
};

F.GeoPoint.prototype.asReact = function () {
  return el('div',
    {className: 'geopoint'},
    [
      el('span', {className: 'latitude'}, this.latitude),
      el('span', {className: 'longitude'}, this.longitude)
    ]
  );
};


F.Date.prototype.asReact =
  F.Timestamp.prototype.asReact =
  function () {
    return el('time', null, this.value.toString());
  };

F.Embed.prototype.asReact = function () {
  return el('div', {dangerouslySetInnerHTML: {__html: this.asHtml()}});
};

F.Image.prototype.asReact = function () {
  return this.main.asReact();
};

F.ImageView.prototype.asReact = function () {
  return el('img', {
    src: this.url,
    width: this.width,
    height: this.height
  });
};

F.Group.prototype.asReact = function (linkResolver) {
  return this.toArray().map(function (child) {
    return child.asReact(linkResolver);
  });
};

F.Slice.prototype.asReact = function (linkResolver) {
  return el('div', {
    'data-slicetype': this.sliceType,
    className: 'slice' + (this.label ? ' ' + this.label : '')
  }, [this.value.asReact(linkResolver)]);
};

F.SliceZone.prototype.asReact = function (linkResolver) {
  return this.value.map(function (val) {
    return val.asReact(linkResolver);
  });
};

F.StructuredText.prototype.asReact = function (linkResolver) {
  var blockGroups = [],
      blockGroup,
      block,
      elems = [];
  if (typeof linkResolver !== 'function') {
    // Backward compatibility with the old ctx argument
    var ctx = linkResolver;
    linkResolver = function(doc, isBroken) {
      return ctx.linkResolver(ctx, doc, isBroken);
    };
  }
  if (Array.isArray(this.blocks)) {

    for(var i=0; i < this.blocks.length; i++) {
      block = this.blocks[i];

      // Resolve image links
      if (block.type == "image" && block.linkTo) {
        var link = initField(block.linkTo);
        block.linkUrl = link.url(linkResolver);
      }

      if (block.type !== "list-item" && block.type !== "o-list-item") {
        // it's not a type that groups
        blockGroups.push(block);
        blockGroup = null;
      } else if (!blockGroup || blockGroup.type != ("group-" + block.type)) {
        // it's a new type or no BlockGroup was set so far
        blockGroup = {
          type: "group-" + block.type,
          blocks: [block]
        };
        blockGroups.push(blockGroup);
      } else {
        // it's the same type as before, no touching blockGroup
        blockGroup.blocks.push(block);
      }
    }

    var blockContent = function(block) {
      var content = "";
      if (block.blocks) {
        block.blocks.forEach(function (block2) {
          content = content + serialize(block2, blockContent(block2));
        });
      } else {
        content = insertSpans(block.text, block.spans, linkResolver);
      }
      return content;
    };

    blockGroups.forEach(function (blockGroup) {
      elems.push(serialize(blockGroup, blockContent(blockGroup)));
    });

  }

  return elems;
};

function serialize(element, content) {
  var result;

  // Fall back to the default HTML output
  var TAG_NAMES = {
    "heading1": "h1",
    "heading2": "h2",
    "heading3": "h3",
    "heading4": "h4",
    "heading5": "h5",
    "heading6": "h6",
    "paragraph": "p",
    "preformatted": "pre",
    "list-item": "li",
    "o-list-item": "li",
    "group-list-item": "ul",
    "group-o-list-item": "ol",
    "strong": "strong",
    "em": "em"
  };

  if (TAG_NAMES[element.type]) {
    var name = TAG_NAMES[element.type];
    var className = element.label || '';
    result = el(name, {className: className}, content);
  }

  if (element.type == "image") {
    var label = element.label ? (" " + element.label) : "";
    var imgTag = el('img', {src: element.url, alt: element.alt});
    result = el('p',
      {className: 'block-img ' + (element.label || "")},
      element.linkUrl ? el('a', {href: element.linkUrl}, imgTag) : imgTag
    );
  }

  if (element.type == "embed") {
    result = el('div',
      {
        'data-oembed': element.embed_url,
        'data-oembed-type': element.type,
        'data-oembed-provider': element.provider_name,
        className: element.label || '',
        dangerouslySetInnerHTML: {__html: element.oembed.html}
      }
    );
  }

  if (element.type === 'hyperlink') {
    result = el('a', {href: element.url}, content);
  }

  if (element.type === 'label') {
    result = el('span', {className: element.data.label}, content);
  }

  if (!result) {
    throw new Error("can't handle this", element);
  }
  return result;
}

function insertSpans(text, spans, linkResolver) {
  if (!spans || !spans.length) {
    return text;
  }

  var tagsStart = {};

  spans.forEach(function (span) {
    if (!tagsStart[span.start]) { tagsStart[span.start] = []; }

    tagsStart[span.start].push(span);
  });

  // sort spans by end desc
  Object.keys(tagsStart).forEach(function (start) {
    tagsStart[start].sort((s1, s2) => s2.end - s1.end);
  });

  function _insertSpans (span) {
    var childrens = [];
    var offset = span.start;
    for (var pos = span.start; pos < span.end; pos++) { // Looping to length + 1 to catch closing tags
      var spans = tagsStart[pos];
      if (spans && spans.length) {
        var childSpan = spans.pop();
        if (offset < childSpan.start) {
          childrens.push(text.substring(offset, childSpan.start));
        }
        childrens.push(_insertSpans(childSpan));
        offset = childSpan.end;
      }
    }
    if (offset < span.end) {
      childrens.push(text.substring(offset, span.end));
    }
    return serialize(span, childrens);
  }

  return _insertSpans({
    start: 0,
    end: text.length,
    type: 'paragraph'
  }).props.children;
}
