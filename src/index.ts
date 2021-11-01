import {extractFragment, insertMarkdownSyntax} from './markdown'

type Options = {
  quoteMarkdown: boolean
  scopeSelector: string
  quoteElement: Element
}

type Quote = {
  container: Element
  selectionText: string
}

export function extractQuote(containerSelector: string, options?: Partial<Options>): Quote | undefined {
  const selection = window.getSelection()
  if (!selection) return
  if (options?.quoteElement) {
    selection.removeAllRanges()
    selection.selectAllChildren(options.quoteElement)
  }
  let range
  try {
    range = selection.getRangeAt(0)
  } catch {
    return
  }
  let selectionText = selection.toString().trim()
  if (!selectionText) return

  const startContainer = range.startContainer
  const startElement: Element | null = startContainer instanceof Element ? startContainer : startContainer.parentElement
  if (!startElement) return

  const container = startElement.closest(containerSelector)
  if (!container) return

  if (options?.quoteMarkdown) {
    try {
      const fragment = extractFragment(range, options.scopeSelector ?? '')
      container.dispatchEvent(
        new CustomEvent('quote-selection-markdown', {
          bubbles: true,
          cancelable: false,
          detail: {fragment, range}
        })
      )
      insertMarkdownSyntax(fragment)
      selectionText = selectFragment(fragment).replace(/^\n+/, '').replace(/\s+$/, '')
    } catch (error) {
      setTimeout(() => {
        throw error
      })
    }
  }

  return {selectionText, container}
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
