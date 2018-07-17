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
  const textarea = event.target.querySelector('textarea')
  textarea.hidden = false
})
```

## Development

```
npm install
npm test
```

## License

Distributed under the MIT license. See LICENSE for details.
