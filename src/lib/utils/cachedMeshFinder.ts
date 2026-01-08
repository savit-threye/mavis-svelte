/**
 * Performance-optimized mesh finder with result caching
 */

import { meshFinder as originalMeshFinder } from './meshFinder';

// Cache for mesh finder results to avoid repeated expensive lookups
const meshFinderCache = new Map<string, any>();

/**
 * Cached version of meshFinder that stores results to avoid repeated computation
 * @param inputType - The type of the mesh to search for
 * @param name - The name of the mesh to search for
 * @returns The best matching mesh or null if no match is found
 */
export const cachedMeshFinder = (inputType: string, name: string) => {
    // Create a cache key from the inputs
    const cacheKey = `${inputType}|${name}`;

    // Check if we already have this result cached
    if (meshFinderCache.has(cacheKey)) {
        return meshFinderCache.get(cacheKey);
    }

    // Compute the result using the original function
    const result = originalMeshFinder(inputType, name);

    // Cache the result for future use
    meshFinderCache.set(cacheKey, result);

    return result;
};

/**
 * Clear the mesh finder cache (useful for memory management)
 */
export const clearMeshFinderCache = () => {
    meshFinderCache.clear();
};

/**
 * Get cache statistics for monitoring
 */
export const getMeshFinderCacheStats = () => {
    return {
        size: meshFinderCache.size,
        keys: Array.from(meshFinderCache.keys())
    };
};
