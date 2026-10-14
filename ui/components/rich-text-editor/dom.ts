/*
 * Selection and DOM helpers for the HTML editor, ported from the same widget
 * in Axelor Open Platform so that the markup produced here matches what the
 * back-office produces for the same field.
 */

export function cancelEvent(event: {
  preventDefault: () => void;
  stopPropagation: () => void;
}) {
  event.preventDefault();
  event.stopPropagation();
}

const MEDIA_NODE_NAMES = [
  'IMG',
  'PICTURE',
  'SVG',
  'VIDEO',
  'AUDIO',
  'IFRAME',
  'MAP',
  'OBJECT',
  'EMBED',
];

export function isMediaNode(node: Node) {
  return MEDIA_NODE_NAMES.includes(node.nodeName);
}

export function isOrContainsNode(
  ancestor: Node,
  descendant: Node | null,
  within?: boolean,
) {
  let node: Node | null = within
    ? (descendant?.parentNode ?? null)
    : descendant;
  while (node) {
    if (node === ancestor) return true;
    node = node.parentNode;
  }
  return false;
}

/*
 * Reports whether the current selection lies inside the editable region. With
 * `force`, a selection that has drifted outside is pulled back to the end of
 * the content instead, so a toolbar command always has somewhere to apply.
 */
export function selectionInside(containerNode: Node, force?: boolean) {
  const selection = window.getSelection();
  if (!selection) return false;

  if (
    isOrContainsNode(containerNode, selection.anchorNode) &&
    isOrContainsNode(containerNode, selection.focusNode)
  ) {
    return true;
  }

  if (!force) return false;

  const range = document.createRange();
  range.selectNodeContents(containerNode);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
  return true;
}

export function collapseSelectionEnd() {
  const selection = window.getSelection();
  if (selection && !selection.isCollapsed) {
    selection.collapseToEnd();
  }
}

export function getSelectionCollapsed() {
  return window.getSelection()?.isCollapsed ?? true;
}

export function getSelectionHtml(containerNode: Node) {
  if (getSelectionCollapsed()) return null;

  const selection = window.getSelection();
  if (!selection?.rangeCount) return null;

  const container = document.createElement('div');
  for (let index = 0; index < selection.rangeCount; ++index) {
    container.appendChild(selection.getRangeAt(index).cloneContents());
  }
  return container.innerHTML;
}

/*
 * Inserts a fragment at the caret and leaves the caret after it. Used where
 * `insertHTML` is unavailable or has been refused by the browser.
 */
export function pasteHtmlAtCaret(containerNode: Node, html: string) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;

  let range = selection.getRangeAt(0);
  const holder = document.createElement('div');
  holder.innerHTML = html;

  const fragment = document.createDocumentFragment();
  let lastNode: Node | null = null;
  let node: ChildNode | null;
  while ((node = holder.firstChild)) {
    lastNode = fragment.appendChild(node);
  }

  if (isOrContainsNode(containerNode, range.commonAncestorContainer)) {
    range.deleteContents();
    range.insertNode(fragment);
  } else {
    containerNode.appendChild(fragment);
  }

  if (lastNode) {
    range = range.cloneRange();
    range.setStartAfter(lastNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

function nextNode(node: Node, container: Node): Node | null {
  if (node.firstChild) return node.firstChild;

  let current: Node | null = node;
  while (current) {
    if (current === container) return null;
    if (current.nextSibling) return current.nextSibling;
    current = current.parentNode;
  }
  return null;
}

function getSelectedNodes(containerNode: Node) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return [];

  const nodes: Node[] = [];
  for (let rangeIndex = 0; rangeIndex < selection.rangeCount; ++rangeIndex) {
    const range = selection.getRangeAt(rangeIndex);
    const endNode = range.endContainer;
    let node: Node | null = range.startContainer;

    while (node) {
      if (node !== containerNode && selection.containsNode(node, true)) {
        nodes.push(node);
      }
      node = nextNode(node, node === endNode ? endNode : containerNode);
    }
  }

  if (
    nodes.length === 0 &&
    selection.focusNode &&
    selection.focusNode !== containerNode &&
    isOrContainsNode(containerNode, selection.focusNode)
  ) {
    nodes.push(selection.focusNode);
  }

  return nodes;
}

export function findClosestAnchorNode(editor: Node | null) {
  if (!editor) return null;

  for (const node of getSelectedNodes(editor)) {
    const element =
      node.nodeType === Node.ELEMENT_NODE
        ? (node as Element)
        : node.parentElement;
    const anchor = element?.closest('a');
    if (anchor) return anchor;
  }
  return null;
}

function countAncestors(element: Element | null, tagNames: string[]) {
  let count = 0;
  for (
    let parent = element?.parentElement;
    parent;
    parent = parent.parentElement
  ) {
    if (tagNames.includes(parent.tagName.toLowerCase())) count++;
  }
  return count;
}

/*
 * Rewrites the block spacing as inline styles so the content keeps its shape
 * outside the editor too — in a mail body, an export, or anywhere else the
 * surrounding stylesheet is not ours.
 */
export function normalizeHTML(html: string) {
  const holder = document.createElement('div');
  holder.innerHTML = html;

  holder.querySelectorAll('p').forEach(paragraph => {
    paragraph.style.marginTop = '0px';
    paragraph.style.marginBottom = '1em';
  });

  holder.querySelectorAll<HTMLElement>('ol,ul').forEach(list => {
    if (!countAncestors(list, ['ol', 'ul'])) {
      list.style.marginTop = '0px';
      list.style.marginBottom = '1em';
    }
  });

  holder.querySelectorAll('blockquote').forEach(quote => {
    quote.style.margin = countAncestors(quote, ['blockquote'])
      ? '0 0 0 2em'
      : '0 0 1em 2em';
    quote.style.border = 'none';
    quote.style.padding = '0';
  });

  return holder.innerHTML;
}

/*
 * Content a browser leaves behind when everything is deleted — a lone break,
 * an empty paragraph — reads as a value to anything checking the field, so it
 * is reported as empty instead.
 */
export function normalizeEmptyHtml(html: string) {
  if (!html) return '';

  const stripped = html.replace(/\s+/g, '').toLowerCase();
  if (stripped === '<br>' || stripped === '<br/>') return '';

  const remaining = stripped
    .replace(/<p><br\/?><\/p>/g, '')
    .replace(/<p><\/p>/g, '');
  return remaining ? html : '';
}
