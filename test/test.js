/* global quoteSelection */

function createSelection(selection, el) {
  const range = document.createRange()
  range.selectNodeContents(el)
  selection.removeAllRanges()
  selection.addRange(range)
  return selection
}

function quote() {
  document.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'r'
    })
  )
}

describe('quote-selection', function() {
  describe('with quotable selection', function() {
    let subscription
    beforeEach(function() {
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
      quoteSelection.install(document.querySelector('[data-quote]'))
      subscription = quoteSelection.subscribe(document.querySelector('[data-nested-quote]'))
    })

    afterEach(function() {
      quoteSelection.uninstall(document.querySelector('[data-quote]'))
      subscription.unsubscribe()
      document.body.innerHTML = ''
    })

    it('textarea is updated', function() {
      const el = document.querySelector('#quotable')
      const selection = window.getSelection()
      window.getSelection = () => createSelection(selection, el)

      const container = document.querySelector('[data-quote]')
      const textarea = document.querySelector('#not-hidden-textarea')
      let eventCount = 0

      container.addEventListener('quote-selection', function() {
        eventCount++
      })

      quote()
      assert.equal(textarea.value, 'Has text\n\n> Test Quotable text, bold.\n\n')
      assert.equal(eventCount, 1)

      container.setAttribute('data-quote-markdown', '')
      quote()
      assert.equal(
        textarea.value,
        'Has text\n\n> Test Quotable text, bold.\n\n\n\n> Test [Quotable](#) text, **bold**.\n\n'
      )
      assert.equal(eventCount, 2)
    })

    it('nested textarea is updated when event is captured', function() {
      const el = document.querySelector('#nested-quotable')
      const selection = window.getSelection()
      window.getSelection = () => createSelection(selection, el)
      const container = document.querySelector('[data-nested-quote]')
      const textarea = document.querySelector('#nested-textarea')
      const outerTextarea = document.querySelector('#not-hidden-textarea')

      container.addEventListener('quote-selection', function() {
        textarea.hidden = false
      })

      quote()
      assert.equal(outerTextarea.value, 'Has text')
      assert.equal(textarea.value, 'Has text\n\n> Nested text.\n\n')
    })

    it('textarea is not updated when selecting text outside of quote region', function() {
      const el = document.querySelector('#not-quotable')
      const selection = window.getSelection()
      window.getSelection = () => createSelection(selection, el)

      const textarea = document.querySelector('#not-hidden-textarea')
      quote()
      assert.equal(textarea.value, 'Has text')
    })
  })

  describe('with markdown enabled', function() {
    let subscription
    beforeEach(function() {
      document.body.innerHTML = `
        <div data-quote data-quote-markdown=".comment-body">
          <div>
            <p>This should not appear as part of the quote.</p>
            <div class="comment-body">
              <p>This is <strong>beautifully</strong> formatted <em>text</em> that even has some <code>inline code</code>.</p>
              <div class="highlight highlight-source-js"><pre><span class="pl-en">foo</span>(<span class="pl-c1">true</span>)</pre></div>
              <p><a class="user-mention">@mentions</a> and <img alt=":emoji:" class="emoji" src="image.png"> are preserved.</p>
              <blockquote><p>Music changes, and I'm gonna change right along with it.<br>--Aretha Franklin</p></blockquote>
            </div>
          </div>
          <textarea></textarea>
        </div>
      `
      subscription = quoteSelection.subscribe(document.querySelector('[data-quote]'))
    })

    afterEach(function() {
      subscription.unsubscribe()
      document.body.innerHTML = ''
    })

    it('preserves formatting', function() {
      const range = document.createRange()
      range.selectNodeContents(document.querySelector('.comment-body').parentNode)
      assert.ok(quoteSelection.quote('whatever', range))

      const textarea = document.querySelector('textarea')
      assert.equal(
        textarea.value.replace(/[ ]+\n/g, '\n'),
        `> This is **beautifully** formatted _text_ that even has some \`inline code\`.
>
> \`\`\`js
> foo(true)
> \`\`\`
>
> @mentions and :emoji: are preserved.
>
> > Music changes, and I'm gonna change right along with it.--Aretha Franklin

`
      )
    })
  })
})
