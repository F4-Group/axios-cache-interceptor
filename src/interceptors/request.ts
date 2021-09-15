import { AxiosCacheInstance } from '../axios/types';
import { CachedResponse } from '../storage/types';
import { Deferred } from '../util/deferred';
import { CACHED_RESPONSE_STATUS, CACHED_RESPONSE_STATUS_TEXT } from '../util/status-codes';

export function applyRequestInterceptor(axios: AxiosCacheInstance): void {
  axios.interceptors.request.use(async (config) => {
    // Ignore caching
    if (config.cache === false) {
      return config;
    }

    // Only cache specified methods
    const allowedMethods = config.cache?.methods || axios.defaults.cache.methods;

    if (!allowedMethods.some((method) => (config.method || 'get').toLowerCase() == method)) {
      return config;
    }

    const key = axios.generateKey(config);

    // Assumes that the storage handled staled responses
    const cache = await axios.storage.get(key);

    // Not cached, continue the request, and mark it as fetching
    if (cache.state == 'empty') {
      // Create a deferred to resolve other requests for the same key when it's completed
      axios.waiting[key] = new Deferred();

      await axios.storage.set(key, {
        state: 'loading',
        ttl: config.cache?.ttl
      });

      return config;
    }

    let data: CachedResponse = {};

    if (cache.state === 'loading') {
      const deferred = axios.waiting[key];

      // If the deferred is undefined, means that the
      // outside has removed that key from the waiting list
      if (!deferred) {
        await axios.storage.remove(key);
        return config;
      }

      data = await deferred;
    } else {
      data = cache.data;
    }

    config.adapter = () =>
      Promise.resolve({
        config,
        data: data.body,
        headers: data.headers,
        status: CACHED_RESPONSE_STATUS,
        statusText: CACHED_RESPONSE_STATUS_TEXT
      });

    return config;
  });
}
