/* @flow */

function matches(el: Element, ...names: Array<string>): boolean {
  return names.some(name => el.classList.contains(name))
}

function indexInList(li: Element): number {
  if (li.parentNode === null || !(li.parentNode instanceof HTMLElement)) throw new Error()

  const ref = li.parentNode.children
  for (let i = 0; i < ref.length; ++i) {
    if (ref[i] === li) {
      return i
    }
  }
  return 0
}

function skipNode(node: Node): boolean {
  // skip processing links that only link to the src of image within
  return (
    node instanceof HTMLAnchorElement &&
    node.childNodes.length === 1 &&
    node.childNodes[0] instanceof HTMLImageElement &&
    node.childNodes[0].src === node.href
  )
}

function hasContent(node: Node): boolean {
  return node.nodeName === 'IMG' || node.firstChild != null
}

function isCheckbox(node: Node): boolean {
  return node.nodeName === 'INPUT' && node instanceof HTMLInputElement && node.type === 'checkbox'
}

function isHighlightContainer(el: HTMLElement): boolean {
  return el.nodeName === 'DIV' && el.classList.contains('highlight')
}

let listIndexOffset = 0

function nestedListExclusive(li: Element): boolean {
  const first = li.childNodes[0]
  const second = li.childNodes[1]
  if (first && li.childNodes.length < 3) {
    return (
      (first.nodeName === 'OL' || first.nodeName === 'UL') &&
      (!second || (second.nodeType === Node.TEXT_NODE && !second.textContent.trim()))
    )
  }

  return false
}

