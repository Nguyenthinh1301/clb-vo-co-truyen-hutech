class CacheService {
    constructor() {
        this.cache = new Map();
        this.ttlTimers = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };
    }

    // Set cache with optional TTL (time to live in seconds)
    set(key, value, ttl = null) {
        try {
            // Clear existing TTL timer if any
            if (this.ttlTimers.has(key)) {
                clearTimeout(this.ttlTimers.get(key));
                this.ttlTimers.delete(key);
            }

            // Store value
            this.cache.set(key, {
                value,
                createdAt: Date.now(),
                expiresAt: ttl ? Date.now() + (ttl * 1000) : null
            });

            // Set TTL timer if specified
            if (ttl) {
                const timer = setTimeout(() => {
                    this.delete(key);
                }, ttl * 1000);
                this.ttlTimers.set(key, timer);
            }

            this.stats.sets++;
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }

    // Get cache value
    get(key) {
        try {
            if (!this.cache.has(key)) {
                this.stats.misses++;
                return null;
            }

            const item = this.cache.get(key);

            // Check if expired
            if (item.expiresAt && Date.now() > item.expiresAt) {
                this.delete(key);
                this.stats.misses++;
                return null;
            }

            this.stats.hits++;
            return item.value;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    // Delete cache entry
    delete(key) {
        try {
            // Clear TTL timer
            if (this.ttlTimers.has(key)) {
                clearTimeout(this.ttlTimers.get(key));
                this.ttlTimers.delete(key);
            }

            const deleted = this.cache.delete(key);
            if (deleted) {
                this.stats.deletes++;
            }
            return deleted;
        } catch (error) {
            console.error('Cache delete error:', error);
            return false;
        }
    }

    // Check if key exists
    has(key) {
        if (!this.cache.has(key)) {
            return false;
        }

        const item = this.cache.get(key);
        
        // Check if expired
        if (item.expiresAt && Date.now() > item.expiresAt) {
            this.delete(key);
            return false;
        }

        return true;
    }

    // Clear all cache
    clear() {
        // Clear all TTL timers
        this.ttlTimers.forEach(timer => clearTimeout(timer));
        this.ttlTimers.clear();
        
        this.cache.clear();
        console.log('✅ Cache cleared');
    }

    // Get cache statistics
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0
            ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
            : 0;

        return {
            size: this.cache.size,
            hits: this.stats.hits,
            misses: this.stats.misses,
            sets: this.stats.sets,
            deletes: this.stats.deletes,
            hitRate: `${hitRate}%`,
            memoryUsage: this.getMemoryUsage()
        };
    }

    // Get memory usage estimate
    getMemoryUsage() {
        let totalSize = 0;
        
        this.cache.forEach((item, key) => {
            totalSize += key.length * 2; // Approximate key size
            totalSize += JSON.stringify(item.value).length * 2; // Approximate value size
        });

        return {
            bytes: totalSize,
            kb: (totalSize / 1024).toFixed(2),
            mb: (totalSize / (1024 * 1024)).toFixed(2)
        };
    }

    // Get all keys
    keys() {
        return Array.from(this.cache.keys());
    }

    // Get all keys matching pattern
    keysPattern(pattern) {
        const regex = new RegExp(pattern);
        return this.keys().filter(key => regex.test(key));
    }

    // Delete keys matching pattern
    deletePattern(pattern) {
        const keys = this.keysPattern(pattern);
        let deletedCount = 0;
        
        keys.forEach(key => {
            if (this.delete(key)) {
                deletedCount++;
            }
        });

        return deletedCount;
    }

    // Set multiple values
    mset(entries) {
        let successCount = 0;
        
        Object.entries(entries).forEach(([key, value]) => {
            if (this.set(key, value)) {
                successCount++;
            }
        });

        return successCount;
    }

    // Get multiple values
    mget(keys) {
        const result = {};
        
        keys.forEach(key => {
            result[key] = this.get(key);
        });

        return result;
    }

    // Increment numeric value
    incr(key, amount = 1) {
        const current = this.get(key) || 0;
        const newValue = Number(current) + amount;
        this.set(key, newValue);
        return newValue;
    }

    // Decrement numeric value
    decr(key, amount = 1) {
        return this.incr(key, -amount);
    }

    // Get and delete (atomic operation)
    getdel(key) {
        const value = this.get(key);
        this.delete(key);
        return value;
    }

    // Set if not exists
    setnx(key, value, ttl = null) {
        if (this.has(key)) {
            return false;
        }
        return this.set(key, value, ttl);
    }

    // Get TTL (time to live) for a key
    ttl(key) {
        if (!this.cache.has(key)) {
            return -2; // Key doesn't exist
        }

        const item = this.cache.get(key);
        
        if (!item.expiresAt) {
            return -1; // No expiration
        }

        const remaining = Math.ceil((item.expiresAt - Date.now()) / 1000);
        return remaining > 0 ? remaining : -2;
    }

    // Extend TTL for a key
    expire(key, ttl) {
        if (!this.cache.has(key)) {
            return false;
        }

        const item = this.cache.get(key);
        return this.set(key, item.value, ttl);
    }

    // Cache wrapper for async functions
    async wrap(key, fn, ttl = 300) {
        // Check cache first
        const cached = this.get(key);
        if (cached !== null) {
            return cached;
        }

        // Execute function and cache result
        try {
            const result = await fn();
            this.set(key, result, ttl);
            return result;
        } catch (error) {
            console.error('Cache wrap error:', error);
            throw error;
        }
    }

    // Clean expired entries
    cleanExpired() {
        let cleanedCount = 0;
        
        this.cache.forEach((item, key) => {
            if (item.expiresAt && Date.now() > item.expiresAt) {
                this.delete(key);
                cleanedCount++;
            }
        });

        return cleanedCount;
    }

    // Reset statistics
    resetStats() {
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };
    }

    // Export cache data
    export() {
        const data = {};
        
        this.cache.forEach((item, key) => {
            data[key] = {
                value: item.value,
                createdAt: item.createdAt,
                expiresAt: item.expiresAt
            };
        });

        return data;
    }

    // Import cache data
    import(data) {
        Object.entries(data).forEach(([key, item]) => {
            const ttl = item.expiresAt 
                ? Math.ceil((item.expiresAt - Date.now()) / 1000)
                : null;
            
            if (!ttl || ttl > 0) {
                this.set(key, item.value, ttl);
            }
        });
    }
}

