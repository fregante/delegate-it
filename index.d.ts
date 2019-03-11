declare type EventType = keyof GlobalEventHandlersEventMap;
declare type DelegateSubscription = {
    destroy: VoidFunction;
};
declare type DelegateEvent<T extends Event = Event> = T & {
    delegateTarget: EventTarget;
};
declare type DelegateEventHandler<T extends Event> = ((event: DelegateEvent<T>) => Promise<void>) | ((event: DelegateEvent<T>) => void);
declare function delegate<TEvent extends Event = Event>(selector: string, type: EventType, callback?: DelegateEventHandler<TEvent>, useCapture?: boolean | AddEventListenerOptions): DelegateSubscription;
export default delegate;
