import { Http, Headers } from "@angular/http";
import { AppConfig } from "../app.config";
import { AppUtility } from "./app.utility";

/** Servicing component for working with remote APIs */
export class AppAPI {

	private static _http: Http = undefined;

	/** Initializes the instance of the Angular Http service */
	public static initialize(http: Http) {
		if (this._http === undefined && AppUtility.isNotNull(http)) {
			this._http = http;
		}
	}

	/** Gets the headers for making requests to APIs */
	public static getHeaders(additional?: any, addContentType?: boolean) {
		const headers = new Headers();

		const authHeaders = AppConfig.getAuthenticatedHeaders();
		Object.keys(authHeaders).forEach(name => headers.append(name, authHeaders[name]));

		if (AppUtility.isArray(additional, true)) {
			(additional as Array<any>).forEach(header => {
				if (AppUtility.isObject(header, true) && AppUtility.isNotEmpty(header.name) && AppUtility.isNotEmpty(header.value)) {
					headers.append(header.name as string, header.value as string);
				}
			});
		}
		else if (AppUtility.isObject(additional, true)) {
			Object.keys(additional).forEach(name => headers.append(name, additional[name]));
		}

		if (AppUtility.isTrue(addContentType)) {
			headers.append("content-type", "application/json");
		}

		return headers;
	}

	/**
		* Sends a request to APIs
		* @param method HTTP verb to perform the request
		* @param uri Full URI of the end-point API"s uri to perform the request
		* @param headers Additional headers to perform the request
		* @param body The JSON object that contains the body to perform the request
	*/
	public static send(method: string = "GET", uri: string, headers?: any, body?: any) {
		if (this._http === undefined) {
			throw new Error("[AppAPI]: Call initialize first");
		}
		switch ((method || "GET").toUpperCase()) {
			case "POST":
				return this._http.post(uri, JSON.stringify(body || {}), { headers: this.getHeaders(headers, true) });
			case "PUT":
				return this._http.put(uri, JSON.stringify(body || {}), { headers: this.getHeaders(headers, true) });
			case "DELETE":
				return this._http.delete(uri, { headers: this.getHeaders(headers) });
			case "PATCH":
				return this._http.patch(uri, { headers: this.getHeaders(headers) });
			case "HEAD":
				return this._http.head(uri, { headers: this.getHeaders(headers) });
			case "OPTIONS":
				return this._http.options(uri, { headers: this.getHeaders(headers) });
			default:
				return this._http.get(uri, { headers: this.getHeaders(headers) });
		}
	}

	/**
		* Sends a request to APIs
		* @param method HTTP verb to perform the request
		* @param uri Full URI of the end-point API"s uri to perform the request
		* @param headers Additional headers to perform the request
		* @param body The JSON object that contains the body to perform the request
	*/
	public static sendAsync(method: string = "GET", uri: string, headers?: any, body?: any) {
		return this.send(method, uri, headers).toPromise();
	}

	/**
		* Performs a request to APIs with "GET" verb
		* @param path Path of the end-point API"s uri to perform the request
		* @param headers Additional headers to perform the request
	*/
	public static get(path: string, headers?: any) {
		return this.send("GET", AppConfig.URIs.apis + path, headers);
	}

	/**
		* Performs a request to APIs with "GET" verb
		* @param path Path of the end-point API"s uri to perform the request
		* @param headers Additional headers to perform the request
	*/
	public static getAsync(path: string, headers?: any) {
		return this.get(path, headers).toPromise();
	}

	/**
		* Performs a request to APIs with "POST" verb
		* @param path Path of the end-point API"s uri to perform the request
		* @param body The JSON object that contains the body to perform the request
		* @param headers Additional headers to perform the request
	*/
	public static post(path: string, body: any, headers?: any) {
		return this.send("POST", AppConfig.URIs.apis + path, headers, body);
	}

	/**
		* Performs a request to APIs with "POST" verb
		* @param path Path of the end-point API"s uri to perform the request
		* @param body The JSON object that contains the body to perform the request
		* @param headers Additional headers to perform the request
	*/
	public static postAsync(path: string, body: any, headers?: any) {
		return this.post(path, body, headers).toPromise();
	}

	/**
		* Performs a request to APIs with "PUT" verb
		* @param path Path of the end-point API"s uri to perform the request
		* @param body The JSON object that contains the body to perform the request
		* @param headers Additional headers to perform the request
	*/
	public static put(path: string, body: any, headers?: any) {
		return this.send("PUT", AppConfig.URIs.apis + path, headers, body);
	}

	/**
		* Performs a request to APIs with "PUT" verb
		* @param path Path of the end-point API"s uri to perform the request
		* @param body The JSON object that contains the body to perform the request
		* @param headers Additional headers to perform the request
	*/
	public static putAsync(path: string, body: any, headers?: any) {
		return this.put(path, body, headers).toPromise();
	}

	/**
		* Performs a request to APIs with "DELETE" verb
		* @param path Path of the end-point API"s uri to perform the request
		* @param headers Additional headers to perform the request
	*/
	public static delete(path: string, headers?: any) {
		return this.send("DELETE", AppConfig.URIs.apis + path, headers);
	}

	/**
		* Performs a request to APIs with "DELETE" verb
		* @param path Path of the end-point API"s uri to perform the request
		* @param headers Additional headers to perform the request
	*/
	public static deleteAsync(path: string, headers?: any) {
		return this.delete(path, headers).toPromise();
	}

}
