import {extractFragment, insertMarkdownSyntax} from './markdown'

type Quote = {
  container: Element
  range: Range
  selectionText: string
  quotedText: string
}

export function extractQuote(containerSelector: string, quoteElement?: Element): Quote | undefined {
  const selection = window.getSelection()
  if (!selection) return
  if (quoteElement) {
    selection.removeAllRanges()
    selection.selectAllChildren(quoteElement)
  }
  let range
  try {
    range = selection.getRangeAt(0)
  } catch {
    return
  }
  const selectionText = selection.toString().trim()
  if (!selectionText) return

  const startContainer = range.startContainer
  const startElement: Element | null = startContainer instanceof Element ? startContainer : startContainer.parentElement
  if (!startElement) return

  const container = startElement.closest(containerSelector)
  if (!container) return

  const quotedText = `> ${selectionText.replace(/\n/g, '\n> ')}\n\n`

  return {selectionText, quotedText, range, container}
}

export function asMarkdown(
  quote: Quote,
  scopeSelector?: string,
  callback?: (fragment: DocumentFragment) => void
): Quote | undefined {
  const fragment = extractFragment(quote.range, scopeSelector ?? '')
  callback?.(fragment)
  insertMarkdownSyntax(fragment)
  const selectionText = selectFragment(fragment).replace(/^\n+/, '').replace(/\s+$/, '')
  return {
    selectionText,
    quotedText: `> ${selectionText.replace(/\n/g, '\n> ')}\n\n`,
    range: quote.range,
    container: quote.container
  }
}

export function insertQuote(quote: Quote, field: HTMLTextAreaElement) {
  if (field.value) {
    field.value = `${field.value}\n\n${quote.quotedText}`
  } else {
    field.value = quote.quotedText
  }

  field.dispatchEvent(
    new CustomEvent('change', {
      bubbles: true,
      cancelable: false
    })
  )
  field.focus()
  field.selectionStart = field.value.length
  field.scrollTop = field.scrollHeight
}

function selectFragment(fragment: DocumentFragment): string {
  const body = document.body
  if (!body) return ''

  const div = document.createElement('div')
  div.appendChild(fragment)
  div.style.cssText = 'position:absolute;left:-9999px;'
  body.appendChild(div)
  let selectionText = ''
  try {
    const selection = window.getSelection()
    if (selection) {
      const range = document.createRange()
      range.selectNodeContents(div)
      selection.removeAllRanges()
      selection.addRange(range)
      selectionText = selection.toString()
      selection.removeAllRanges()
      range.detach()
    }
  } finally {
    body.removeChild(div)
  }
  return selectionText
}
