import {extractFragment, insertMarkdownSyntax} from './markdown'

export class Quote {
  constructor(public selection = window.getSelection()) {}

  container(selector: string): Element | null {
    const startContainer = this.range.startContainer
    const startElement: Element | null =
      startContainer instanceof Element ? startContainer : startContainer.parentElement
    if (!startElement) return null

    return startElement.closest(selector)
  }

  get range(): Range {
    if (!this.selection || !this.selection.rangeCount) return new Range()
    return this.selection.getRangeAt(0)
  }

  get selectionText(): string {
    return this.selection?.toString().trim() || ''
  }

  get quotedText(): string {
    return `> ${this.selectionText.replace(/\n/g, '\n> ')}\n\n`
  }
}

export function extractQuote(containerSelector: string, quoteElement?: Element): Quote {
  const quote = new Quote()
  if (quote.selection && quoteElement) {
    quote.selection.removeAllRanges()
    quote.selection.selectAllChildren(quoteElement)
  }
  return quote
}

export function asMarkdown(
  quote: Quote,
  scopeSelector?: string,
  callback?: (fragment: DocumentFragment) => void
): Quote {
  return new (class extends Quote {
    constructor() {
      super(quote.selection)
    }
    get selectionText() {
      const fragment = extractFragment(this.range, scopeSelector ?? '')
      callback?.(fragment)
      insertMarkdownSyntax(fragment)
      return selectFragment(fragment).replace(/^\n+/, '').replace(/\s+$/, '')
    }
  })()
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
