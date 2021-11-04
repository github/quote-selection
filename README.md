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
import {getSelectionContext, quote} from '@github/quote-selection'

document.addEventListener('keydown', event => {
  if (event.key == 'r') {
    quote(getSelectionContext(), { containerSelector: '.my-quote-region' })
  }
})
```

Calling `quote` with `getSelectionContext` will take the currently selected HTML, converts it to markdown, and appends the quoted representation of the selected text into the first applicable `<textarea>` element.

### Preserving Markdown syntax

```js
quote(getSelectionContext(), {
  quoteMarkdown: true,
  scopeSelector: '.comment-body',
  containerSelector: '.my-quote-region'
})
```

The optional `scopeSelector` parameter ensures that even if the user selection bleeds outside of the scoped element, the quoted portion will always be contained inside the scope. This is useful to avoid accidentally quoting parts of the UI that might be interspersed between quotable content.

## Events

- `quote-selection-markdown` (bubbles: true, cancelable: false) - fired on the quote region to optionally inject custom syntax into the `fragment` element in `quoteMarkdown: true` mode
- `quote-selection` (bubbles: true, cancelable: true) - fired on the quote region before text is appended to a textarea

For example, reveal a textarea so it can be found:

```js
region.addEventListener('quote-selection', function (event) {
  const {selection, selectionText} = event.detail
  console.log('Quoted text', selection, selectionText)

  const textarea = event.target.querySelector('textarea')
  textarea.hidden = false

  // Cancel the quote behavior.
  // event.preventDefault()
})
```

## Development

```
npm install
npm test
```

## License

Distributed under the MIT license. See LICENSE for details.
