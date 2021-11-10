"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCache = void 0;
async function updateCache(storage, data, entries) {
    for (const cacheKey in entries) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const value = entries[cacheKey];
        if (value == 'delete') {
            await storage.remove(cacheKey);
            continue;
        }
        const oldValue = await storage.get(cacheKey);
        if (oldValue.state === 'loading') {
            throw new Error('cannot update the cache while loading');
        }
        const newValue = value(oldValue, data);
        if (newValue === undefined) {
            await storage.remove(cacheKey);
            continue;
        }
        await storage.set(cacheKey, newValue);
    }
}
exports.updateCache = updateCache;
//# sourceMappingURL=update-cache.js.map