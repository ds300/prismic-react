prismic-react
=============

`prismic-react` provides compile-to-ReactElement methods for document & fragment types in the [prismic.io JavaScript SDK](https://github.com/prismicio/javascript-kit).

## Quick start

```
npm install --save prismic-react
```

```javascript
// just import prismic-react to add the .asReact methods everywhere there
// are .asHtml methods
import 'prismic-react';

myDocument.asReact();

// it supports passing a link resolver just like .asHtml
myDocument.asReact(linkResolver);

// documents also support getting fragments as react
myDocument.getReact('article.summary' /* , linkResolver */);

// which is just shorthand for calling .asReact on the fragments themselves
myDocument.getStructuredText('article.summary').asReact();
```

That's literally all there is to it.

## License

Apache 2.0
