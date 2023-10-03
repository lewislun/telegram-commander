/**
 * @typedef {import('../telegram-commander.js').default} TelegramCommander
 *
 * @typedef {(key: string) => Promise<object|undefined>} StorageGetter Get a (stringified) object by key from persistent storage. Returns undefined if not found.
 * @typedef {(key: string, val: object) => Promise<void>} StorageSetter Set a stringifiable object to persistent storage.
 * @typedef {(key: string) => Promise<void>} StorageRemover Remove a value by key from persistent storage.
 *
 * @typedef {object} StorageConfig
 * @property {StorageGetter} get Get a (stringified) object by key from persistent storage. Returns undefined if not found.
 * @property {StorageSetter} set Set a stringifiable object to persistent storage.
 * @property {StorageRemover} remove Remove a value by key from persistent storage.
 */
export default class TelegramCommanderPlugin {
    /**
     * @param {object} [opts={}]
     * @param {StorageConfig} [opts.storage] Storage configuration.
     */
    constructor(opts?: {
        storage?: StorageConfig;
    });
    /** @type {TelegramCommander} */ commander: TelegramCommander;
    /** @protected @type {StorageGetter} */ protected getStorage: StorageGetter;
    /** @protected @type {StorageSetter} */ protected setStorage: StorageSetter;
    /** @protected @type {StorageRemover} */ protected removeStorage: StorageRemover;
    storageGetter: StorageGetter;
    storageSetter: StorageSetter;
    storageRemover: StorageRemover;
    init(commander: any): void;
}
export type TelegramCommander = import('../telegram-commander.js').default;
/**
 * Get a (stringified) object by key from persistent storage. Returns undefined if not found.
 */
export type StorageGetter = (key: string) => Promise<object | undefined>;
/**
 * Set a stringifiable object to persistent storage.
 */
export type StorageSetter = (key: string, val: object) => Promise<void>;
/**
 * Remove a value by key from persistent storage.
 */
export type StorageRemover = (key: string) => Promise<void>;
export type StorageConfig = {
    /**
     * Get a (stringified) object by key from persistent storage. Returns undefined if not found.
     */
    get: StorageGetter;
    /**
     * Set a stringifiable object to persistent storage.
     */
    set: StorageSetter;
    /**
     * Remove a value by key from persistent storage.
     */
    remove: StorageRemover;
};
