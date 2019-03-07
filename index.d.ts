/**
 * Delegates event to a selector.
 */
declare type CombinedElements = EventTarget | EventTarget[] | NodeListOf<Element> | String;
declare const _default: (elements: CombinedElements, selector: string, type: string, callback: () => any, useCapture: boolean | AddEventListenerOptions) => any;
export = _default;
