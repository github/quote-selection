/* @flow */

export default function quoteSelection(container: HTMLElement, field: HTMLTextAreaElement): boolean {
  const selection = window.getSelection()
  let selectionText = selection.toString().trim()
  if (!selectionText) return false

  let focusNode = selection.focusNode
  if (!focusNode) return false

  if (focusNode.nodeType !== Node.ELEMENT_NODE) focusNode = focusNode.parentNode
  if (!(focusNode instanceof Element)) return false

  if (!container.contains(focusNode)) return false

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
