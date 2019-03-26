import { Subject } from "rxjs";
import { AppConfig } from "../app.config";
import { AppAPI } from "./app.api";
import { AppUtility } from "./app.utility";
import { PlatformUtility } from "./app.utility.platform";

/** Servicing component for working with real-time update (RTU) */
export class AppRTU {

	private static _status = "initializing";
	private static _uri: string = undefined;
	private static _websocket: WebSocket = undefined;
	private static _types: {
		[key: string]: { Service: string, Object: string, Event: string }
	} = {};
	private static _serviceScopeHandlers: {
		[key: string]: Array<{ func: (message: { Type: { Service: string, Object: string, Event: string }, Data: any }) => void, identity: string }>
	} = {};
	private static _objectScopeHandlers: {
		[key: string]: Array<{ func: (message: { Type: { Service: string, Object: string, Event: string }, Data: any }) => void, identity: string }>
	} = {};
	private static _serviceScopeSubject: Subject<{
		service: string,
		message: {
			Type: {
				Service: string,
				Object: string,
				Event: string
			},
			Data: any
		}
	}>;
	private static _objectScopeSubject: Subject<{
		service: string,
		object: string,
		message: {
			Type: {
				Service: string,
				Object: string,
				Event: string
			},
			Data: any
		}
	}>;

	private static _onOpen: (event: Event) => void = undefined;

	/** Sets the action to fire when the RTU is opened */
	private static set OnOpen(func: (event: Event) => void) {
		this._onOpen = func;
	}

	private static _onClose: (event: CloseEvent) => void = undefined;

	/** Sets the action to fire when the RTU is closed */
	private static set OnClose(func: (event: CloseEvent) => void) {
		this._onClose = func;
	}

	private static _onError: (event: Event) => void = undefined;

	/** Sets the action to fire when the RTU got any error */
	private static set OnError(func: (event: Event) => void) {
		this._onError = func;
	}

	private static _onMessage: (event: MessageEvent) => void = undefined;

	/** Sets the action to fire when the RTU got any error */
	private static set OnMessage(func: (event: MessageEvent) => void) {
		this._onMessage = func;
	}

	private static getServiceHandlers(service: string) {
		this._serviceScopeHandlers[service] = this._serviceScopeHandlers[service] || [];
		return this._serviceScopeHandlers[service];
	}

	private static getObjectHandlers(service: string, object: string) {
		const type = service + "#" + (object || "");
		this._objectScopeHandlers[type] = this._objectScopeHandlers[type] || [];
		return this._objectScopeHandlers[type];
	}

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
	public static registerAsServiceScopeProcessor(service: string, handler: (message: { Type: { Service: string, Object: string, Event: string }, Data: any }) => void, identity?: string) {
		if (AppUtility.isNotEmpty(service) && handler !== undefined) {
			this.getServiceHandlers(service).push({
				func: handler,
				identity: AppUtility.isNotEmpty(identity) ? identity : ""
			});
		}
	}

	/**
	  * Registers a handler for processing RTU messages at scope of a service
	  * @param service The string that presents name of a service
	  * @param object The string that presents name of an object in the service
	  * @param handler The function for processing when got a message from APIs
	  * @param identity The string that presents identity of the handler for unregistering later
	*/
	public static registerAsObjectScopeProcessor(service: string, object: string, handler: (message: { Type: { Service: string, Object: string, Event: string }, Data: any }) => void, identity?: string) {
		if (AppUtility.isNotEmpty(service) && handler !== undefined) {
			this.getObjectHandlers(service, object).push({
				func: handler,
				identity: AppUtility.isNotEmpty(identity) ? identity : ""
			});
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
			let handlers = this.getServiceHandlers(service);
			let index = handlers.findIndex(handler => identity === handler.identity);
			while (index > -1) {
				AppUtility.removeAt(handlers, index);
				index = handlers.findIndex(handler => identity === handler.identity);
			}
			handlers = this.getObjectHandlers(service, object);
			index = handlers.findIndex(handler => identity === handler.identity);
			while (index > -1) {
				AppUtility.removeAt(handlers, index);
				index = handlers.findIndex(handler => identity === handler.identity);
			}
		}
	}

	/** Parses the message */
	public static parse(type: string) {
		let info = this._types[type];
		if (info === undefined) {
			let pos = AppUtility.indexOf(type, "#"), object = "", event = "";
			const service = pos > 0 ? type.substring(0, pos) : type;
			if (pos > 0) {
				object = type.substring(pos + 1);
				pos = AppUtility.indexOf(object, "#");
				if (pos > 0) {
					event = object.substring(pos + 1);
					object = object.substring(0, pos);
				}
			}
			info = {
				Service: service,
				Object:  object,
				Event: event
			};
			this._types[type] = info;
		}
		return info;
	}

