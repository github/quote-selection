import {extractFragment, insertMarkdownSyntax} from './markdown'

const containers: WeakMap<Element, Options> = new WeakMap()
const controllers: WeakMap<Element, AbortController> = new WeakMap()

let firstInstall = true

type Options = {
  quoteMarkdown: boolean
  copyMarkdown: boolean
  scopeSelector: string
  signal?: AbortSignal
}

export function install(container: Element, options?: Partial<Options>) {
  const config: Options = Object.assign(
    {
      quoteMarkdown: false,
      copyMarkdown: false,
      scopeSelector: ''
    },
    options
  )
  if (options?.signal) {
    options.signal.addEventListener('abort', function () {
      controller.abort()
    })
  }
  containers.set(container, config)
  const controller = new AbortController()
  controller.signal.addEventListener('abort', function () {
    containers.delete(container)
    controllers.delete(container)
  })
  if (firstInstall) {
    document.addEventListener('keydown', (e: KeyboardEvent) => quoteSelection(e, config), {signal: controller.signal})
    firstInstall = false
  }
  if (config.copyMarkdown) {
    ;(container as HTMLElement).addEventListener('copy', (e: ClipboardEvent) => onCopy(e, config), {
      signal: controller.signal
    })
  }
}

export function uninstall(container: Element) {
  controllers.get(container)?.abort()
}

function onCopy(event: ClipboardEvent, options: Partial<Options>) {
  const target = event.target
  if (!(target instanceof HTMLElement)) return
  if (isFormField(target)) return

  const transfer = event.clipboardData
  if (!transfer) return

  const selection = window.getSelection()
  if (!selection) return
  let range
  try {
    range = selection.getRangeAt(0)
  } catch {
    return
  }

  const text = selection.toString()
  const quoted = extractQuote(text, range, true, options)
  if (!quoted) return

  transfer.setData('text/plain', text)
  transfer.setData('text/x-gfm', quoted.selectionText)
  event.preventDefault()

  selection.removeAllRanges()
  selection.addRange(range)
}

function eventIsNotRelevant(event: KeyboardEvent): boolean {
  return (
    event.defaultPrevented ||
    event.key !== 'r' ||
    event.metaKey ||
    event.altKey ||
    event.shiftKey ||
    event.ctrlKey ||
    (event.target instanceof HTMLElement && isFormField(event.target))
  )
}

export function findContainer(el: Element): Element | undefined {
  let parent: Element | null = el
  while ((parent = parent.parentElement)) {
    if (containers.has(parent)) {
      return parent
    }
  }
}

export function findTextarea(container: Element): HTMLTextAreaElement | undefined {
  for (const field of container.querySelectorAll('textarea')) {
    if (field instanceof HTMLTextAreaElement && visible(field)) {
      return field
    }
  }
}

function quoteSelection(event: KeyboardEvent, options: Partial<Options>): void {
  if (eventIsNotRelevant(event)) return
  const selection = window.getSelection()
  if (!selection) return
  let range
  try {
    range = selection.getRangeAt(0)
  } catch {
    return
  }
  if (quote(selection.toString(), range, options)) {
    event.preventDefault()
  }
}

export function quote(text: string, range: Range, options: Partial<Options>): boolean {
  const quoted = extractQuote(text, range, false, options)
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
  container: Element
  selectionText: string
}

function extractQuote(text: string, range: Range, unwrap: boolean, options: Partial<Options>): Quote | undefined {
  let selectionText = text.trim()
  if (!selectionText) return

  let focusNode: Node | null = range.startContainer
  if (!focusNode) return

  if (focusNode.nodeType !== Node.ELEMENT_NODE) focusNode = focusNode.parentNode
  if (!(focusNode instanceof Element)) return

  const container = findContainer(focusNode)
  if (!container) return

  if (options?.quoteMarkdown) {
    try {
      const fragment = extractFragment(range, options.scopeSelector ?? '')
      container.dispatchEvent(
        new CustomEvent('quote-selection-markdown', {
          bubbles: true,
          cancelable: false,
          detail: {fragment, range, unwrap}
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
