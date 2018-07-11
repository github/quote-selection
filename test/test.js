/* global quoteSelection */

function createSelection(selection, el) {
  const range = document.createRange()
  range.selectNodeContents(el)
  selection.removeAllRanges()
  selection.addRange(range)
  return selection
}

describe('quote-selection', function() {
  describe('with quotable selection', function() {
    beforeEach(function() {
      document.body.innerHTML = `
        <p id="not-quotable">Not quotable text</p>
        <p id="quotable">
          Test <a href="#">Quotable</a> text, <strong>bold</strong>.</p>
        <textarea>Has text</textarea>
      `
      const el = document.querySelector('#quotable')
      const selection = window.getSelection()
      window.getSelection = () => createSelection(selection, el)
    })

    afterEach(function() {
      document.body.innerHTML = ''
    })

    it('textarea is updated', function() {
      const container = document.querySelector('#quotable')
      const textarea = document.querySelector('textarea')
      let eventCount = 0

      container.addEventListener('quote-selection', function() {
        eventCount++
      })

      const quoted = quoteSelection(container, textarea)
      assert(quoted)
      assert.equal(textarea.value, 'Has text\n\n> Test Quotable text, bold.\n\n')
      assert.equal(eventCount, 1)

      const quotedWithMarkdown = quoteSelection(container, textarea, true)
      assert(quotedWithMarkdown)
      assert.equal(
        textarea.value,
        'Has text\n\n> Test Quotable text, bold.\n\n\n\n> Test [Quotable](#) text, **bold**.\n\n'
      )
      assert.equal(eventCount, 2)
    })
  })

  describe('with non-quotable selection', function() {
    beforeEach(function() {
      document.body.innerHTML = `
        <p id="not-quotable">Not quotable text</p>
        <p id="quotable">Quotable text</p>
        <textarea>Has text</textarea>
      `
      const el = document.querySelector('#not-quotable')
      const selection = window.getSelection()
      window.getSelection = () => createSelection(selection, el)
    })

    afterEach(function() {
      document.body.innerHTML = ''
    })

    it('textarea is not updated', function() {
      const container = document.querySelector('#quotable')
      const textarea = document.querySelector('textarea')
      const quoted = quoteSelection(container, textarea)

      assert(!quoted)
      assert.equal(textarea.value, 'Has text')
    })
  })
})