	/** Starts the real-time updater */
	public static start(onStarted?: () => void, isRestart?: boolean) {
		// check
		if (typeof WebSocket === "undefined") {
			console.warn("[RTU]: Your browser is outdated, its requires a modern browser that supports WebSocket (like Chrome, Safari, Firefox, Microsoft Edge/IE 10/11, ...)");
			PlatformUtility.invoke(onStarted, this.isReady ? 13 : 567);
			return;
		}
		else if (this._websocket !== undefined) {
			PlatformUtility.invoke(onStarted, this.isReady ? 13 : 567);
			return;
		}

		// initialize object for registering handlers
		if (this._serviceScopeSubject === undefined) {
			this._serviceScopeSubject = new Subject<{
				service: string,
				message: {
					Type: {
						Service: string,
						Object: string,
						Event: string
					},
					Data: any
				}
			}>();
			this._serviceScopeSubject.subscribe(
				({ service, message }) => {
					const handlers = this.getServiceHandlers(service);
					if (handlers.length > 0) {
						handlers.forEach(handler => handler.func(message));
					}
					else if (AppConfig.isDebug) {
						console.warn(`[RTU]: No suitable service scope handler is found (${service})`);
					}
				},
				error => console.warn("[RTU]: Got an error", AppConfig.isNativeApp ? JSON.stringify(error) : error)
			);
		}

		if (this._objectScopeSubject === undefined) {
			this._objectScopeSubject = new Subject<{
				service: string,
				object: string,
				message: {
					Type: {
						Service: string,
						Object: string,
						Event: string
					},
					Data: any
				}
			}>();
			this._objectScopeSubject.subscribe(
				({ service, object, message }) => {
					const handlers = this.getObjectHandlers(service, object);
					if (handlers.length > 0) {
						handlers.forEach(handler => handler.func(message));
					}
					else if (AppConfig.isDebug) {
						console.warn(`[RTU]: No suitable object scope handler is found (${service}#${object})`);
					}
				},
				error => console.error("[RTU]: Got an error => " + AppUtility.getErrorMessage(error), error)
			);
		}

		// create WebSocket
		this._status = "initializing";
		this._uri = (AppUtility.isNotEmpty(AppConfig.URIs.updates) ? AppConfig.URIs.updates : AppConfig.URIs.apis).replace("http://", "ws://").replace("https://", "wss://") + "u?x-request=" + AppUtility.toBase64Url(AppConfig.getAuthenticatedHeaders());
		this._websocket = new WebSocket(this._uri + (AppUtility.isTrue(isRestart) ? "&x-restart=" : ""));

		// assign event handlers
		this._websocket.onopen = event => {
			this._status = "ready";
			console.log(`[RTU]: Opened... (${PlatformUtility.parseURI(this._uri).HostURI})`);
			if (this._onOpen !== undefined) {
				try {
					this._onOpen(event);
				}
				catch (e) {
					console.error("[RTU]: Error occurred while running the 'on-open' handler", e);
				}
			}
		};

		this._websocket.onclose = event => {
			this._status = "close";
			console.log(`[RTU]: Closed [${event.type} => ${event.reason}]`);
			if (this._onClose !== undefined) {
				try {
					this._onClose(event);
				}
				catch (e) {
					console.error("[RTU]: Error occurred while running the 'on-close' handler", e);
				}
			}
			if (AppUtility.isNotEmpty(this._uri) && 1007 !== event.code) {
				this.restart();
			}
		};

		this._websocket.onerror = event => {
			this._status = "error";
			console.warn("[RTU]: Got an error...", AppConfig.isDebug ? event : "");
			if (this._onError !== undefined) {
				try {
					this._onError(event);
				}
				catch (e) {
					console.error("[RTU]: Error occurred while running the 'on-error' handler", e);
				}
			}
		};

		this._websocket.onmessage = event => {
			if (this._onMessage !== undefined) {
				try {
					this._onMessage(event);
				}
				catch (e) {
					console.error("[RTU]: Error occurred while running the 'on-message' handler", e);
				}
			}

			const json = JSON.parse(event.data || "{}");

			if ("Error" === json.Type) {
				if (AppUtility.isGotSecurityException(json.Data)) {
					console.warn(`[RTU]: Got a security issue: ${json.Data.Message} (${json.Data.Code})`, AppConfig.isDebug ? json.Data : "");
					this.stop();
				}
				else if (AppUtility.isObject(json.Data, true) && "InvalidRequestException" === json.Data.Type) {
					console.warn(`[RTU]: Got an invalid requesting data: ${json.Data.Message} (${json.Data.Code})`, AppConfig.isDebug ? json.Data : "");
					this.stop();
				}
				else {
					console.warn(`[RTU]: Got an error: ${json.Data.Message} (${json.Data.Code})`, AppConfig.isDebug ? json.Data : "");
				}
			}

			else {
				const message = {
					Type: this.parse(json.Type),
					Data: json.Data || {}
				};

				if (AppConfig.isDebug) {
					console.log("[RTU]: Got a message", AppConfig.isNativeApp ? JSON.stringify(message) : message);
				}

				if (message.Type.Service === "Pong") {
					if (AppConfig.isDebug) {
						console.log("[RTU]: Got a heartbeat");
					}
					this.send({
						ServiceName: "rtu",
						ObjectName: "session",
						Verb: "PING",
						Query: undefined,
						Header: undefined,
						Body: undefined,
						Extra: undefined
					});
				}

				else if (message.Type.Service === "Knock") {
					if (AppConfig.isDebug) {
						console.log(`[RTU]: Knock, Knock, Knock ... => Yes, I'm right here (${new Date().toJSON()})`);
					}
				}

				else if (message.Type.Service === "OnlineStatus") {
					if (AppConfig.isDebug) {
						console.log("[RTU]: Got a flag to update status & run scheduler");
					}
					this.send({
						ServiceName: "users",
						ObjectName: "status",
						Verb: "GET",
						Query: undefined,
						Header: undefined,
						Body: undefined,
						Extra: undefined
					});
					if (this._serviceScopeHandlers["Scheduler"]) {
						this._serviceScopeSubject.next({ "service": "Scheduler", "message": message });
					}
				}

				else if (AppConfig.session.device === json.ExcludedDeviceID) {
					if (AppConfig.isDebug) {
						console.warn("[RTU]: The device is excluded", AppConfig.session.device);
					}
				}

				else {
					this._serviceScopeSubject.next({ "service": message.Type.Service, "message": message });
					this._objectScopeSubject.next({ "service": message.Type.Service, "object": message.Type.Object, "message": message });
				}
			}
		};

		// callback when done
		PlatformUtility.invoke(onStarted, this.isReady ? 13 : 567);
	}

