import {install, getSelectionContext, quote} from '../dist/index.js'

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
      install(document.querySelector('[data-quote]'))
      install(document.querySelector('[data-nested-quote]'))
    })

    afterEach(function () {
      document.body.innerHTML = ''
    })

    it('textarea is updated', function () {
      const el = document.querySelector('#quotable')
      const selection = window.getSelection()
      window.getSelection = () => createSelection(selection, el)

      const container = document.querySelector('[data-quote]')
      const textarea = document.querySelector('#not-hidden-textarea')
      let eventCount = 0
      let changeCount = 0

      container.addEventListener('quote-selection', function () {
        eventCount++
      })

      textarea.addEventListener('change', function () {
        changeCount++
      })

      quote(getSelectionContext())
      assert.equal(textarea.value, 'Has text\n\n> Test Quotable text, bold.\n\n')
      assert.equal(eventCount, 1)
      assert.equal(changeCount, 1)
    })

    it('nested textarea is updated when event is captured', function () {
      const el = document.querySelector('#nested-quotable')
      const selection = window.getSelection()
      window.getSelection = () => createSelection(selection, el)
      const container = document.querySelector('[data-nested-quote]')
      const textarea = document.querySelector('#nested-textarea')
      const outerTextarea = document.querySelector('#not-hidden-textarea')

      container.addEventListener('quote-selection', function () {
        textarea.hidden = false
      })

      quote(getSelectionContext())
      assert.equal(outerTextarea.value, 'Has text')
      assert.equal(textarea.value, 'Has text\n\n> Nested text.\n\n')
    })

    it('textarea is not updated when selecting text outside of quote region', function () {
      const el = document.querySelector('#not-quotable')
      const selection = window.getSelection()
      window.getSelection = () => createSelection(selection, el)

      const textarea = document.querySelector('#not-hidden-textarea')
      quote(getSelectionContext())
      assert.equal(textarea.value, 'Has text')
    })
  })

  describe('with markdown enabled', function () {
    beforeEach(function () {
      document.body.innerHTML = `
        <div data-quote>
          <div>
            <p>This should not appear as part of the quote.</p>
            <div class="comment-body">
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
      install(document.querySelector('[data-quote]'))
    })

    afterEach(function () {
      document.body.innerHTML = ''
    })

    it('preserves formatting', function () {
      const range = document.createRange()
      range.selectNodeContents(document.querySelector('.comment-body').parentNode)
      assert.ok(
        quote(
          {text: 'whatever', range},
          {
            quoteMarkdown: true,
            scopeSelector: '.comment-body'
          }
        )
      )

      const textarea = document.querySelector('textarea')
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

    it('allows quote-selection-markdown event to prepare content', function () {
      document.querySelector('[data-quote]').addEventListener('quote-selection-markdown', function (event) {
        const {fragment} = event.detail
        fragment.querySelector('a[href]').replaceWith('@links')
        fragment.querySelector('img[alt]').replaceWith(':emoji:')
      })

      const range = document.createRange()
      range.selectNodeContents(document.querySelector('.comment-body').parentNode)
      assert.ok(
        quote(
          {text: 'whatever', range},
          {
            quoteMarkdown: true,
            scopeSelector: '.comment-body'
          }
        )
      )

      const textarea = document.querySelector('textarea')
      assert.match(textarea.value, /^> @links and :emoji: are preserved\./m)
    })
  })
})
