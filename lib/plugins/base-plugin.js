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
	/** @type {TelegramCommander} */				commander = undefined

	/** @protected @type {StorageGetter} */			getStorage = undefined
	/** @protected @type {StorageSetter} */			setStorage = undefined
	/** @protected @type {StorageRemover} */		removeStorage = undefined

	/**
	 * @param {object} [opts={}]
	 * @param {StorageConfig} [opts.storage] Storage configuration.
	 */
	constructor(opts = {}) {
		// storage
		if (opts?.storage) {
			this.storageGetter = opts.storage.get
			this.storageSetter = opts.storage.set
			this.storageRemover = opts.storage.remove
		} else {
			const inMemoryStorage = new Map()
			this.getStorage = async name => inMemoryStorage.get(name)
			this.setStorage = async (name, val) => inMemoryStorage.set(name, val)
			this.removeStorage = async name => inMemoryStorage.delete(name)
		}
	}

	init(commander) {
		this.commander = commander
	}
}