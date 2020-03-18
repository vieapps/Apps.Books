import { Subject } from "rxjs";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { AppConfig } from "../app.config";
import { AppCrypto } from "./app.crypto";
import { AppUtility } from "./app.utility";
import { PlatformUtility } from "./app.utility.platform";

/** Presents the struct of a message type */
export interface AppMessageType {
	Service: string;
	Object?: string;
	Event?: string;
}

/** Presents the struct of a message */
export interface AppMessage {
	Type: AppMessageType;
	Data: any;
}

/** Presents the struct of a request */
export interface AppRequestInfo {
	ServiceName: string;
	ObjectName?: string;
	Verb?: string;
	Query?: { [key: string]: string };
	Body?: any;
	Header?: { [key: string]: string };
	Extra?: { [key: string]: string };
}

/** Servicing component for working with the remote APIs via WebSocket */
export class AppRTU {

	private static _status = "initializing";
	private static _uri: string;
	private static _websocket: WebSocket;
	private static _types: { [key: string]: AppMessageType } = {};
	private static _serviceScopeHandlers: { [key: string]: Array<{ func: (message: AppMessage) => void, identity: string }> } = {};
	private static _objectScopeHandlers: { [key: string]: Array<{ func: (message: AppMessage) => void, identity: string }> } = {};
	private static _serviceScopeSubject: Subject<{ service: string, message: AppMessage }>;
	private static _objectScopeSubject: Subject<{ service: string, object: string, message: AppMessage }>;
	private static _requests = {
		counter: 0,
		nocallbackRequests: {} as { [id: string]: string },
		callbackableRequests: {} as { [id: string]: string },
		successCallbacks: {} as { [id: string]: (data?: any) => void },
		errorCallbacks: {} as { [id: string]: (error?: any) => void }
	};
	private static _pingTime = new Date().getTime();
	private static _attempt = 0;

	/** Gets the last time when got PING */
	public static get pingTime() {
		return this._pingTime;
	}

	private static _onOpen: (event: Event) => void;

	/** Sets the action to fire when the RTU is opened */
	public static set onOpen(func: (event: Event) => void) {
		this._onOpen = func;
	}

	private static _onClose: (event: CloseEvent) => void;

	/** Sets the action to fire when the RTU is closed */
	public static set onClose(func: (event: CloseEvent) => void) {
		this._onClose = func;
	}

	private static _onError: (event: Event) => void;

	/** Sets the action to fire when the RTU got any error */
	public static set OnError(func: (event: Event) => void) {
		this._onError = func;
	}

	private static _onMessage: (event: MessageEvent) => void;

