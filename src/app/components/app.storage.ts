import { Storage } from "@ionic/storage";

/** Servicing component for working with key-value storage */
export class AppStorage {

	private static _storage: Storage = undefined;

	/** Initializes the storage */
	public static async initializeAsync(storage: Storage, onNext?: () => void) {
		if (this._storage === undefined && storage !== undefined && storage !== null) {
			this._storage = storage;
			await this._storage.ready();
			if (onNext !== undefined) {
				onNext();
			}
		}
	}

	/** Updates a value into storage by key */
	public static async setAsync(key: string, value: any) {
		await this._storage.set(key, value);
	}

	/** Gets a value from storage by key */
	public static async getAsync(key: string) {
		return await this._storage.get(key);
	}

	/** Removes a value from store by key */
	public static async removeAsync(key: string) {
		await this._storage.remove(key);
	}

}
