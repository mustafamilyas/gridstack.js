// utils.ts 3.1.2-dev @preserve

/**
 * https://gridstackjs.com/
 * (c) 2014-2020 Alain Dumesny, Dylan Weiss, Pavel Reznikov
 * gridstack.js may be freely distributed under the MIT license.
*/

import { GridStackElement, GridStackWidget, GridStackNode, GridStackOptions, numberOrString } from './types';

export interface HeightData {
  h: number;
  unit: string;
}

/** checks for obsolete method names */
// eslint-disable-next-line
export function obsolete(self, f, oldName: string, newName: string, rev: string): (...args: any[]) => any {
  let wrapper = (...args) => {
    console.warn('gridstack.js: Function `' + oldName + '` is deprecated in ' + rev + ' and has been replaced ' +
    'with `' + newName + '`. It will be **completely** removed in v1.0');
    return f.apply(self, args);
  }
  wrapper.prototype = f.prototype;
  return wrapper;
}

/** checks for obsolete grid options (can be used for any fields, but msg is about options) */
export function obsoleteOpts(opts: GridStackOptions, oldName: string, newName: string, rev: string): void {
  if (opts[oldName] !== undefined) {
    opts[newName] = opts[oldName];
    console.warn('gridstack.js: Option `' + oldName + '` is deprecated in ' + rev + ' and has been replaced with `' +
      newName + '`. It will be **completely** removed in v1.0');
  }
}

/** checks for obsolete grid options which are gone */
export function obsoleteOptsDel(opts: GridStackOptions, oldName: string, rev: string, info: string): void {
  if (opts[oldName] !== undefined) {
    console.warn('gridstack.js: Option `' + oldName + '` is deprecated in ' + rev + info);
  }
}

/** checks for obsolete Jquery element attributes */
export function obsoleteAttr(el: HTMLElement, oldName: string, newName: string, rev: string): void {
  let oldAttr = el.getAttribute(oldName);
  if (oldAttr !== null) {
    el.setAttribute(newName, oldAttr);
    console.warn('gridstack.js: attribute `' + oldName + '`=' + oldAttr + ' is deprecated on this object in ' + rev + ' and has been replaced with `' +
      newName + '`. It will be **completely** removed in v1.0');
  }
}

/**
 * Utility methods
 */
export class Utils {

  /** convert a potential selector into actual list of html elements */
  static getElements(els: GridStackElement): HTMLElement[] {
    if (typeof els === 'string') {
      let list = document.querySelectorAll(els);
      if (!list.length && els[0] !== '.' && els[0] !== '#') {
        list = document.querySelectorAll('.' + els);
        if (!list.length) { list = document.querySelectorAll('#' + els) }
      }
      return Array.from(list) as HTMLElement[];
    }
    return [els];
  }

  /** convert a potential selector into actual single element */
  static getElement(els: GridStackElement): HTMLElement {
    if (typeof els === 'string') {
      if (!els.length) { return null}
      if (els[0] === '#') {
        return document.getElementById(els.substring(1));
      }
      if (els[0] === '.' || els[0] === '[') {
        return document.querySelector(els);
      }

      // if we start with a digit, assume it's an id (error calling querySelector('#1')) as class are not valid CSS
      if(!isNaN(+els[0])) { // start with digit
        return document.getElementById(els);
      }

      // finally try string, then id then class
      let el = document.querySelector(els);
      if (!el) { el = document.getElementById(els) }
      if (!el) { el = document.querySelector('.' + els) }
      return el as HTMLElement;
    }
    return els;
  }

  /** returns true if a and b overlap */
  static isIntercepted(a: GridStackWidget, b: GridStackWidget): boolean {
    return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
  }

