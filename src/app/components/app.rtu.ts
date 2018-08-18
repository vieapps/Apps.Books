import * as Rx from "rxjs";
import { map } from "rxjs/operators";
import { AppConfig } from "../app.config";
import { AppAPI } from "./app.api";
import { AppUtility } from "./app.utility";
import { PlatformUtility } from "./app.utility.platform";

/** Servicing component for working with real-time update (RTU) */
export class AppRTU {

	private static _status = "initializing";
	private static _uri: string = undefined;
	private static _websocket: WebSocket = undefined;

	private static _serviceScopeHandlers: any = {};
	private static _objectScopeHandlers: any = {};

	private static _serviceScopeSubject: Rx.Subject<{ service: string, message: any }> = undefined;
	private static _objectScopeSubject: Rx.Subject<{ service: string, object: string, message: any }> = undefined;

	/** Gets the state that determines weather WebSocket is ready for work */
	public static get isReady() {
		return this._websocket !== undefined && this._status === "ready";
	}

	/**
	  * Registers a handler for processing RTU messages at scope of a service
	  * @param service The string that presents name of a service
	  * @param handler The function for processing when got a message from APIs
	  * @param identity The string that presents identity of the handler for unregistering later
	*/
	public static registerAsServiceScopeProcessor(service: string, handler: (message: any) => void, identity?: string) {
		if (AppUtility.isNotEmpty(service) && handler !== undefined) {
			this._serviceScopeHandlers[service] = this._serviceScopeHandlers[service] || [];
			this._serviceScopeHandlers[service].push({ func: handler, identity: AppUtility.isNotEmpty(identity) ? identity : "" });
		}
	}

	/**
	  * Registers a handler for processing RTU messages at scope of a service
	  * @param service The string that presents name of a service
	  * @param object The string that presents name of an object in the service
	  * @param handler The function for processing when got a message from APIs
	  * @param identity The string that presents identity of the handler for unregistering later
	*/
	public static registerAsObjectScopeProcessor(service: string, object: string, handler: (message: any) => void, identity?: string) {
		if (AppUtility.isNotEmpty(service) && handler !== undefined) {
			const type = service + "#" + (object || "");
			this._serviceScopeHandlers[type] = this._serviceScopeHandlers[type] || [];
			this._serviceScopeHandlers[type].push({ func: handler, identity: AppUtility.isNotEmpty(identity) ? identity : "" });
		}
	}

	/**
	  * Unregisters a handler
	  * @param identity The string that presents identity of the handler for unregistering
	  * @param service The string that presents type of a message
	  * @param object The string that presents name of an object in the service
	*/
	public static unregister(identity: string, service: string, object?: string) {
		if (AppUtility.isNotEmpty(identity) && AppUtility.isNotEmpty(service)) {
			if (this._serviceScopeHandlers[service]) {
				const index = AppUtility.find<any>(this._serviceScopeHandlers[service], handler => identity === handler.identity);
				if (index !== -1) {
					this._serviceScopeHandlers[service].splice(index, 1);
				}
			}
			if (AppUtility.isNotEmpty(object)) {
				const type = service + "#" + object;
				if (this._serviceScopeHandlers[type]) {
					const index = AppUtility.find<any>(this._objectScopeHandlers[type], handler => identity === handler.identity);
					if (index !== -1) {
						this._objectScopeHandlers[type].splice(index, 1);
					}
				}
			}
		}
	}

	/** Parses the message */
	public static parse(type: string): { Service: string, Object: string, Event: string } {
		let pos = AppUtility.indexOf(type, "#");
		const service = pos > 0 ? type.substring(0, pos) : type;
		let object = "", event = "";
		if (pos > 0) {
			object = type.substring(pos + 1);
			pos = AppUtility.indexOf(object, "#");
			if (pos > 0) {
				event = object.substring(pos + 1);
				object = object.substring(0, pos);
			}
		}
		return {
			Service: service,
			Object:  object,
			Event: event
		};
	}

