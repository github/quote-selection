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
      quoteSelection.install(document.querySelector('[data-nested-quote]'))
    })

    afterEach(function() {
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

      container.addEventListener('quote-selection', function(event) {
        textarea.hidden = false
        event.detail.appendText(textarea)
        event.preventDefault()
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
})
