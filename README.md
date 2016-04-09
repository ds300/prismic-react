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

console.log(myDocument.asReact(linkResolver));

//

```
