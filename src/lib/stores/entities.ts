import { writable, readable } from 'svelte/store';
import type { StaticViewerEntityModel, DynamicEntityModel } from '$lib/interfaces';

export type EntityModel = StaticViewerEntityModel & DynamicEntityModel & { id: string };

// Internal map for efficient lookups - this is the source of truth
const entitiesMap = new Map<string, EntityModel>();

// Version counter to trigger reactive updates only when needed
let version = 0;
const { subscribe: subscribeVersion, set: setVersion } = writable(0);

// Throttle notifications to reduce re-renders
let notifyScheduled = false;
function scheduleNotify() {
    if (!notifyScheduled) {
        notifyScheduled = true;
        queueMicrotask(() => {
            notifyScheduled = false;
            version++;
            setVersion(version);
        });
    }
}

// Create the entities store
function createEntitiesStore() {
    return {
        subscribe: subscribeVersion,

        /**
         * Set or update a single entity (no notification - use for bulk updates)
         */
        setEntitySilent: (id: string, entity: EntityModel) => {
            entitiesMap.set(id, entity);
        },

        /**
         * Set or update a single entity with notification
         */
        setEntity: (id: string, entity: EntityModel) => {
            entitiesMap.set(id, entity);
            scheduleNotify();
        },

        /**
         * Update multiple entities at once (batch update) - single notification
         */
        setEntities: (entities: Map<string, EntityModel>) => {
            entities.forEach((entity, id) => {
                entitiesMap.set(id, entity);
            });
            if (entities.size > 0) {
                scheduleNotify();
            }
        },

        /**
         * Update specific properties of an entity
         */
        updateEntity: (id: string, updates: Partial<EntityModel>) => {
            const existing = entitiesMap.get(id);
            if (existing) {
                entitiesMap.set(id, { ...existing, ...updates });
                scheduleNotify();
            }
        },

        /**
         * Remove an entity by id
         */
        removeEntity: (id: string) => {
            if (entitiesMap.delete(id)) {
                scheduleNotify();
            }
        },

        /**
         * Get an entity by id (synchronous access)
         */
        getEntity: (id: string): EntityModel | undefined => {
            return entitiesMap.get(id);
        },

        /**
         * Check if an entity exists
         */
        hasEntity: (id: string): boolean => {
            return entitiesMap.has(id);
        },

        /**
         * Get the internal map reference (for direct access in handlers)
         */
        getMap: (): Map<string, EntityModel> => {
            return entitiesMap;
        },

        /**
         * Get current entity count
         */
        getCount: (): number => {
            return entitiesMap.size;
        },

        /**
         * Get entities as array (call only when needed, not in reactive statements)
         */
        getArray: (): EntityModel[] => {
            return Array.from(entitiesMap.values());
        },

        /**
         * Trigger a notification to subscribers (use after batch silent updates)
         */
        notify: () => {
            scheduleNotify();
        },

        /**
         * Clear all entities
         */
        clear: () => {
            entitiesMap.clear();
            scheduleNotify();
        },

        /**
         * Reset store to initial state
         */
        reset: () => {
            entitiesMap.clear();
            version = 0;
            setVersion(0);
        }
    };
}

export const entitiesStore = createEntitiesStore();

// Lightweight count store - only updates when version changes
export const entityCount = readable(0, (set) => {
    return subscribeVersion(() => {
        set(entitiesMap.size);
    });
});

