import {extractFragment, insertMarkdownSyntax} from './markdown'

type Options = {
  quoteMarkdown?: boolean
  scopeSelector?: string
  quoteElement?: Element
}

interface SelectionContext {
  text: string
  range: Range
}

export function findTextarea(container: Element): HTMLTextAreaElement | undefined {
  for (const field of container.querySelectorAll('textarea')) {
    if (field instanceof HTMLTextAreaElement && visible(field)) {
      return field
    }
  }
}

export function getSelectionContext(element?: Element): SelectionContext | null {
  const selection = window.getSelection()
  if (!selection) return null
  if (element) {
    selection.removeAllRanges()
    selection.selectAllChildren(element)
  }
  try {
    return {text: selection.toString(), range: selection.getRangeAt(0)}
  } catch {
    return null
  }
}

type Quote = {
  container: Element
  range: Range
  selectionText: string
}

export function extractQuote(containerSelector: string, options?: Partial<Options>): Quote | undefined {
  const selectionContext = getSelectionContext(options?.quoteElement)
  if (!selectionContext) return

  const selectionText = selectionContext.text.trim()
  if (!selectionText) return

  const startContainer = selectionContext.range.startContainer
  const startElement: Element | null = startContainer instanceof Element ? startContainer : startContainer.parentElement
  if (!startElement) return

  const container: Element | null = startElement.closest(containerSelector)
  if (!container) return

  return {selectionText, range: selectionContext.range, container}
}

export function asMarkdown(
  quote: Quote,
  scopeSelector?: string,
  callback?: (fragment: DocumentFragment) => void
): Quote | undefined {
  const fragment = extractFragment(quote.range, scopeSelector ?? '')
  callback?.(fragment)
  insertMarkdownSyntax(fragment)
  quote.selectionText = selectFragment(fragment).replace(/^\n+/, '').replace(/\s+$/, '')
  return quote
}

export function insertQuote(selectionText: string, field: HTMLTextAreaElement) {
  let quotedText = `> ${selectionText.replace(/\n/g, '\n> ')}\n\n`
  if (field.value) {
    quotedText = `${field.value}\n\n${quotedText}`
  }
  field.value = quotedText
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

function visible(el: HTMLElement): boolean {
  return !(el.offsetWidth <= 0 && el.offsetHeight <= 0)
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
