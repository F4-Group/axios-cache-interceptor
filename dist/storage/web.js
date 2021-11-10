"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionCacheStorage = exports.LocalCacheStorage = exports.WindowStorageWrapper = exports.DEFAULT_KEY_PREFIX = void 0;
const util_1 = require("./util");
/**
 * The key prefix used in WindowStorageWrapper to prevent key
 * collisions with other code.
 */
exports.DEFAULT_KEY_PREFIX = 'axios-cache-interceptor';
/**
 * A storage that uses any {@link Storage} as his storage.
 *
 * **Note**: All storage keys used are prefixed with `prefix` value.
 */
class WindowStorageWrapper {
    /**
     * Creates a new instance of WindowStorageWrapper
     *
     * @param storage The storage to interact
     * @param prefix The prefix to use for all keys or
     *   `DEFAULT_KEY_PREFIX` if not provided.
     * @see DEFAULT_KEY_PREFIX
     */
    constructor(storage, prefix = exports.DEFAULT_KEY_PREFIX) {
        this.storage = storage;
        this.prefix = prefix;
        this.get = async (key) => {
            const prefixedKey = this.prefixKey(key);
            const json = this.storage.getItem(prefixedKey);
            if (!json) {
                return { state: 'empty' };
            }
            const parsed = JSON.parse(json);
            if ((0, util_1.isCacheValid)(parsed) === false) {
                if ((0, util_1.canRevalidate)(parsed)) {
                    return { ...parsed, state: 'stale' };
                }
                else {
                    return { state: 'empty' };
                }
            }
            return parsed;
        };
        this.set = async (key, value) => {
            const json = JSON.stringify(value);
            this.storage.setItem(this.prefixKey(key), json);
        };
        this.remove = async (key) => {
            this.storage.removeItem(this.prefixKey(key));
        };
        this.prefixKey = (key) => `${this.prefix}:${key}`;
    }
}
exports.WindowStorageWrapper = WindowStorageWrapper;
class LocalCacheStorage extends WindowStorageWrapper {
    constructor(prefix) {
        super(window.localStorage, prefix);
    }
}
exports.LocalCacheStorage = LocalCacheStorage;
class SessionCacheStorage extends WindowStorageWrapper {
    constructor(prefix) {
        super(window.sessionStorage, prefix);
    }
}
exports.SessionCacheStorage = SessionCacheStorage;
//# sourceMappingURL=web.js.map