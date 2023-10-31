// eslint-disable-next-line import/extensions,import/no-unresolved
import {MarkdownQuote, Quote} from '../dist/index.js'

function createSelection(selection, el) {
  const range = document.createRange()
  range.selectNodeContents(el)
  selection.removeAllRanges()
  selection.addRange(range)
  return selection
}

describe('quote-selection', function () {
  describe('with quotable selection', function () {
    beforeEach(function () {
      // eslint-disable-next-line github/no-inner-html
      document.body.innerHTML = `
        <p id="not-quotable">Not quotable text</p>
        <div data-quote>
          <p id="quotable">Test <a href="#">Quotable</a> text, <strong>bold</strong>.</p>
          <div data-nested-quote>
            <p id="nested-quotable">Nested text.</p>
            <textarea id="nested-textarea" hidden>Has text</textarea>
          </div>
          <textarea id="not-hidden-textarea">Has text</textarea>
        </div>
      `
    })

    const oldGetSelection = window.getSelection
    afterEach(function () {
      window.getSelection = oldGetSelection
      // eslint-disable-next-line github/no-inner-html
      document.body.innerHTML = ''
    })

    it('textarea is updated', function () {
      const el = document.querySelector('#quotable')
      const selection = window.getSelection()
      window.getSelection = () => createSelection(selection, el)

      const textarea = document.querySelector('#not-hidden-textarea')
      let changeCount = 0

      textarea.addEventListener('change', function () {
        changeCount++
      })
      const quote = new Quote()
      assert.ok(quote.active)
      assert.ok(quote.closest('[data-quote], [data-nested-quote]'))
      quote.insert(textarea)

      assert.equal(textarea.value, 'Has text\n\n> Test Quotable text, bold.\n\n')
      assert.equal(changeCount, 1)
    })

    it('nested textarea is updated when event is captured', function () {
      const el = document.querySelector('#nested-quotable')
      const selection = window.getSelection()
      window.getSelection = () => createSelection(selection, el)
      const textarea = document.querySelector('#nested-textarea')
      const outerTextarea = document.querySelector('#not-hidden-textarea')

      textarea.hidden = false

      const quote = new Quote()
      assert.ok(quote.active)
      assert.ok(quote.closest('[data-quote], [data-nested-quote]'))
      quote.insert(textarea)

      assert.equal(outerTextarea.value, 'Has text')
      assert.equal(textarea.value, 'Has text\n\n> Nested text.\n\n')
    })

    it('textarea is not updated when selecting text outside of quote region', function () {
      const el = document.querySelector('#not-quotable')
      const selection = window.getSelection()
      window.getSelection = () => createSelection(selection, el)

      const quote = new Quote()

      assert.ok(quote.active)
      assert.equal(quote.closest('[data-quote], [data-nested-quote]'), null)
    })

    it('is not active if nothing is selected', function () {
      window.getSelection().removeAllRanges()
      const quote = new Quote()
      assert.notOk(quote.active)
    })

    it('range can be set', function () {
      const el = document.querySelector('#quotable')
      const textarea = document.querySelector('#not-hidden-textarea')
      const selection = window.getSelection()
      window.getSelection = () => createSelection(selection, el)

      const quote = new Quote()
      quote.range = document.createRange()
      quote.range.selectNodeContents(el.querySelector('strong'))
      quote.insert(textarea)

      assert.equal(textarea.value, 'Has text\n\n> bold\n\n')
    })
  })

  describe('with markdown enabled', function () {
    beforeEach(function () {
      // eslint-disable-next-line github/no-inner-html
      document.body.innerHTML = `
        <div data-quote>
          <div>
            <p>This should not appear as part of the quote.</p>
            <div class="comment-body" id="comment-body">
              <p>This is <strong>beautifully</strong> formatted <em>text</em> that even has some <code>inline code</code>.</p>
              <p>This is a simple p line</p>
              <p>some escaped html tags to ignore &lt;pre&gt; &lt;strong&gt; &lt;weak&gt; &lt;em&gt; &lt;/pre&gt; &lt;/strong&gt; &lt;/weak&gt; &lt;/em&gt;</p>
              <pre><code>foo(true)</code></pre>
              <p><a href="http://example.com">Links</a> and <img alt=":emoji:" class="emoji" src="image.png"> are preserved.</p>
              <blockquote><p>Music changes, and I'm gonna change right along with it.<br>--Aretha Franklin</p></blockquote>
            </div>
          </div>
          <textarea></textarea>
        </div>
      `
    })

    afterEach(function () {
      // eslint-disable-next-line github/no-inner-html
      document.body.innerHTML = ''
    })

    it('preserves formatting', function () {
      const quote = new MarkdownQuote('.comment-body')
      quote.select(document.querySelector('.comment-body'))
      assert.ok(quote.closest('[data-quote]'))
      const textarea = document.querySelector('textarea')
      quote.insert(textarea)

      assert.equal(
        textarea.value.replace(/ +\n/g, '\n'),
        `> This is **beautifully** formatted _text_ that even has some \`inline code\`.
>
> This is a simple p line
>
> some escaped html tags to ignore \\<pre\\> \\<strong\\> \\<weak\\> \\<em\\> \\</pre\\> \\</strong\\> \\</weak\\> \\</em\\>
>
> \`\`\`
> foo(true)
> \`\`\`
>
> [Links](http://example.com) and ![:emoji:](image.png) are preserved.
>
> > Music changes, and I'm gonna change right along with it.--Aretha Franklin

`
      )
    })

    it('provides a callback to mutate markup', function () {
      const quote = new MarkdownQuote('.comment-body', fragment => {
        fragment.querySelector('a[href]').replaceWith('@links')
        fragment.querySelector('img[alt]').replaceWith(':emoji:')
      })
      quote.select(document.querySelector('.comment-body'))
      assert.ok(quote.active)
      assert.ok(quote.closest('[data-quote]'))

      const textarea = document.querySelector('textarea')
      quote.insert(textarea)

      assert.match(textarea.value, /^> @links and :emoji: are preserved\./m)
    })

    it('preserves list order', function () {
      // eslint-disable-next-line github/no-inner-html
      document.getElementById('comment-body').innerHTML = `
<ol dir="auto">
<li>Top level list one
<ul dir="auto">
<li>
<ol dir="auto">
<li>sublist one</li>
</ol>
</li>
<li>
<ol start="2" dir="auto">
<li>sublist  two</li>
</ol>
</li>
<li>
<ol start="5" dir="auto">
<li>sublist  three</li>
</ol>
</li>
</ul>
</li>
<li>Top level list two</li>
<li>Top level list three
<ol dir="auto">
<li>sublist one</li>
<li>sublist two</li>
<li>sublist three</li>
</ol>
</li>
</ol>
`

      const quote = new MarkdownQuote('.comment-body')
      quote.select(document.querySelector('.comment-body'))
      assert.ok(quote.closest('[data-quote]'))
      const textarea = document.querySelector('textarea')
      quote.insert(textarea)

      assert.equal(
        textarea.value.replace(/ +\n/g, '\n'),
        `> 1. Top level list one
>
>    * 1. sublist one
>    * 2. sublist  two
>    * 5. sublist  three
> 2. Top level list two
> 3. Top level list three
>
>    1. sublist one
>    2. sublist two
>    3. sublist three

`
      )
    })
  })
})
