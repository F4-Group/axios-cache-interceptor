"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheResponseInterceptor = void 0;
const object_1 = require("typed-core/dist/core/object");
const cache_predicate_1 = require("../util/cache-predicate");
const update_cache_1 = require("../util/update-cache");
class CacheResponseInterceptor {
    constructor(axios) {
        this.axios = axios;
        this.use = () => {
            this.axios.interceptors.response.use(this.onFulfilled);
        };
        this.testCachePredicate = (response, cache) => {
            const cachePredicate = cache?.cachePredicate || this.axios.defaults.cache.cachePredicate;
            return ((typeof cachePredicate === 'function' && cachePredicate(response)) ||
                (typeof cachePredicate === 'object' &&
                    (0, cache_predicate_1.checkPredicateObject)(response, cachePredicate)));
        };
        /**
         * Rejects cache for this response. Also update the waiting list for
         * this key by rejecting it.
         */
        this.rejectResponse = async (key) => {
            // Update the cache to empty to prevent infinite loading state
            await this.axios.storage.remove(key);
            // Reject the deferred if present
            this.axios.waiting[key]?.reject();
            delete this.axios.waiting[key];
        };
        this.onFulfilled = async (axiosResponse) => {
            const key = this.axios.generateKey(axiosResponse.config);
            const response = {
                id: key,
                /**
                 * The request interceptor response.cache will return true or
                 * undefined. And true only when the response was cached.
                 */
                cached: axiosResponse.cached || false,
                ...axiosResponse
            };
            // Skip cache
            if (response.config.cache === false) {
                return { ...response, cached: false };
            }
            // Response is already cached
            if (response.cached) {
                return response;
            }
            const cache = await this.axios.storage.get(key);
            /**
             * From now on, the cache and response represents the state of the
             * first response to a request, which has not yet been cached or
             * processed before.
             */
            if (cache.state !== 'loading') {
                return response;
            }
            // Config told that this response should be cached.
            if (!this.testCachePredicate(response, response.config.cache)) {
                await this.rejectResponse(key);
                return response;
            }
            let ttl = response.config.cache?.ttl || this.axios.defaults.cache.ttl;
            if (response.config.cache?.interpretHeader) {
                const expirationTime = this.axios.headerInterpreter(response.headers);
                // Cache should not be used
                if (expirationTime === false) {
                    await this.rejectResponse(key);
                    return response;
                }
                ttl = expirationTime ? expirationTime : ttl;
            }
            const staleCacheData = cache.data;
            if (response.status == 304 && staleCacheData) { // server told us data we have is still current
                response.cached = true;
                const { data, status, statusText, headers } = staleCacheData;
                response.data = data;
                response.status = status;
                response.statusText = statusText;
                const cacheHeaders = (0, object_1.extract)(headers, ['cache-control', 'etag', 'last-modified']);
                response.headers = { ...cacheHeaders, ...response.headers };
            }
            const data = (0, object_1.extract)(response, ['data', 'headers', 'status', 'statusText']);
            const newCache = {
                state: 'cached',
                ttl: ttl,
                createdAt: Date.now(),
                data
            };
            // Update other entries before updating himself
            if (response.config.cache?.update) {
                (0, update_cache_1.updateCache)(this.axios.storage, response.data, response.config.cache.update);
            }
            const deferred = this.axios.waiting[key];
            // Resolve all other requests waiting for this response
            await deferred?.resolve(newCache.data);
            delete this.axios.waiting[key];
            // Define this key as cache on the storage
            await this.axios.storage.set(key, newCache);
            return response;
        };
    }
}
exports.CacheResponseInterceptor = CacheResponseInterceptor;
//# sourceMappingURL=response.js.map