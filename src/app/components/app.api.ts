import { Http, Headers } from "@angular/http";
import { AppConfig } from "../app.config";
import { AppUtility } from "./app.utility";
import { AppCrypto } from "./app.crypto";

/** Servicing component for working with remote APIs */
export class AppAPI {
	private static _http: Http = undefined;

	/** Initializes the instance of the Angular Http service */
	public static initialize(http: Http) {
		if (this._http === undefined && AppUtility.isNotNull(http)) {
			this._http = http;
		}
	}

	/** Gets the captcha headers (JSON) for making requests to APIs */
	public static getCaptchaHeaders(captcha: string) {
		return {
			"x-captcha": "true",
			"x-captcha-registered": AppCrypto.aesEncrypt(AppConfig.session.captcha.code),
			"x-captcha-input": AppCrypto.aesEncrypt(captcha)
		};
	}

	/** Gets the authenticated headers (JSON) for making requests to APIs */
	public static getAuthHeaders(addToken: boolean = true, addAppInfo: boolean = true, addDeviceID: boolean = true) {
		const headers = {};

		if (addToken && AppUtility.isObject(AppConfig.session.token, true)
			&& AppUtility.isObject(AppConfig.session.keys, true) && AppUtility.isNotEmpty(AppConfig.session.keys.jwt)) {
			headers["x-app-token"] = AppCrypto.jwtEncode(AppConfig.session.token, AppConfig.session.keys.jwt);
		}

		if (addAppInfo) {
			headers["x-app-name"] = AppConfig.app.name;
			headers["x-app-platform"] = AppConfig.app.platform;
		}

		if (addDeviceID && AppUtility.isNotEmpty(AppConfig.session.device)) {
			headers["x-device-id"] = AppConfig.session.device;
		}

		return headers;
	}

	/** Gets the headers for making requests to APIs */
	public static getHeaders(additional?: any, addContentType?: boolean) {
		const headers = new Headers();

		const authHeaders = this.getAuthHeaders();
		Object.keys(authHeaders).forEach(name => headers.append(name, authHeaders[name]));

		if (additional !== undefined && additional !== null) {
			if (AppUtility.isArray(additional)) {
				(additional as Array<any>).forEach(header => {
					if (AppUtility.isObject(header, true) && AppUtility.isNotEmpty(header.name) && AppUtility.isNotEmpty(header.value)) {
						headers.append(header.name as string, header.value as string);
					}
				});
			}
			else if (AppUtility.isObject(additional)) {
				Object.keys(additional).forEach(name => headers.append(name, additional[name]));
			}
		}

		if (addContentType) {
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
		switch (method.toUpperCase()) {
			case "POST":
				return this._http.post(uri, JSON.stringify(body || {}), { headers: this.getHeaders(headers, true) });
			case "PUT":
				return this._http.put(uri, JSON.stringify(body || {}), { headers: this.getHeaders(headers, true) });
			case "DELETE":
				return this._http.delete(uri, { headers: this.getHeaders(headers) });
			default:
				return this._http.get(uri, { headers: this.getHeaders(headers) });
		}
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
