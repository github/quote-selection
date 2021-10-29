import {extractFragment, insertMarkdownSyntax} from './markdown'

type Options = {
  quoteMarkdown: boolean
  scopeSelector: string
  containerSelector: string
}

interface SelectionContext {
  text: string
  range: Range
}

export function getSelectionContext(): SelectionContext | null {
  const selection = window.getSelection()
  if (!selection) return null
  try {
    return {text: selection.toString(), range: selection.getRangeAt(0)}
  } catch {
    return null
  }
}

export function findTextarea(container: Element): HTMLTextAreaElement | undefined {
  for (const field of container.querySelectorAll('textarea')) {
    if (field instanceof HTMLTextAreaElement && visible(field)) {
      return field
    }
  }
}

export function quote(selectionContext: SelectionContext, options: Partial<Options>): boolean {
  const quoted = extractQuote(selectionContext, options)
  if (!quoted) return false

  const {container, selectionText} = quoted

  const dispatched = container.dispatchEvent(
    new CustomEvent('quote-selection', {
      bubbles: true,
      cancelable: true,
      detail: {range: selectionContext.range, selectionText}
    })
  )

  if (!dispatched) {
    return true
  }

  const field = findTextarea(container)
  if (!field) return false

  insertQuote(selectionText, field)
  return true
}

type Quote = {
  container: Element
  selectionText: string
}

function extractQuote(selectionContext: SelectionContext, options: Partial<Options>): Quote | undefined {
  let selectionText = selectionContext.text.trim()
  if (!selectionText) return

  let focusNode: Node | null = selectionContext.range.startContainer
  if (!focusNode) return

  if (focusNode.nodeType !== Node.ELEMENT_NODE) focusNode = focusNode.parentNode
  if (!(focusNode instanceof Element)) return

  if (!options?.containerSelector) return

  const container = focusNode.closest(options.containerSelector)
  if (!container) return

  if (options?.quoteMarkdown) {
    try {
      const fragment = extractFragment(selectionContext.range, options.scopeSelector ?? '')
      container.dispatchEvent(
        new CustomEvent('quote-selection-markdown', {
          bubbles: true,
          cancelable: false,
          detail: {fragment, range: selectionContext.range}
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

function insertQuote(selectionText: string, field: HTMLTextAreaElement) {
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
