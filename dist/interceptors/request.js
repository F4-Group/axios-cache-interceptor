"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheRequestInterceptor = void 0;
const deferred_1 = require("typed-core/dist/promises/deferred");
class CacheRequestInterceptor {
    constructor(axios) {
        this.axios = axios;
        this.use = () => {
            this.axios.interceptors.request.use(this.onFulfilled);
        };
        this.onFulfilled = async (config) => {
            // Skip cache
            if (config.cache === false) {
                return config;
            }
            // Only cache specified methods
            const allowedMethods = config.cache?.methods || this.axios.defaults.cache.methods;
            if (!allowedMethods.some((method) => (config.method || 'get').toLowerCase() == method)) {
                return config;
            }
            const key = this.axios.generateKey(config);
            // Assumes that the storage handled staled responses
            let cache = await this.axios.storage.get(key);
            // Not cached, continue the request, and mark it as fetching
            emptyOrStaleState: if (cache.state == 'empty' || cache.state == 'stale') {
                /**
                 * This checks for simultaneous access to a new key. The js
                 * event loop jumps on the first await statement, so the second
                 * (asynchronous call) request may have already started executing.
                 */
                if (this.axios.waiting[key]) {
                    cache = (await this.axios.storage.get(key));
                    break emptyOrStaleState;
                }
                // Create a deferred to resolve other requests for the same key when it's completed
                this.axios.waiting[key] = (0, deferred_1.deferred)();
                /**
                 * Add a default reject handler to catch when the request is
                 * aborted without others waiting for it.
                 */
                this.axios.waiting[key]?.catch(() => undefined);
                let previousEntry;
                if (cache.state == 'stale') {
                    previousEntry = cache.data;
                    const { etag, 'last-modified': lastModified } = previousEntry.headers;
                    if (etag) {
                        config.headers = { ...config.headers, 'if-none-match': etag };
                    }
                    if (lastModified) {
                        config.headers = { ...config.headers, 'if-modified-since': lastModified };
                    }
                    if (etag || lastModified) {
                        const previousValidateStatus = config.validateStatus;
                        config.validateStatus = function (status) {
                            return status == 304 || !previousValidateStatus || previousValidateStatus(status);
                        };
                    }
                }
                await this.axios.storage.set(key, {
                    state: 'loading',
                    ttl: config.cache?.ttl,
                    data: previousEntry
                });
                return config;
            }
            let cachedResponse;
            if (cache.state === 'loading') {
                const deferred = this.axios.waiting[key];
                /**
                 * If the deferred is undefined, means that the outside has
                 * removed that key from the waiting list
                 */
                if (!deferred) {
                    await this.axios.storage.remove(key);
                    return config;
                }
                try {
                    cachedResponse = await deferred;
                }
                catch (e) {
                    // The deferred is rejected when the request that we are waiting rejected cache.
                    return config;
                }
            }
            else {
                cachedResponse = cache.data;
            }
            config.adapter = () => 
            /**
             * Even though the response interceptor receives this one from
             * here, it has been configured to ignore cached responses: true
             */
            Promise.resolve({
                config: config,
                data: cachedResponse.data,
                headers: cachedResponse.headers,
                status: cachedResponse.status,
                statusText: cachedResponse.statusText,
                cached: true,
                id: key
            });
            return config;
        };
    }
}
exports.CacheRequestInterceptor = CacheRequestInterceptor;
//# sourceMappingURL=request.js.map