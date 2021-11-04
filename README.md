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
import {Quote, insertQuote} from '@github/quote-selection'

document.addEventListener('keydown', event => {
  if (event.key == 'r') {
    const quote = new Quote()
    if (quote && quote.container('.my-quote-region')) {
      insertQuote(quote, document.querySelector('textarea'))
    }
  }
})
```

`Quote` will take the currently selected HTML from the specified quote region, convert it to markdown, and create a quoted representation of the selection.

`insertQuote` will insert the string representation of a selected text into the specified text area field.

### Preserving Markdown syntax

```js
const quote = new Quote()
quote.select(document.querySelector('.comment-body'))
if (quote.container('.my-quote-region')) {
  const markdownQuote = asMarkdown(quote, '.comment-body')
}
```

Calling `asMarkdown` on the `Quote` will ensure markdown syntax is preserved.

The optional `scopeSelector` parameter of `asMarkdown` ensures that even if the user selection bleeds outside of the scoped element, the quoted portion will always be contained inside the scope. This is useful to avoid accidentally quoting parts of the UI that might be interspersed between quotable content.

```

## Development

```

npm install
npm test

```

## License

Distributed under the MIT license. See LICENSE for details.
```
