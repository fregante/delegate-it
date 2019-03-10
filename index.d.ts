/**
 * Delegates event to a selector.
 */
declare type CombinedElements = EventTarget | EventTarget[] | NodeListOf<Element> | string;
declare function delegate(selector: string, type: string, callback?: Function, useCapture?: boolean | AddEventListenerOptions): object;
declare function delegate(elements: CombinedElements, selector: string, type: string, callback?: Function, useCapture?: boolean | AddEventListenerOptions): object;
export default delegate;
