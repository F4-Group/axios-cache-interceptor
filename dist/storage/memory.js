"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryStorage = void 0;
const util_1 = require("./util");
class MemoryStorage {
    constructor() {
        this.storage = new Map();
        this.get = async (key) => {
            const value = this.storage.get(key);
            if (!value) {
                return { state: 'empty' };
            }
            if ((0, util_1.isCacheValid)(value) === false) {
                if (value.state == 'cached' && (0, util_1.canRevalidate)(value)) {
                    return { ...value, state: 'stale' };
                }
                else {
                    return { state: 'empty' };
                }
            }
            return value;
        };
        this.set = async (key, value) => {
            this.storage.set(key, value);
        };
        this.remove = async (key) => {
            this.storage.delete(key);
        };
    }
}
exports.MemoryStorage = MemoryStorage;
//# sourceMappingURL=memory.js.map