/* global quoteSelection */

describe('quote-selection', function() {
  describe('with quotable selection', function() {
    beforeEach(function() {
      document.body.innerHTML = `
        <p id="not-quotable">Not quotable text</p>
        <p id="quotable">Quotable text</p>
        <textarea>Has text</textarea>
      `
      const el = document.querySelector('#quotable')
      window.getSelection = function() {
        return {
          focusNode: el,
          toString: () => el.textContent
        }
      }
    })

    afterEach(function() {
      document.body.innerHTML = ''
    })

    it('textarea is updated', function(done) {
      const container = document.querySelector('#quotable')
      const textarea = document.querySelector('textarea')

      container.addEventListener('quote-selection', function() {
        done()
      })

      const quoted = quoteSelection.default(container, textarea)
      assert(quoted)
      assert.equal(textarea.value, 'Has text\n\n> Quotable text\n\n')
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
      window.getSelection = function() {
        return {
          focusNode: el,
          toString: () => el.textContent
        }
      }
    })

    afterEach(function() {
      document.body.innerHTML = ''
    })

    it('textarea is not updated', function() {
      const container = document.querySelector('#quotable')
      const textarea = document.querySelector('textarea')
      const quoted = quoteSelection.default(container, textarea)

      assert(!quoted)
      assert.equal(textarea.value, 'Has text')
    })
  })
})
