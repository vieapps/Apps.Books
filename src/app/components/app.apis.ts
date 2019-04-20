import { Subject } from "rxjs";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { AppConfig } from "../app.config";
import { AppUtility } from "./app.utility";
import { PlatformUtility } from "./app.utility.platform";

/** Presents the struct of a message type */
export interface AppMessageType {
	Service: string;
	Object: string;
	Event: string;
}

/** Presents the struct of a message */
export interface AppMessage {
	Type: AppMessageType;
	Data: any;
}

/** Presents the struct of a request information */
export interface AppRequestInfo {
	ServiceName: string;
	ObjectName: string;
	Verb?: string;
	Query?: { [key: string]: string };
	Body?: any;
	Header?: { [key: string]: string };
	Extra?: { [key: string]: string };
}

/** Servicing component for working with the remote APIs via WebSocket */
export class AppRTU {

	private static _status = "initializing";
	private static _uri: string = undefined;
	private static _websocket: WebSocket = undefined;
	private static _types: {
		[key: string]: AppMessageType
	} = {};
	private static _serviceScopeHandlers: {
		[key: string]: Array<{ func: (message: AppMessage) => void, identity: string }>
	} = {};
	private static _objectScopeHandlers: {
		[key: string]: Array<{ func: (message: AppMessage) => void, identity: string }>
	} = {};
	private static _serviceScopeSubject: Subject<{
		service: string,
		message: AppMessage
	}>;
	private static _objectScopeSubject: Subject<{
		service: string,
		object: string,
		message: AppMessage
	}>;
	private static _queue = {
		counter: 0,
		commands: {} as { [id: string]: string },
		successCallbacks: {} as { [id: string]: (data?: any) => void },
		errorCallbacks: {} as { [id: string]: (error?: any) => void }
	};

	private static _onOpen: (event: Event) => void = undefined;

	/** Sets the action to fire when the RTU is opened */
	public static set OnOpen(func: (event: Event) => void) {
		this._onOpen = func;
	}

	private static _onClose: (event: CloseEvent) => void = undefined;

	/** Sets the action to fire when the RTU is closed */
	public static set OnClose(func: (event: CloseEvent) => void) {
		this._onClose = func;
	}

	private static _onError: (event: Event) => void = undefined;

	/** Sets the action to fire when the RTU got any error */
	public static set OnError(func: (event: Event) => void) {
		this._onError = func;
	}

	private static _onMessage: (event: MessageEvent) => void = undefined;