  /**
   * Sorts array of nodes
   * @param nodes array to sort
   * @param dir 1 for asc, -1 for desc (optional)
   * @param width width of the grid. If undefined the width will be calculated automatically (optional).
   **/
  static sort(nodes: GridStackNode[], dir?: -1 | 1, column?: number): GridStackNode[] {
    if (!column) {
      let widths = nodes.map(n => n.x + n.w);
      column = Math.max(...widths);
    }

    if (dir === -1)
      return nodes.sort((a, b) => (b.x + b.y * column)-(a.x + a.y * column));
    else
      return nodes.sort((b, a) => (b.x + b.y * column)-(a.x + a.y * column));
  }

  /**
   * creates a style sheet with style id under given parent
   * @param id will set the 'gs-style-id' attribute to that id
   * @param parent to insert the stylesheet as first child,
   * if none supplied it will be appended to the document head instead.
   */
  static createStylesheet(id: string, parent?: HTMLElement): CSSStyleSheet {
    let style: HTMLStyleElement = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('gs-style-id', id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((style as any).styleSheet) { // TODO: only CSSImportRule have that and different beast ??
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (style as any).styleSheet.cssText = '';
    } else {
      style.appendChild(document.createTextNode('')); // WebKit hack
    }
    if (!parent) {
      // default to head
      parent = document.getElementsByTagName('head')[0];
      parent.appendChild(style);
    } else {
      parent.insertBefore(style, parent.firstChild);
    }
    return style.sheet as CSSStyleSheet;
  }

  /** removed the given stylesheet id */
  static removeStylesheet(id: string): void {
    let el = document.querySelector('STYLE[gs-style-id=' + id + ']');
    if (!el || !el.parentNode) return;
    el.parentNode.removeChild(el);
  }

  /** inserts a CSS rule */
  static addCSSRule(sheet: CSSStyleSheet, selector: string, rules: string): void {
    if (typeof sheet.addRule === 'function') {
      sheet.addRule(selector, rules);
    } else if (typeof sheet.insertRule === 'function') {
      sheet.insertRule(`${selector}{${rules}}`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static toBool(v: unknown): boolean {
    if (typeof v === 'boolean') {
      return v;
    }
    if (typeof v === 'string') {
      v = v.toLowerCase();
      return !(v === '' || v === 'no' || v === 'false' || v === '0');
    }
    return Boolean(v);
  }

  static toNumber(value: null | string): number {
    return (value === null || value.length === 0) ? undefined : Number(value);
  }

  static parseHeight(val: numberOrString): HeightData {
    let h: number;
    let unit = 'px';
    if (typeof val === 'string') {
      let match = val.match(/^(-[0-9]+\.[0-9]+|[0-9]*\.[0-9]+|-[0-9]+|[0-9]+)(px|em|rem|vh|vw|%)?$/);
      if (!match) {
        throw new Error('Invalid height');
      }
      unit = match[2] || 'px';
      h = parseFloat(match[1]);
    } else {
      h = val;
    }
    return { h, unit };
  }

  /** copies unset fields in target to use the given default sources values */
  // eslint-disable-next-line
  static defaults(target, ...sources): {} {

    sources.forEach(source => {
      for (const key in source) {
        if (!source.hasOwnProperty(key)) { return; }
        if (target[key] === null || target[key] === undefined) {
          target[key] = source[key];
        } else if (typeof source[key] === 'object' && typeof target[key] === 'object') {
          // property is an object, recursively add it's field over... #1373
          this.defaults(target[key], source[key]);
        }
      }
    });

    return target;
  }

  /** given 2 objects return true if they have the same values. Checks for Object {} having same fields and values (just 1 level down) */
  static same(a: unknown, b: unknown): boolean {
    if (typeof a !== 'object')  { return a == b; }
    if (typeof a !== typeof b) { return false; }
    // else we have object, check just 1 level deep for being same things...
    if (Object.keys(a).length !== Object.keys(b).length) { return false; }
    for (const key in a) {
      if (a[key] !== b[key]) { return false; }
    }
    return true;
  }

  /** removes field from the first object if same as the second objects (like diffing) and internal '_' for saving */
  static removeInternalAndSame(a: unknown, b: unknown):void {
    if (typeof a !== 'object' || typeof b !== 'object') return;
    for (let key in a) {
      let val = a[key];
      if (val && typeof val === 'object') {
        for (let i in val) {
          if (val[i] === b[key][i] || i[0] === '_') { delete val[i] }
        }
        if (!Object.keys(val).length) { delete a[key] }
      } else if (val === b[key] || key[0] === '_') { delete a[key] }
    }
  }

  /** return the closest parent matching the given class */
  static closestByClass(el: HTMLElement, name: string): HTMLElement {

    while(el = el.parentElement) {
      if (el.classList.contains(name)) return el;
    }
    return null;
  }

  /** delay calling the given function by certain amount of time */
  static throttle(callback: () => void, delay: number): () => void {
    let isWaiting = false;

    return (...args) => {
      if (!isWaiting) {
        callback.apply(this, args);
        isWaiting = true;
        setTimeout(() => isWaiting = false, delay);
      }
    }
  }

  static removePositioningStyles(el: HTMLElement): void {
    let style = el.style;
    if (style.position) {
      style.removeProperty('position');
    }
    if (style.left) {
      style.removeProperty('left');
    }
    if (style.top) {
      style.removeProperty('top');
    }
    if (style.width) {
      style.removeProperty('width');
    }
    if (style.height) {
      style.removeProperty('height');
    }
  }

  /** @internal */
  static getScrollParent(el: HTMLElement): HTMLElement {
    if (el === null) return document.documentElement;
    const style = getComputedStyle(el);
    const overflowRegex = /(auto|scroll)/;

    if (overflowRegex.test(style.overflow + style.overflowY)) {
      return el;
    } else {
      return this.getScrollParent(el.parentElement);
    }
  }

  /** @internal */
  static updateScrollPosition(el: HTMLElement, position: {top: number}, distance: number): void {
    // is widget in view?
    let rect = el.getBoundingClientRect();
    let innerHeightOrClientHeight = (window.innerHeight || document.documentElement.clientHeight);
    if (rect.top < 0 ||
      rect.bottom > innerHeightOrClientHeight
    ) {
      // set scrollTop of first parent that scrolls
      // if parent is larger than el, set as low as possible
      // to get entire widget on screen
      let offsetDiffDown = rect.bottom - innerHeightOrClientHeight;
      let offsetDiffUp = rect.top;
      let scrollEl = this.getScrollParent(el);
      if (scrollEl !== null) {
        let prevScroll = scrollEl.scrollTop;
        if (rect.top < 0 && distance < 0) {
          // moving up
          if (el.offsetHeight > innerHeightOrClientHeight) {
            scrollEl.scrollTop += distance;
          } else {
            scrollEl.scrollTop += Math.abs(offsetDiffUp) > Math.abs(distance) ? distance : offsetDiffUp;
          }
        } else if (distance > 0) {
          // moving down
          if (el.offsetHeight > innerHeightOrClientHeight) {
            scrollEl.scrollTop += distance;
          } else {
            scrollEl.scrollTop += offsetDiffDown > distance ? distance : offsetDiffDown;
          }
        }
        // move widget y by amount scrolled
        position.top += scrollEl.scrollTop - prevScroll;
      }
    }
  }

  /**
   * @internal Function used to scroll the page.
   *
   * @param event `MouseEvent` that triggers the resize
   * @param el `HTMLElement` that's being resized
   * @param distance Distance from the V edges to start scrolling
   */
  static updateScrollResize(event: MouseEvent, el: HTMLElement, distance: number): void {
    const scrollEl = this.getScrollParent(el);
    const height = scrollEl.clientHeight;

    const top = event.clientY < distance;
    const bottom = event.clientY > height - distance;

    if (top) {
      // This also can be done with a timeout to keep scrolling while the mouse is
      // in the scrolling zone. (will have smoother behavior)
      scrollEl.scrollBy({ behavior: 'smooth', top: event.clientY - distance});
    } else if (bottom) {
      scrollEl.scrollBy({ behavior: 'smooth', top: distance - (height - event.clientY)});
    }
  }
}

