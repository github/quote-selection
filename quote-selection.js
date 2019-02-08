/* @flow */

import rangeToMarkdown from './markdown-parsing'

const containers = new WeakMap()
let installed = 0

const edgeBrowser = /\bEdge\//.test(navigator.userAgent)

type Subscription = {|
  unsubscribe: () => void
|}

export function subscribe(container: Element): Subscription {
  install(container)
  return {
    unsubscribe: () => {
      uninstall(container)
    }
  }
}

export function install(container: Element) {
  installed += containers.has(container) ? 0 : 1
  containers.set(container, 1)
  document.addEventListener('keydown', quoteSelection)
  if (!edgeBrowser) {
    container.addEventListener('copy', onCopy)
  }
}

export function uninstall(container: Element) {
  installed -= containers.has(container) ? 1 : 0
  containers.delete(container)
  if (!installed) {
    document.removeEventListener('keydown', quoteSelection)
  }
  if (!edgeBrowser) {
    container.removeEventListener('copy', onCopy)
  }
}

function onCopy(event: ClipboardEvent) {
  const target = event.target
  if (!(target instanceof HTMLElement)) return
  if (isFormField(target)) return

  const transfer = event.clipboardData
  if (!transfer) return

  const selection = window.getSelection()
  let range
  try {
    range = selection.getRangeAt(0)
  } catch (err) {
    return
  }
  const quoted = extractQuote(selection.toString(), range, true)
  if (!quoted) return

  transfer.setData('text/plain', quoted.selectionText)
  event.preventDefault()

  selection.removeAllRanges()
  selection.addRange(range)
}

function eventIsNotRelevant(event: KeyboardEvent): boolean {
  return (
    event.defaultPrevented ||
    (event.key !== 'r' || event.metaKey || event.altKey || event.shiftKey || event.ctrlKey) ||
    (event.target instanceof HTMLElement && isFormField(event.target))
  )
}

export function findContainer(el: Element): ?Element {
  let parent = el
  while ((parent = parent.parentElement)) {
    if (containers.has(parent)) {
      return parent
    }
  }
}

export function findTextarea(container: Element): ?HTMLTextAreaElement {
  for (const field of container.querySelectorAll('textarea')) {
    if (field instanceof HTMLTextAreaElement && visible(field)) {
      return field
    }
  }
}

function quoteSelection(event: KeyboardEvent): void {
  if (eventIsNotRelevant(event)) return
  const selection = window.getSelection()
  let range
  try {
    range = selection.getRangeAt(0)
  } catch (err) {
    return
  }
  if (quote(selection.toString(), range)) {
    event.preventDefault()
  }
}

export function quote(text: string, range: Range): boolean {
  const quoted = extractQuote(text, range, false)
  if (!quoted) return false

  const {container, selectionText} = quoted

  const dispatched = container.dispatchEvent(
    new CustomEvent('quote-selection', {
      bubbles: true,
      cancelable: true,
      detail: {range, selectionText}
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
  container: Element,
  selectionText: string
}

function extractQuote(text: string, range: Range, unwrap: boolean): ?Quote {
  let selectionText = text.trim()
  if (!selectionText) return

  let focusNode = range.startContainer
  if (!focusNode) return

  if (focusNode.nodeType !== Node.ELEMENT_NODE) focusNode = focusNode.parentNode
  if (!(focusNode instanceof Element)) return

  const container = findContainer(focusNode)
  if (!container) return

  const markdownSelector = container.getAttribute('data-quote-markdown')
  if (markdownSelector != null && !edgeBrowser) {
    try {
      selectionText = selectFragment(rangeToMarkdown(range, markdownSelector, unwrap))
        .replace(/^\n+/, '')
        .replace(/\s+$/, '')
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
    const range = document.createRange()
    range.selectNodeContents(div)
    selection.removeAllRanges()
    selection.addRange(range)
    selectionText = selection.toString()
    selection.removeAllRanges()
    range.detach()
  } finally {
    body.removeChild(div)
  }
  return selectionText
}

function isFormField(element: HTMLElement): boolean {
  const name = element.nodeName.toLowerCase()
  const type = (element.getAttribute('type') || '').toLowerCase()
  return (
    name === 'select' ||
    name === 'textarea' ||
    (name === 'input' && type !== 'submit' && type !== 'reset') ||
    element.isContentEditable
  )
}