	/** Sets the action to fire when the RTU got any error */
	public static set OnMessage(func: (event: MessageEvent) => void) {
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
	public static parse(type: string) {
		let msgType = this._types[type];
		if (msgType === undefined) {
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
			msgType = {
				Service: service,
				Object:  object,
				Event: event
			};
			this._types[type] = msgType;
		}
		return msgType;
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
				message: AppMessage
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
				message: AppMessage
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
		this._uri = (AppUtility.isNotEmpty(AppConfig.URIs.updates) ? AppConfig.URIs.updates : AppConfig.URIs.apis).replace("http://", "ws://").replace("https://", "wss://") + "v?x-request=" + AppUtility.toBase64Url(AppConfig.getAuthenticatedHeaders());
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
			PlatformUtility.invoke(() => {
				const identities = Object.keys(this._queue.commands);
				if (this.isReady && identities.length > 0) {
					console.log(`[RTU]: Send ${identities.length} queued request(s)...`);
					identities.forEach(id => this._websocket.send(this._queue.commands[id]));
				}
			}, 789);
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
			const successCallback = AppUtility.isNotEmpty(json.ID) ? this._queue.successCallbacks[json.ID] : undefined;
			const errorCallback = AppUtility.isNotEmpty(json.ID) ? this._queue.errorCallbacks[json.ID] : undefined;

			if (successCallback !== undefined || errorCallback !== undefined) {
				try {
					if ("Error" === json.Type) {
						if (errorCallback !== undefined) {
							errorCallback(json);
						}
						else {
							console.error("[RTU]: Got an error while processing", json);
						}
					}
					else if (successCallback !== undefined) {
						successCallback(json.Data || {});
					}
				}
				catch (error) {
					console.error("[RTU]: Error occurred while running the callback handler", error, json);
				}
			}

			else if ("Error" === json.Type) {
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
				const message: AppMessage = {
					Type: this.parse(json.Type),
					Data: json.Data || {}
				};

				if (AppConfig.isDebug) {
					console.log("[RTU]: Got a message", AppConfig.isNativeApp ? JSON.stringify(message) : message);
				}

				if (message.Type.Service === "Ping") {
					if (AppConfig.isDebug) {
						console.log("[RTU]: Got a heartbeat signal => response with PONG and update online status, run scheduler, ...");
					}
					this.send({
						ServiceName: "rtu",
						ObjectName: "session",
						Verb: "PONG"
					});
					this.send({
						ServiceName: "users",
						ObjectName: "status",
						Verb: "GET"
					});
					if (this._serviceScopeHandlers["Scheduler"]) {
						this._serviceScopeSubject.next({ "service": "Scheduler", "message": message });
					}
				}

				else if (message.Type.Service === "Knock") {
					if (AppConfig.isDebug) {
						console.log(`[RTU]: Knock, Knock, Knock ... => Yes, I'm right here (${new Date().toJSON()})`);
					}
				}

				else if (AppConfig.session.device === json.ExcludedDeviceID) {
					if (AppConfig.isDebug) {
						console.warn("[RTU]: The device is excluded", AppConfig.session.device);
					}
				}

				else {
					this.publish(message);
				}
			}

			if (AppUtility.isNotEmpty(json.ID)) {
				delete this._queue.commands[json.ID];
				delete this._queue.successCallbacks[json.ID];
				delete this._queue.errorCallbacks[json.ID];
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
	public static stop(onStopped?: () => void) {
		this._uri = undefined;
		this._status = "closed";
		if (this._websocket !== undefined) {
			this._websocket.close();
			this._websocket = undefined;
		}
		if (onStopped !== undefined) {
			onStopped();
		}
	}

	/** Publishs a message */
	public static publish(message: AppMessage) {
		this._serviceScopeSubject.next({ "service": message.Type.Service, "message": message });
		this._objectScopeSubject.next({ "service": message.Type.Service, "object": message.Type.Object, "message": message });
	}

	/**
	 * Sends a request to perform an action of a specified service
	 * @param request The request to send to remote APIs
	 * @param onSuccess The callback function to handle the returning data
	 * @param onError The callback function to handle the returning error
	*/
	public static send(request: AppRequestInfo, onSuccess?: (data?: any) => void, onError?: (error?: any) => void) {
		const id = `r-${this._queue.counter}`;
		this._queue.counter++;
		this._queue.commands[id] = JSON.stringify({
			ID: id,
			ServiceName: request.ServiceName,
			ObjectName: request.ObjectName,
			Verb: request.Verb || "GET",
			Query: request.Query || {},
			Body: request.Body || {},
			Header: request.Header || {},
			Extra: request.Extra || {}
		});
		this._queue.successCallbacks[id] = onSuccess;
		this._queue.errorCallbacks[id] = onError;
		if (this.isReady) {
			this._websocket.send(this._queue.commands[id]);
		}
	}

}

/** Servicing component for working with remote APIs via XMLHttpRequest (XHR) */
export class AppXHR {

	private static _http: HttpClient = undefined;

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
		body: any | null,
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
			throw new Error("[AppAPI]: Call initialize first");
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
	public static sendRequest(verb: string = "GET", uri: string, headers?: any, body?: any) {
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
		* @param method HTTP verb to perform the request
		* @param uri Full URI of the end-point API's uri to perform the request
		* @param headers Additional headers to perform the request
		* @param body The JSON object that contains the body to perform the request
	*/
	public static sendRequestAsync(method: string = "GET", uri: string, headers?: any, body?: any) {
		return this.sendRequest(method, uri, headers, body).toPromise();
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