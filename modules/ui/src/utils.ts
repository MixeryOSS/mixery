export function traverse<T>(key: T | null, predicate: (value: T) => boolean, traverseFunc: (value: T) => T | null): T | null {
    do {
        if (key == null) return null;
        if (predicate(key)) return key;
        key = traverseFunc(key);
    } while (true);
}