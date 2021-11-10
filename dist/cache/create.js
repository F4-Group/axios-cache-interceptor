"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCache = exports.useCache = void 0;
const axios_1 = __importDefault(require("axios"));
const interpreter_1 = require("../header/interpreter");
const request_1 = require("../interceptors/request");
const response_1 = require("../interceptors/response");
const memory_1 = require("../storage/memory");
const key_generator_1 = require("../util/key-generator");
/**
 * Apply the caching interceptors for a already created axios instance.
 *
 * @param axios The already created axios instance
 * @param config The config for the caching interceptors
 * @returns The same instance but with caching enabled
 */
function useCache(axios, { storage, generateKey, waiting, headerInterpreter, requestInterceptor, responseInterceptor, ...cacheOptions } = {}) {
    const axiosCache = axios;
    axiosCache.storage = storage || new memory_1.MemoryStorage();
    axiosCache.generateKey = generateKey || key_generator_1.defaultKeyGenerator;
    axiosCache.waiting = waiting || {};
    axiosCache.headerInterpreter = headerInterpreter || interpreter_1.defaultHeaderInterpreter;
    axiosCache.requestInterceptor =
        requestInterceptor || new request_1.CacheRequestInterceptor(axiosCache);
    axiosCache.responseInterceptor =
        responseInterceptor || new response_1.CacheResponseInterceptor(axiosCache);
    // CacheRequestConfig values
    axiosCache.defaults = {
        ...axios.defaults,
        cache: {
            ttl: 1000 * 60 * 5,
            interpretHeader: false,
            methods: ['get'],
            cachePredicate: {
                statusCheck: [200, 399]
            },
            update: {},
            ...cacheOptions
        }
    };
    // Apply interceptors
    axiosCache.requestInterceptor.use();
    axiosCache.responseInterceptor.use();
    return axiosCache;
}
exports.useCache = useCache;
/**
 * Returns a new axios instance with caching enabled.
 *
 * @param config The config for the caching interceptors and the axios instance
 * @returns A new AxiosCacheInstance with caching enabled
 */
function createCache({ axios, cache } = {}) {
    return useCache(axios_1.default.create(axios), cache);
}
exports.createCache = createCache;
//# sourceMappingURL=create.js.map