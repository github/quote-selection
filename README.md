# Quote Markdown selection

Install a shortcut `r` to append selected text to a `<textarea>` as a Markdown quote.

## Installation

```
$ npm install @github/quote-selection
```

## Usage

### HTML

```html
<div data-quote-region>
  <p>Text to quote</p>
  <textarea></textarea>
</div>
```

#### Quote as Markdown

An optional feature to translate quoted content into Markdown format is available via the `data-quote-markdown` attribute:

```html
<div data-quote-region data-quote-markdown=".comment-body">
  <div class="comment-body">
    <h2><strong>Formatted</strong> text <em>to quote</em></h2>
    <p>
      Preserves <code>inline code</code> and
      <a href="https://guides.github.com/features/mastering-markdown/">other features</a>.
    </p>
  </div>
  <div class="comment-body">
    <p>Some other text</p>
  </div>
  <textarea></textarea>
</div>
```

When selected, the text within the first `.comment-body` element will get quoted as:

```
> ## **Formatted** text _to quote_
>
> Preserves `inline code` and [other features](https://guides.github.com/features/mastering-markdown/).
```

### JS

```js
import {install} from '@github/quote-selection'
install(document.querySelector('[data-quote-region]'))
```

## Events

A `quote-selection` event is fired on the quote region before text is appended to a textarea. Listen to the event to prepare the textarea or manipulate the selection text.

For example, reveal a textarea so it can be found:

```js
region.addEventListener('quote-selection', function(event) {
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
