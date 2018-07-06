# `quoteSelection`

Add selected text to a text area as a markdown quote.

## Installation

```
$ npm install @github/quote-selection
```

## Usage

```js
import quoteSelection from '@github/quote-selection'
quoteSelection(quotableContainer, textarea)
```

---

### HTML

```html
<div class="js-quote-selection"><p>Text to quote</p></div>
<textarea class="js-textarea"></textarea>
```

### JS

```js
import quoteSelection from '@github/quote-selection'

document.addEventListener('keydown', function(event) {
  if (event.key === 'r' && !event.metaKey && !event.ctrlKey && !event.altKey) {
    const quoted = quoteSelection(
      document.querySelector('.js-quote-selection'),
      document.querySelector('.js-textarea')
    )
    if (quoted) event.preventDefault()
  }
})
```

## Development

```
npm install
npm test
```

## License

Distributed under the MIT license. See LICENSE for details.