	/** Restarts the real-time updater */
	public static restart(reason?: string, defer?: number) {
		this._status = "restarting";
		console.warn(`[RTU]: ${reason || "Re-start because the WebSocket connection is broken"}`);
		PlatformUtility.invoke(() => {
			console.log("[RTU]: Re-starting...");
			if (this._websocket !== undefined) {
				this._websocket.close();
				this._websocket = undefined;
			}
			this.start(() => console.log("[RTU]: Re-started..."), true);
		}, defer || 123);
	}

	/** Stops the real-time updater */
	public static stop(onStoped?: () => void) {
		this._uri = undefined;
		this._status = "closed";
		if (this._websocket !== undefined) {
			this._websocket.close();
			this._websocket = undefined;
		}
		if (onStoped !== undefined) {
			onStoped();
		}
	}

	/** Sends a request to a service */
	public static send(request: { ServiceName: string, ObjectName: string, Verb: string, Query: { [key: string]: any }, Header: any, Body: any, Extra: any }, whenNotReady?: (data?: any) => void) {
		if (this.isReady) {
			if (request.Body !== undefined && typeof request.Body === "object") {
				request.Body = JSON.stringify(request.Body);
			}
			this._websocket.send(JSON.stringify(request));
		}
		else {
			let path = `${request.ServiceName.toLowerCase()}/${request.ObjectName.toLowerCase()}`;
			let query = AppConfig.getRelatedQuery();
			if (AppUtility.isObject(request.Query, true)) {
				if (request.Query["object-identity"]) {
					path += "/" + request.Query["object-identity"];
					delete request.Query["object-identity"];
				}
				query += "&" + AppUtility.getQueryOfJson(request.Query);
			}
			if (AppUtility.isObject(request.Extra, true)) {
				query += "&extras=" + AppUtility.toBase64Url(request.Extra);
			}
			AppAPI.send(request.Verb, AppConfig.URIs.apis + path + "?" + query, request.Header, request.Body)
				.toPromise()
				.then(response => {
					if (whenNotReady !== undefined) {
						whenNotReady(response.json());
					}
				})
				.catch(error => console.error("[RTU]: Error occurred while sending request => " + AppUtility.getErrorMessage(error), error));
		}
	}

}
