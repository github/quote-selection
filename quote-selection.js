/* @flow */

import selectionToMarkdown from './markdown-parsing'

export default function quoteSelection(
  container: HTMLElement,
  field: HTMLTextAreaElement,
  parseToMarkdown: ?boolean
): boolean {
  const selection = window.getSelection()
  let selectionText = selection.toString().trim()
  if (!selectionText) return false

  let focusNode = selection.focusNode
  if (!focusNode) return false

  if (focusNode.nodeType !== Node.ELEMENT_NODE) focusNode = focusNode.parentNode
  if (!(focusNode instanceof Element)) return false

  if (!container.contains(focusNode)) return false

  if (parseToMarkdown) {
    try {
      selectionText = selectFragment(selection, selectionToMarkdown(selection))
        .replace(/^\n+/, '')
        .replace(/\s+$/, '')
    } catch (error) {
      setTimeout(() => {
        throw error
      })
    }
  }

  const eventDetail = {selection, selectionText}
  const fireEvent = container.dispatchEvent(
    new CustomEvent('quote-selection', {
      bubbles: true,
      cancelable: true,
      detail: eventDetail
    })
  )
  if (!fireEvent) return true

  selectionText = eventDetail.selectionText
  let quotedText = `> ${selectionText.replace(/\n/g, '\n> ')}\n\n`
  if (field.value) {
    quotedText = `${field.value}\n\n${quotedText}`
  }

  field.value = quotedText

  field.focus()
  field.selectionStart = field.value.length
  field.scrollTop = field.scrollHeight

  return true
}

function selectFragment(selection, fragment) {
  const body = document.body
  if (!body) throw new Error()

  const div = document.createElement('div')
  div.appendChild(fragment)
  div.style.cssText = 'position:absolute;left:-9999px;'
  body.appendChild(div)
  let selectionText
  try {
    const range = document.createRange()
    range.selectNodeContents(div)
    selection.removeAllRanges()
    selection.addRange(range)
    selectionText = selection.toString()
    selection.removeAllRanges()
  } finally {
    body.removeChild(div)
  }
  return selectionText
}
