type EventHandler = (args: any) => void;

let subscribers: Record<string, EventHandler[]> = {};

export function subscribe(eventType: string, func: (args: any) => void) {
    if (!subscribers[eventType])
        subscribers[eventType] = [];
    subscribers[eventType].push(func);
}

export function postEvent(eventType: string, args: any) {
    if (!subscribers[eventType])
        return;

    for (const func of subscribers[eventType] )
        func(args);
}