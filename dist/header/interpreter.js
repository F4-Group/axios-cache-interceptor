"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultHeaderInterpreter = void 0;
const cache_control_1 = require("@tusbar/cache-control");
const defaultHeaderInterpreter = (headers) => {
    const cacheControl = headers?.['cache-control'];
    if (!cacheControl) {
        // Checks if Expires header is present
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Expires
        const expires = headers?.['expires'];
        if (expires) {
            const milliseconds = Date.parse(expires) - Date.now();
            if (milliseconds > 0) {
                return milliseconds;
            }
            else {
                return false;
            }
        }
        return undefined;
    }
    const { noCache, noStore, mustRevalidate, maxAge } = (0, cache_control_1.parse)(cacheControl);
    // Header told that this response should not be cached.
    if (noCache || noStore) {
        return false;
    }
    // set ttl to 1ms, enabling use of etag / last-modified revalidation
    if (mustRevalidate) {
        return 1;
    }
    if (!maxAge) {
        return undefined;
    }
    return maxAge * 1000;
};
exports.defaultHeaderInterpreter = defaultHeaderInterpreter;
//# sourceMappingURL=interpreter.js.map