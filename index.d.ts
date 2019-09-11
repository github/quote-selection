type ConfigOptions = {
  quoteMarkdown?: boolean,
  copyMarkdown?: boolean,
  scopeSelector?: string
}

interface Subscription {
  unsubscribe: () => void
}

export function install(container: Element, options?: ConfigOptions): void;
export function uninstall(container: Element): void;
export function subscribe(container: Element, options?: ConfigOptions): Subscription;
export function findContainer(el: Element): Element | undefined;
export function findTextarea(container: Element): HTMLTextAreaElement | undefined;
export function quote(text: string, range: Range): boolean;
