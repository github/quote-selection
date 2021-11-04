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

  select(element: Element) {
    if (this.selection) {
      this.selection.removeAllRanges()
      this.selection.selectAllChildren(element)
    }
  }
}

export class MarkdownQuote extends Quote {
  constructor(
    public selection = window.getSelection(),
    private scopeSelector?: string,
    private callback?: (fragment: DocumentFragment) => void
  ) {
    super(selection)
  }

  get selectionText() {
    if (!this.selection) return ''
    const fragment = extractFragment(this.range, this.scopeSelector ?? '')
    this.callback?.(fragment)
    insertMarkdownSyntax(fragment)
    const body = document.body
    if (!body) return ''

    const div = document.createElement('div')
    div.appendChild(fragment)
    div.style.cssText = 'position:absolute;left:-9999px;'
    body.appendChild(div)
    let selectionText = ''
    try {
      const range = document.createRange()
      range.selectNodeContents(div)
      this.selection.removeAllRanges()
      this.selection.addRange(range)
      selectionText = this.selection.toString()
      this.selection.removeAllRanges()
      range.detach()
    } finally {
      body.removeChild(div)
    }
    return selectionText.trim()
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