function escapeAttribute(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const filters: {[key: string]: (HTMLElement) => string | HTMLElement} = {
  INPUT(el) {
    if (el instanceof HTMLInputElement && el.checked) {
      return '[x] '
    }
    return '[ ] '
  },
  CODE(el) {
    const text = el.textContent

    if (el.parentNode && el.parentNode.nodeName === 'PRE') {
      el.textContent = `\`\`\`\n${text.replace(/\n+$/, '')}\n\`\`\``
      return el
    }
    if (text.indexOf('`') >= 0) {
      return `\`\` ${text} \`\``
    }
    return `\`${text}\``
  },
  PRE(el) {
    const parent = el.parentNode
    if (parent instanceof HTMLElement && isHighlightContainer(parent)) {
      const match = parent.className.match(/highlight-source-(\S+)/)
      const flavor = match ? match[1] : ''
      const text = el.textContent.replace(/\n+$/, '')
      el.textContent = `\`\`\`${flavor}\n${text}\n\`\`\``
      el.append('\n\n')
    }
    return el
  },
  STRONG(el) {
    return `**${el.textContent}**`
  },
  EM(el) {
    return `_${el.textContent}_`
  },
  DEL(el) {
    return `~${el.textContent}~`
  },
  BLOCKQUOTE(el) {
    const text = el.textContent.trim().replace(/^/gm, '> ')
    const pre = document.createElement('pre')
    pre.textContent = `${text}\n\n`
    return pre
  },
  A(el) {
    const text = el.textContent
    const href = el.getAttribute('href')

    if (matches(el, 'user-mention', 'team-mention')) {
      return text
    } else if (matches(el, 'issue-link') && /^#\d+$/.test(text)) {
      return text
    } else if (/^https?:/.test(text) && text === href) {
      return text
    } else {
      if (href) {
        return `[${text}](${href})`
      } else {
        return text
      }
    }
  },
  IMG(el) {
    const alt = el.getAttribute('alt') || ''

    if (alt && matches(el, 'emoji')) {
      return alt
    } else {
      const src = el.getAttribute('src')
      if (!src) throw new Error()

      const widthAttr = el.hasAttribute('width') ? ` width="${escapeAttribute(el.getAttribute('width') || '')}"` : ''
      const heightAttr = el.hasAttribute('height')
        ? ` height="${escapeAttribute(el.getAttribute('height') || '')}"`
        : ''

      if (widthAttr || heightAttr) {
        return `<img alt="${escapeAttribute(alt)}"${widthAttr}${heightAttr} src="${escapeAttribute(src)}">`
      } else {
        return `![${alt}](${src})`
      }
    }
  },
  LI(el) {
    const list = el.parentNode
    if (!list) throw new Error()

    let bullet = ''
    if (!nestedListExclusive(el)) {
      if (list.nodeName === 'OL') {
        if (listIndexOffset > 0 && !list.previousSibling) {
          const num = indexInList(el) + listIndexOffset + 1
          bullet = `${num}\\. `
        } else {
          bullet = `${indexInList(el) + 1}. `
        }
      } else {
        bullet = '* '
      }
    }

    const indent = bullet.replace(/\S/g, ' ')
    const text = el.textContent.trim().replace(/^/gm, indent)
    const pre = document.createElement('pre')
    pre.textContent = text.replace(indent, bullet)
    return pre
  },
  OL(el) {
    const li = document.createElement('li')
    li.appendChild(document.createElement('br'))
    el.append(li)
    return el
  },
  H1(el) {
    const level = parseInt(el.nodeName.slice(1))
    el.prepend(`${Array(level + 1).join('#')} `)
    return el
  },
  UL(el) {
    return el
  }
}
filters.UL = filters.OL
for (let level = 2; level <= 6; ++level) {
  filters[`H${level}`] = filters.H1
}

// Public: Iterate over all elements within a node that match one of the filters. The
// iteration is done in reverse as a way of processing deepest matches first.
function fragmentToMarkdown(
  root: DocumentFragment,
  fn: (node: HTMLElement, content: string | HTMLElement) => void
): void {
  const nodeIterator = document.createNodeIterator(root, NodeFilter.SHOW_ELEMENT, function(node) {
    if (node.nodeName in filters && !skipNode(node) && (hasContent(node) || isCheckbox(node))) {
      return NodeFilter.FILTER_ACCEPT
    }

    return NodeFilter.FILTER_SKIP
  })
  const results: HTMLElement[] = []
  let node = nodeIterator.nextNode()

  while (node) {
    if (node instanceof HTMLElement) {
      results.push(node)
    }
    node = nodeIterator.nextNode()
  }

  results.reverse()
  for (node of results) {
    fn(node, filters[node.nodeName](node))
  }
}

export default function rangeToMarkdown(range: Range, selector: string, unwrap: boolean): DocumentFragment {
  const startNode = range.startContainer
  if (!startNode || !startNode.parentNode || !(startNode.parentNode instanceof HTMLElement)) {
    throw new Error('the range must start within an HTMLElement')
  }
  const parent = startNode.parentNode

  let fragment = range.cloneContents()
  if (selector) {
    const contentElement = fragment.querySelector(selector)
    if (contentElement) {
      fragment = document.createDocumentFragment()
      fragment.appendChild(contentElement)
    }
  }

  listIndexOffset = 0
  const li = parent.closest('li')
  const codeBlock = parent.closest('pre')
  if (codeBlock) {
    const pre = document.createElement('pre')
    pre.appendChild(fragment)
    let item = pre
    if (!unwrap) {
      const pp = codeBlock.parentNode
      if (pp instanceof HTMLElement && isHighlightContainer(pp)) {
        const div = document.createElement('div')
        div.className = pp.className
        div.appendChild(item)
        item = div
      }
    }
    fragment = document.createDocumentFragment()
    fragment.appendChild(item)
  } else if (li && li.parentNode) {
    if (li.parentNode.nodeName === 'OL') {
      listIndexOffset = indexInList(li)
    }
    if (!fragment.querySelector('li')) {
      const item = document.createElement('li')

      if (!li.parentNode) throw new Error()
      const list = document.createElement(li.parentNode.nodeName)

      item.appendChild(fragment)
      list.appendChild(item)
      fragment = document.createDocumentFragment()
      fragment.appendChild(list)
    }
  }
  fragmentToMarkdown(fragment, (el, newContent) => el.replaceWith(newContent))
  return fragment
}