// Predefined cache keys
const CacheKeys = {
    // User cache
    USER: (id) => `user:${id}`,
    USER_PROFILE: (id) => `user:profile:${id}`,
    USER_CLASSES: (id) => `user:classes:${id}`,
    USER_EVENTS: (id) => `user:events:${id}`,
    
    // Class cache
    CLASS: (id) => `class:${id}`,
    CLASS_LIST: (page, limit) => `class:list:${page}:${limit}`,
    CLASS_STUDENTS: (id) => `class:students:${id}`,
    
    // Event cache
    EVENT: (id) => `event:${id}`,
    EVENT_LIST: (page, limit) => `event:list:${page}:${limit}`,
    EVENT_PARTICIPANTS: (id) => `event:participants:${id}`,
    
    // Statistics cache
    STATS_DASHBOARD: 'stats:dashboard',
    STATS_USER: (id) => `stats:user:${id}`,
    STATS_CLASS: (id) => `stats:class:${id}`,
    
    // System cache
    SYSTEM_SETTINGS: 'system:settings',
    SYSTEM_CONFIG: 'system:config'
};

// Cache TTL constants (in seconds)
const CacheTTL = {
    SHORT: 60,           // 1 minute
    MEDIUM: 300,         // 5 minutes
    LONG: 1800,          // 30 minutes
    VERY_LONG: 3600,     // 1 hour
    DAY: 86400           // 24 hours
};

// Create and export cache service instance
const cacheService = new CacheService();

module.exports = {
    cacheService,
    CacheKeys,
    CacheTTL
};