	/** Starts the real-time updater */
	public static start(onCompleted?: () => void, isRestart?: boolean) {
		// check
		if (typeof WebSocket === "undefined") {
			console.warn("[RTU]: Your browser is outdated, its requires a modern browser that supports WebSocket (like Chrome, Safari, Firefox, Microsoft Edge/IE 10/11, ...)");
			if (onCompleted !== undefined) {
				PlatformUtility.setTimeout(() => {
					onCompleted();
				}, this._status === null || this._status === "ready" ? 13 : 567);
			}
			return;
		}
		else if (this._websocket !== undefined) {
			if (onCompleted !== undefined) {
				PlatformUtility.setTimeout(() => {
					onCompleted();
				}, this._status === null || this._status === "ready" ? 13 : 567);
			}
			return;
		}

		// initialize
		this._serviceScopeSubject = new Rx.Subject<{ service: string, message: any }>();
		this._serviceScopeSubject.subscribe(
			({ service, message }) => {
				if (this._serviceScopeHandlers[service]) {
					for (const handler of this._serviceScopeHandlers[service]) {
						handler.func(message);
					}
				}
				else if (AppConfig.isDebug) {
					console.warn("[RTU]: Got a message but no suitable handler is found (service scope)", "<" + service + ">", message);
				}
			},
			error => {
				console.error("[RTU]: Got an error", error);
			}
		);

		this._objectScopeSubject = new Rx.Subject<{ service: string, object: string, message: any }>();
		this._objectScopeSubject.subscribe(
			({ service, object, message }) => {
				const type = service + "#" + object;
				if (this._serviceScopeHandlers[type]) {
					for (const handler of this._serviceScopeHandlers[type]) {
						handler.func(message);
					}
				}
				else if (AppConfig.isDebug) {
					console.warn("[RTU]: Got a message but no suitable handler is found (object scope)", "<" + type + ">", message);
				}
			},
			error => {
				console.error("[RTU]: Got an error", error);
			}
		);

		// create WebSocket
		this._status = "initializing";
		this._uri = AppConfig.URIs.apis.replace("http://", "ws://").replace("https://", "wss://") + "rtu?x-request=" + AppUtility.toBase64Url(AppAPI.getAuthHeaders());
		this._websocket = new WebSocket(this._uri + (AppUtility.isTrue(isRestart) ? "&x-restart=" : ""));

		// assign event handlers
		this._websocket.onopen = event => {
			this._status = "ready";
			console.log("[RTU]: Opened...");
		};

		this._websocket.onclose = event => {
			this._status = "close";
			console.log(`[RTU]: Closed [${event.type} => ${event.reason}]`);
			if (AppUtility.isNotEmpty(this._uri) && 1007 !== event.code) {
				this.restart();
			}
		};

		this._websocket.onerror = event => {
			this._status = "error";
			console.warn("[RTU]: Got an error...", AppConfig.isDebug ? event : "");
		};

		this._websocket.onmessage = event => {
			const message = JSON.parse(event.data);

			if (AppUtility.isNotEmpty(message.Type) && message.Type === "Error") {
				if (AppUtility.isGotSecurityException(message.Data)) {
					console.warn(`[RTU]: Got a security issue: ${message.Data.Message} (${message.Data.Code})`, AppConfig.isDebug ? message.Data : "");
					stop();
				}
				else if (message.Data && message.Data.Type === "InvalidRequestException") {
					console.warn(`[RTU]: Got an invalid requesting data: ${message.Data.Message} (${message.Data.Code})`, AppConfig.isDebug ? message.Data : "");
					stop();
				}
				else {
					console.warn(`[RTU]: Got an error: ${message.Data.Message} (${message.Data.Code})`, AppConfig.isDebug ? message.Data : "");
				}
			}

			else {
				const info = this.parse(message.Type);
				if (AppConfig.isDebug) {
					console.log("[RTU]: Got a message", message);
				}

				if (info.Service === "Pong") {
					if (AppConfig.isDebug) {
						console.log("[RTU]: Got a heartbeat");
					}
					this.call("rtu", "session", "PING");
				}

				else if (info.Service === "Knock") {
					if (AppConfig.isDebug) {
						console.log(`[RTU]: Knock, Knock, Knock ... => Yes, I'm right here (${new Date().toJSON()})`);
					}
				}

				else if (info.Service === "OnlineStatus") {
					if (AppConfig.isDebug) {
						console.log("[RTU]: Got a flag to update status & run scheduler");
					}
					this.call("users", "status", "GET");
					if (this._serviceScopeHandlers["Scheduler"]) {
						this._serviceScopeSubject.next({ "service": "Scheduler", "message": message });
					}
				}

				else if (AppUtility.isNotEmpty(message.ExcludedDeviceID) && message.ExcludedDeviceID === AppConfig.session.device) {
					if (AppConfig.isDebug) {
						console.warn("[RTU]: The device is excluded", AppConfig.session.device);
					}
				}

				else {
					this._serviceScopeSubject.next({ "service": info.Service, "message": message });
					this._objectScopeSubject.next({ "service": info.Service, "object": info.Object, "message": message });
				}
			}
		};

		// callback when done
		if (onCompleted !== undefined) {
			PlatformUtility.setTimeout(() => {
				onCompleted();
			}, this._status === "ready" && this._status === "ready" ? 13 : 567);
		}
	}

	/** Restarts the real-time updater */
	public static restart(reason?: string, defer?: number) {
		this._status = "restarting";
		console.warn(`[RTU]: ${reason || "Re-start because the WebSocket connection is broken"}`);

		PlatformUtility.setTimeout(() => {
			console.log("[RTU]: Re-starting...");
			if (this._websocket !== undefined) {
				this._websocket.close();
				this._websocket = null;
			}
			this.start(() => console.log("[RTU]: Re-started successful..."), true);
		}, defer || 123);
	}

	/** Stops the real-time updater */
	public static stop(onCompleted?: () => void) {
		this._uri = null;
		this._status = "closed";
		if (this._websocket !== undefined) {
			this._websocket.close();
			this._websocket = null;
		}

		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	/** Sends a request to a service */
	public static send(request: { ServiceName: string, ObjectName: string, Verb: string, Query: any, Header: any, Body: any, Extra: any }, whenNotReady?: (data?: any) => void) {
		if (this.isReady) {
			this._websocket.send(JSON.stringify(request));
		}
		else {
			let path = `${request.ServiceName}/${request.ObjectName}`;
			let query = request.ServiceName !== AppConfig.app.service
				? `related-service=${AppConfig.app.service}&`
				: "";
			query += `language=${AppUtility.getLanguage()}&host=${PlatformUtility.getHost()}`;
			if (AppUtility.isObject(request.Query, true)) {
				if (request.Query["object-identity"]) {
					path += "/" + request.Query["object-identity"];
					delete request.Query["object-identity"];
				}
				query += "&" + AppUtility.getQueryOfJson(request.Query);
			}
			AppAPI.send(request.Verb, AppConfig.URIs.apis + path + "?" + query, request.Header, request.Body)
				.pipe(map(response => response.json()))
				.subscribe(
					data => {
						if (whenNotReady !== undefined) {
							whenNotReady(data);
						}
					},
					error => AppUtility.showError("[RTU]: Error occurred while sending request", error)
				);
		}
	}

}