	/** Sets the action to fire when the RTU got any error */
	public static set onMessage(func: (event: MessageEvent) => void) {
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
	public static registerAsServiceScopeProcessor(service: string, handler: (message: AppMessage) => void, identity?: string) {
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
	public static registerAsObjectScopeProcessor(service: string, object: string, handler: (message: AppMessage) => void, identity?: string) {
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

	/** Parses the message to get type */
	public static parse(identity: string) {
		let type = this._types[identity];
		if (type === undefined) {
			let pos = AppUtility.indexOf(identity, "#"), object = "", event = "";
			const service = pos > 0 ? identity.substring(0, pos) : identity;
			if (pos > 0) {
				object = identity.substring(pos + 1);
				pos = AppUtility.indexOf(object, "#");
				if (pos > 0) {
					event = object.substring(pos + 1);
					object = object.substring(0, pos);
				}
			}
			type = {
				Service: service,
				Object: object,
				Event: event
			};
			this._types[identity] = type;
		}
		return type;
	}

	/** Starts the real-time updater */
	public static start(onStarted?: () => void, isRestart: boolean = false) {
		// check
		if (typeof WebSocket === "undefined") {
			console.warn("[AppRTU]: Its requires a modern web component that supports WebSocket");
			if (onStarted !== undefined) {
				onStarted();
			}
			return;
		}

		if (this._websocket !== undefined) {
			if (onStarted !== undefined) {
				onStarted();
			}
			return;
		}

		// initialize object for registering handlers
		if (this._serviceScopeSubject === undefined) {
			this._serviceScopeSubject = new Subject<{ service: string, message: AppMessage }>();
			this._serviceScopeSubject.subscribe(
				({ service, message }) => {
					this.getServiceHandlers(service).forEach(handler => {
						try {
							handler.func(message);
						}
						catch (error) {
							console.error("[AppRTU]: Error occurred while running a handler", error);
						}
					});
				},
				error => console.warn("[AppRTU]: Got an error", AppConfig.isNativeApp ? JSON.stringify(error) : error)
			);
		}

		if (this._objectScopeSubject === undefined) {
			this._objectScopeSubject = new Subject<{ service: string, object: string, message: AppMessage }>();
			this._objectScopeSubject.subscribe(
				({ service, object, message }) => {
					this.getObjectHandlers(service, object).forEach(handler => {
						try {
							handler.func(message);
						}
						catch (error) {
							console.error("[AppRTU]: Error occurred while running a handler", error);
						}
					});
				},
				error => console.error(`[AppRTU]: Got an error => ${AppUtility.getErrorMessage(error)}`, error)
			);
		}

		// create new instance of WebSocket
		this._status = "initializing";
		this._uri = (AppUtility.isNotEmpty(AppConfig.URIs.updates) ? AppConfig.URIs.updates : AppConfig.URIs.apis).replace("http://", "ws://").replace("https://", "wss://");
		this._websocket = new WebSocket(`${this._uri}v?x-session-id=${AppCrypto.urlEncode(AppConfig.session.id)}&x-device-id=${AppCrypto.urlEncode(AppConfig.session.device)}` + (isRestart ? "&x-restart=" : ""));
		this._pingTime = new Date().getTime();

		// assign 'on-open' event handler
		this._websocket.onopen = event => {
			this._status = "ready";
			console.log(`[AppRTU]: Opened... (${PlatformUtility.parseURI(this._uri).HostURI})`, AppUtility.toIsoDateTime(new Date(), true));
			if (this._onOpen !== undefined) {
				try {
					this._onOpen(event);
				}
				catch (error) {
					console.error("[AppRTU]: Error occurred while running the 'on-open' handler", error);
				}
			}
			this._websocket.send(JSON.stringify({
				ServiceName: "Session",
				Verb: "AUTH",
				Header: {
					"x-session-id": AppCrypto.aesEncrypt(AppConfig.session.id),
					"x-device-id": AppCrypto.aesEncrypt(AppConfig.session.device)
				},
				Body: AppConfig.getAuthenticatedHeaders()
			}));
			PlatformUtility.invoke(() => {
				if (this.isReady) {
					this.sendRequests(true);
				}
			}, 345);
		};

		// assign 'on-close' event handler
		this._websocket.onclose = event => {
			this._status = "close";
			console.log(`[AppRTU]: Closed [${event.reason}]`, AppUtility.toIsoDateTime(new Date(), true));
			if (this._onClose !== undefined) {
				try {
					this._onClose(event);
				}
				catch (error) {
					console.error("[AppRTU]: Error occurred while running the 'on-close' handler", error);
				}
			}
			if (AppUtility.isNotEmpty(this._uri) && 1007 !== event.code) {
				this.restart();
			}
		};

		// assign 'on-error' event handler
		this._websocket.onerror = event => {
			this._status = "error";
			console.warn("[AppRTU]: Got an error...", AppConfig.isDebug ? event : "");
			if (this._onError !== undefined) {
				try {
					this._onError(event);
				}
				catch (error) {
					console.error("[AppRTU]: Error occurred while running the 'on-error' handler", error);
				}
			}
		};

		// assign 'on-message' event handler
		this._websocket.onmessage = event => {
			// run the dedicated handler first
			if (this._onMessage !== undefined) {
				try {
					this._onMessage(event);
				}
				catch (error) {
					console.error("[AppRTU]: Error occurred while running the 'on-message' handler", error);
				}
			}

			// prepare
			const json = JSON.parse(event.data || "{}");
			const successCallback = AppUtility.isNotEmpty(json.ID) ? this._requests.successCallbacks[json.ID] : undefined;
			const errorCallback = AppUtility.isNotEmpty(json.ID) ? this._requests.errorCallbacks[json.ID] : undefined;

			// got a callback
			if (successCallback !== undefined || errorCallback !== undefined) {
				try {
					if ("Error" === json.Type) {
						if (AppUtility.isGotSecurityException(json.Data)) {
							console.warn(`[AppRTU]: Got a security issue: ${json.Data.Message} (${json.Data.Code})`, AppConfig.isDebug ? json.Data : "");
							this.restartOnSecurityError(json.Data);
						}
						if (errorCallback !== undefined) {
							errorCallback(json);
						}
						else {
							console.error("[AppRTU]: Got an error while processing", json);
						}
					}
					else if (successCallback !== undefined) {
						successCallback(json.Data || {});
					}
				}
				catch (error) {
					console.error("[AppRTU]: Error occurred while running the callback handler", error, json);
				}
			}

			// got an error
			else if ("Error" === json.Type) {
				if (AppUtility.isGotSecurityException(json.Data)) {
					console.warn(`[AppRTU]: Got a security issue: ${json.Data.Message} (${json.Data.Code})`, AppConfig.isDebug ? json.Data : "");
					this.restartOnSecurityError(json.Data);
				}
				else {
					console.warn(`[AppRTU]: ${("InvalidRequestException" === json.Data.Type ? "Got an invalid requesting data" : "Got an error")}: ${json.Data.Message} (${json.Data.Code})`, AppConfig.isDebug ? json.Data : "");
				}
			}

			// got a message
			else {
				// prepare
				const message: AppMessage = {
					Type: this.parse(json.Type),
					Data: json.Data || {}
				};

				if (AppConfig.isDebug) {
					console.log("[AppRTU]: Got a message", AppConfig.isNativeApp ? JSON.stringify(message) : message);
				}

				// send PONG
				if (message.Type.Service === "Ping") {
					if (AppConfig.isDebug) {
						console.log("[AppRTU]: Got a heartbeat signal => response with PONG", AppUtility.toIsoDateTime(new Date(), true));
					}
					this._pingTime = new Date().getTime();
					this.send({
						ServiceName: "Session",
						Verb: "PONG"
					});
				}

				// run schedulers
				else if (message.Type.Service === "Scheduler") {
					if (AppConfig.isDebug) {
						console.log("[AppRTU]: Got a signal to run scheduler", AppUtility.toIsoDateTime(new Date(), true));
					}
					this.broadcast({ Type: { Service: "Scheduler" }, Data: message.Data });
				}

				// response to knocking message when re-start
				else if (message.Type.Service === "Knock") {
					if (AppConfig.isDebug) {
						console.log("[AppRTU]: Knock, Knock, Knock ... => Yes, I'm right here", AppUtility.toIsoDateTime(new Date(), true));
					}
				}

				// broadcast the messags to all subscribers
				else {
					this.broadcast(message);
				}
			}

			if (AppUtility.isNotEmpty(json.ID)) {
				delete this._requests.callbackableRequests[json.ID];
				delete this._requests.successCallbacks[json.ID];
				delete this._requests.errorCallbacks[json.ID];
			}
		};

		// callback when done
		PlatformUtility.invoke(onStarted, this.isReady ? 13 : 567);
	}

	private static close() {
		if (this._websocket !== undefined) {
			this._websocket.close();
			this._websocket = undefined;
		}
	}

	/** Stops the real-time updater */
	public static stop(onStopped?: () => void) {
		this._uri = undefined;
		this._status = "close";
		this.close();
		if (onStopped !== undefined) {
			onStopped();
		}
	}

	/** Restarts the real-time updater */
	public static restart(reason?: string, defer?: number) {
		if (this._status !== "restarting") {
			this.close();
			this._status = "restarting";
			this._attempt++;
			console.warn(`[AppRTU]: ${reason || "Re-start because the WebSocket connection is broken"}`);
			PlatformUtility.invoke(() => {
				console.log(`[AppRTU]: Re-starting... #${this._attempt}`);
				this.start(() => {
					if (this.isReady) {
						console.log(`[AppRTU]: Re-started... #${this._attempt}`);
						PlatformUtility.invoke(() => this._attempt = 0, 123);
					}
				}, true);
			}, defer || 123 + (this._attempt * 13));
		}
	}

	/** Restarts the real-time updater when got an error */
	public static restartOnSecurityError(error?: any) {
		if ("TokenExpiredException" === error.Type) {
			this.restart("Re-start because the JWT is expired");
		}
		else {
			this.broadcast({
				Type: {
					Service: "Users",
					Object: "Session",
					Event: "Revoke"
				},
				Data: error
			});
		}
	}

	/** Broadcasts a message to all subscribers */
	public static broadcast(message: AppMessage) {
		this._serviceScopeSubject.next({ "service": message.Type.Service, "message": message });
		if (AppUtility.isNotEmpty(message.Type.Object)) {
			this._objectScopeSubject.next({ "service": message.Type.Service, "object": message.Type.Object, "message": message });
		}
	}

	/**
	 * Sends a request to perform an action of a specified service
	 * @param requestInfo The request to send to remote APIs
	 * @param onSuccess The callback function to handle the returning data
	 * @param onError The callback function to handle the returning error
	*/
	public static send(requestInfo: AppRequestInfo, onSuccess?: (data?: any) => void, onError?: (error?: any) => void) {
		const id = `cmd-${this._requests.counter}`;
		const request = JSON.stringify({
			ID: id,
			ServiceName: requestInfo.ServiceName,
			ObjectName: requestInfo.ObjectName || "",
			Verb: requestInfo.Verb || "GET",
			Query: requestInfo.Query || {},
			Body: requestInfo.Body || {},
			Header: requestInfo.Header || {},
			Extra: requestInfo.Extra || {}
		});
		this._requests.counter++;
		if (onSuccess !== undefined || onError !== undefined) {
			this._requests.callbackableRequests[id] = request;
			this._requests.successCallbacks[id] = onSuccess;
			this._requests.errorCallbacks[id] = onError;
		}
		if (this.isReady) {
			this.sendRequests(false, request);
		}
		else if (onSuccess === undefined && onError === undefined) {
			this._requests.nocallbackRequests[id] = request;
		}
	}

	private static sendRequests(sendCallbackables: boolean, additionalRequest?: string) {
		Object.keys(this._requests.nocallbackRequests).sort().forEach(id => this._websocket.send(this._requests.nocallbackRequests[id]));
		this._requests.nocallbackRequests = {};

		if (sendCallbackables) {
			Object.keys(this._requests.callbackableRequests).sort().forEach(id => this._websocket.send(this._requests.callbackableRequests[id]));
		}

		if (AppUtility.isNotEmpty(additionalRequest)) {
			this._websocket.send(additionalRequest);
		}
	}

}

/** Servicing component for working with remote APIs via XMLHttpRequest (XHR) */
export class AppXHR {

	private static _http: HttpClient;

	/** Gets the HttpClient instance */
	public static get http() {
		return this._http;
	}

	/** Initializes the instance of the Angular Http service */
	public static initialize(http: HttpClient) {
		if (this._http === undefined && AppUtility.isNotNull(http)) {
			this._http = http;
		}
	}

	/**
		* Makes a request to an endpoint API
		* @param verb HTTP verb to perform the request
		* @param uri Full URI of the end-point API's uri to make the request
		* @param body The JSON object that contains the body to make the request
		* @param options The options to make the request
	*/
	public static makeRequest(
		verb: string,
		uri: string,
		body?: any,
		options?: {
			headers?: HttpHeaders | { [header: string]: string | string[] };
			observe?: "body";
			params?: HttpParams | { [param: string]: string | string[] };
			reportProgress?: boolean;
			responseType?: "json";
			withCredentials?: boolean;
		}
	) {
		if (this._http === undefined) {
			throw new Error("[AppXHR]: Call initialize first");
		}
		switch ((verb || "GET").toUpperCase()) {
			case "POST":
				return this._http.post(uri, body, options);
			case "PUT":
				return this._http.put(uri, body, options);
			case "DELETE":
				return this._http.delete(uri, options);
			case "PATCH":
				return this._http.patch(uri, options);
			case "HEAD":
				return this._http.head(uri, options);
			case "OPTIONS":
				return this._http.options(uri, options);
			default:
				return this._http.get(uri, options);
		}
	}

	/**
		* Sends a request to an endpoint API
		* @param verb HTTP verb to perform the request
		* @param uri Full URI of the end-point API's uri to perform the request
		* @param headers Additional headers to perform the request
		* @param body The JSON object that contains the body to perform the request
	*/
	public static sendRequest(verb: string, uri: string, headers?: any, body?: any) {
		const httpHeaders = AppConfig.getAuthenticatedHeaders();
		if (AppUtility.isArray(headers, true)) {
			(headers as Array<any>).forEach(header => {
				if (AppUtility.isObject(header, true) && AppUtility.isNotEmpty(header.name) && AppUtility.isNotEmpty(header.value)) {
					httpHeaders[header.name as string] = header.value as string;
				}
			});
		}
		else if (AppUtility.isObject(headers, true)) {
			Object.keys(headers).forEach(name => {
				const value = headers[name];
				httpHeaders[name] = value !== undefined ? value.toString() : undefined;
			});
		}
		return this.makeRequest(verb, uri, body, { headers: httpHeaders });
	}

	/**
		* Sends a request to an endpoint API
		* @param verb HTTP verb to perform the request
		* @param uri Full URI of the end-point API's uri to perform the request
		* @param headers Additional headers to perform the request
		* @param body The JSON object that contains the body to perform the request
	*/
	public static sendRequestAsync(verb: string, uri: string, headers?: any, body?: any) {
		return this.sendRequest(verb, uri, headers, body).toPromise();
	}

	/**
		* Gets the URI to send a request to APIs
		* @param path Path of the end-point API's uri to perform the request
		* @param endpoint URI of the end-point API's uri to perform the request
	*/
	public static getURI(path: string, endpoint?: string) {
		return (path.startsWith("http://") || path.startsWith("https://") ? "" : endpoint || AppConfig.URIs.apis) + path;
	}

	/**
		* Performs a request to APIs with "GET" verb
		* @param path Path of the end-point API's uri to perform the request
		* @param headers Additional headers to perform the request
	*/
	public static get(path: string, headers?: any) {
		return this.sendRequest("GET", this.getURI(path), headers);
	}

	/**
		* Performs a request to APIs with "GET" verb
		* @param path Path of the end-point API's uri to perform the request
		* @param headers Additional headers to perform the request
	*/
	public static getAsync(path: string, headers?: any) {
		return this.get(path, headers).toPromise();
	}

	/**
		* Performs a request to APIs with "POST" verb
		* @param path Path of the end-point API's uri to perform the request
		* @param body The JSON object that contains the body to perform the request
		* @param headers Additional headers to perform the request
	*/
	public static post(path: string, body: any, headers?: any) {
		return this.sendRequest("POST", this.getURI(path), headers, body);
	}

	/**
		* Performs a request to APIs with "POST" verb
		* @param path Path of the end-point API's uri to perform the request
		* @param body The JSON object that contains the body to perform the request
		* @param headers Additional headers to perform the request
	*/
	public static postAsync(path: string, body: any, headers?: any) {
		return this.post(path, body, headers).toPromise();
	}

	/**
		* Performs a request to APIs with "PUT" verb
		* @param path Path of the end-point API's uri to perform the request
		* @param body The JSON object that contains the body to perform the request
		* @param headers Additional headers to perform the request
	*/
	public static put(path: string, body: any, headers?: any) {
		return this.sendRequest("PUT", this.getURI(path), headers, body);
	}

	/**
		* Performs a request to APIs with "PUT" verb
		* @param path Path of the end-point API's uri to perform the request
		* @param body The JSON object that contains the body to perform the request
		* @param headers Additional headers to perform the request
	*/
	public static putAsync(path: string, body: any, headers?: any) {
		return this.put(path, body, headers).toPromise();
	}

	/**
		* Performs a request to APIs with "DELETE" verb
		* @param path Path of the end-point API's uri to perform the request
		* @param headers Additional headers to perform the request
	*/
	public static delete(path: string, headers?: any) {
		return this.sendRequest("DELETE", this.getURI(path), headers);
	}

	/**
		* Performs a request to APIs with "DELETE" verb
		* @param path Path of the end-point API's uri to perform the request
		* @param headers Additional headers to perform the request
	*/
	public static deleteAsync(path: string, headers?: any) {
		return this.delete(path, headers).toPromise();
	}

}
