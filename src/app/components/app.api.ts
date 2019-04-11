import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { AppConfig } from "../app.config";
import { AppUtility } from "./app.utility";

/** Servicing component for working with remote APIs via XMLHttpRequest (XHR) */
export class AppAPI {

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
			Object.keys(headers).forEach(name => httpHeaders[name] = headers[name].toString());
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
	public static sendRequestAsync(method: string, uri: string, headers?: any, body?: any) {
		return this.sendRequest(method, uri, headers).toPromise();
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
