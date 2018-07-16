/* @flow */

import selectionToMarkdown from './markdown-parsing'

const containers = new WeakMap()

export function install(container: Element) {
  containers.set(container, 1)
  document.addEventListener('keydown', quoteSelection)
}

export function uninstall(container: Element) {
  containers.delete(container)
  document.removeEventListener('keydown', quoteSelection)
}

function eventIsNotRelevant(event: KeyboardEvent): boolean {
  return (
    event.defaultPrevented ||
    (event.key !== 'r' || event.metaKey || event.altKey || event.shiftKey || event.ctrlKey) ||
    (event.target instanceof HTMLElement && isFormField(event.target))
  )
}

function findContainer(el: Element): ?Element {
  let parent = el
  while ((parent = parent.parentElement)) {
    if (containers.has(parent)) {
      return parent
    }
  }
}

function quoteSelection(event: KeyboardEvent): void {
  if (eventIsNotRelevant(event)) return

  const selection = window.getSelection()
  let selectionText = selection.toString().trim()
  if (!selectionText) return

  let focusNode = selection.focusNode
  if (!focusNode) return

  if (focusNode.nodeType !== Node.ELEMENT_NODE) focusNode = focusNode.parentNode
  if (!(focusNode instanceof Element)) return

  const container = findContainer(focusNode)
  if (!container) return

  if (container.hasAttribute('data-quote-markdown')) {
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

  const quotedText = `> ${selectionText.replace(/\n/g, '\n> ')}\n\n`
  function appendText(field: HTMLTextAreaElement) {
    let text = quotedText
    if (field.value) {
      text = `${field.value}\n\n${quotedText}`
    }
    field.value = text

    field.focus()
    field.selectionStart = field.value.length
    field.scrollTop = field.scrollHeight
  }

  const eventDetail = {selection, selectionText, quotedText, appendText}
  const fireEvent = container.dispatchEvent(
    new CustomEvent('quote-selection', {
      bubbles: true,
      cancelable: true,
      detail: eventDetail
    })
  )

  if (!fireEvent) {
    event.preventDefault()
    return
  }

  const field = Array.from(container.querySelectorAll('textarea')).filter(visible)[0]
  if (!(field instanceof HTMLTextAreaElement)) return

  appendText(field)
  event.preventDefault()
}

function visible(el: HTMLElement) {
  return !(el.offsetWidth <= 0 && el.offsetHeight <= 0)
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
