import {extractFragment, insertMarkdownSyntax} from './markdown'

export type Quote = {
  container: Element | null
  range: Range
  selectionText: string
  quotedText: string
}

export function extractQuote(containerSelector: string, quoteElement?: Element): Quote {
  const selection = window.getSelection()
  const quote: Quote = {
    container: null,
    range: new Range(),
    selectionText: '',
    quotedText: ''
  }
  if (!selection) return quote
  if (quoteElement) {
    selection.removeAllRanges()
    selection.selectAllChildren(quoteElement)
  }
  if (selection.rangeCount === 0) return quote
  quote.range = selection.getRangeAt(0)
  quote.selectionText = selection.toString().trim()
  quote.quotedText = `> ${quote.selectionText.replace(/\n/g, '\n> ')}\n\n`
  if (!quote.selectionText) return quote

  const startContainer = quote.range.startContainer
  const startElement: Element | null = startContainer instanceof Element ? startContainer : startContainer.parentElement
  if (!startElement) return quote

  quote.container = startElement.closest(containerSelector)
  if (!quote.container) return quote

  return quote
}

export function asMarkdown(
  quote: Quote,
  scopeSelector?: string,
  callback?: (fragment: DocumentFragment) => void
): Quote {
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
