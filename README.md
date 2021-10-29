# Quote selection

Helpers for quoting selected text, appending the text into a `<textarea>` as a Markdown quote.

## Installation

```
$ npm install @github/quote-selection
```

## Usage

```html
<div class="my-quote-region">
  <p>Text to quote</p>
  <textarea></textarea>
</div>
```

```js
import {getSelectionContext, extractQuote, insertQuote} from '@github/quote-selection'

document.addEventListener('keydown', event => {
  if (event.key == 'r') {
    const quote = extractQuote({containerSelector: '.my-quote-region'})
    if (quote) {
      insertQuote(quote.selectionText, document.querySelector('textarea'))
    }
  }
})
```

Calling `extractQuote` with `getSelectionContext` will take the currently selected HTML, convert it to markdown, and append the quoted representation of the selected text into the first applicable `<textarea>` element.

### Preserving Markdown syntax

```js
extractQuote({
  quoteMarkdown: true,
  scopeSelector: '.comment-body',
  containerSelector: '.my-quote-region'
})
```

The optional `scopeSelector` parameter ensures that even if the user selection bleeds outside of the scoped element, the quoted portion will always be contained inside the scope. This is useful to avoid accidentally quoting parts of the UI that might be interspersed between quotable content.

## Events

- `quote-selection-markdown` (bubbles: true, cancelable: false) - fired on the quote region to optionally inject custom syntax into the `fragment` element in `quoteMarkdown: true` mode

```

## Development

```

npm install
npm test

```

## License

Distributed under the MIT license. See LICENSE for details.
```
