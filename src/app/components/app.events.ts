import * as Rx from "rxjs";
import { AppUtility } from "./app.utility";

/** Servicing component for working with app events */
export class AppEvents {

	private static _handlers = {};
	private static _subject: Rx.Subject<{ event: string, args: any }> = undefined;

	private static initialize() {
		if (this._subject === undefined) {
			this._subject = new Rx.Subject<{ event: string, args: any }>();
			this._subject.subscribe(({ event, args }) => {
				if (this._handlers[event]) {
					for (const handler of this._handlers[event]) {
						handler.func({ "event": event, "args": args });
					}
				}
			});
		}
	}

	/**
	  * Registers a handler for processing data when a specified event has been raised/broadcasted
	  * @param event The string that presents the name of an event
	  * @param handler The function to handler data when an event was raised
	  * @param identity The string that presents identity of the handler for unregistering later
	*/
	public static on(event: string, handler: (info: any) => void, identity?: string) {
		this.initialize();
		if (AppUtility.isNotEmpty(event) && handler !== undefined) {
			this._handlers[event] = this._handlers[event] || [];
			this._handlers[event].push({ func: handler, identity: AppUtility.isNotEmpty(identity) ? identity : "" });
		}
	}

	/**
	  * Unregisters a handler
	  * @param event The string that presents the name of an event
	  * @param identity The string that presents the identity of the handler for unregistering
	*/
	public static off(event: string, identity: string) {
		this.initialize();
		if (AppUtility.isNotEmpty(event) && AppUtility.isNotEmpty(identity) && this._handlers[event]) {
			const index = AppUtility.find<any>(this._handlers[event], handler => identity === handler.identity);
			if (index !== -1) {
				this._handlers[event].splice(index, 1);
			}
		}
	}

	/**
	  * Broadcasts an event message through the app scope
	  * @param event The string that presents the name of an event
	  * @param args The JSON object that presents the arguments of an event
	*/
	public static broadcast(event: string, args?: any) {
		this.initialize();
		this._subject.next({ event, args });
	}

}
