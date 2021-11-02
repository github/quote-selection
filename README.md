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
import {extractQuote, insertQuote} from '@github/quote-selection'

document.addEventListener('keydown', event => {
  if (event.key == 'r') {
    const quote = extractQuote({containerSelector: '.my-quote-region'})
    if (quote) {
      insertQuote(quote.selectionText, document.querySelector('textarea'))
    }
  }
})
```

`extractQuote` will take the currently selected HTML from the specified quote region, convert it to markdown, and create a quoted representation of the selection.

`insertQuote` will insert the string representation of a selected text into the specified text area field.

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
