import { Injectable } from "@angular/core";
import { Location } from "@angular/common";
import { Router, CanActivate } from "@angular/router";
import { AppConfig } from "../app.config";
import { AppRTU, AppXHR, AppRequestInfo, AppMessage } from "@components/app.apis";
import { AppCrypto } from "@components/app.crypto";
import { AppPagination } from "@components/app.pagination";
import { AppUtility } from "@components/app.utility";
import { PlatformUtility } from "@components/app.utility.platform";

/** Base class of all services */
export class Base {

	private _name = "";

	constructor(
		name?: string
	) {
		this._name = name || this.constructor.name;
	}

	/** Gets name of the service (for working with paginations as prefix, display logs/errors, ...) */
	public get name() {
		return this._name;
	}

	/** Broadcasts a message to all subscribers */
	public broadcast(message: AppMessage) {
		AppRTU.broadcast(message);
	}

	/** Forwards a message to all subscribers */
	public forward(message: any, serviceName: string, objectName?: string, event?: string) {
		this.broadcast({
			Type: {
				Service: serviceName,
				Object: objectName,
				Event: event
			},
			Data: message
		});
	}

	/**
		* Sends a request to an endpoint API via HXR
		* @param verb HTTP verb to perform the request
		* @param uri Full URI of the end-point API's uri to perform the request
		* @param headers Additional headers to perform the request
		* @param body The JSON object that contains the body to perform the request
	*/
	protected requestAsync(verb: string, uri: string, headers?: any, body?: any) {
		return AppXHR.sendRequestAsync(verb, uri, headers, body);
	}

	/**
	 * Sends a request to the remote API to perform an action of a specified service (using WebSocket)
	 * @param request The request to send
	 * @param onSuccess The callback function to handle the returning data
	 * @param onError The callback function to handle the returning error
	*/
	protected send(request: AppRequestInfo, onSuccess?: (data?: any) => void, onError?: (error?: any) => void) {
		AppRTU.send(request, onSuccess, onError);
	}

	/**
	 * Sends a request to the remote API to perform an action of a specified service (use WebSocket first, if not available then use XHR)
	 * @param request The request to perform
	 * @param onSuccess The callback function to handle the returning data
	 * @param onError The callback function to handle the returning error
	*/
	protected async sendAsync(request: {
			Path: string,
			Verb?: string,
			Body?: any,
			Header?: { [key: string]: string },
			Extra?: { [key: string]: string }
		},
		onSuccess?: (data?: any) => void,
		onError?: (error?: any) => void,
		useXHR: boolean = false
	) {
		let useWebSocket = AppRTU.isReady && !useXHR;
		if (useWebSocket) {
			if (new Date().getTime() - AppRTU.pingTime > 300000) { // 5 minutes
				useWebSocket = false;
				AppRTU.restart("[Base]: Ping period is too large...");
			}
		}
		if (useWebSocket) {
			const requestedPath = this.parseRequestedPath(request.Path);
			this.send({
				ServiceName: requestedPath.serviceName,
				ObjectName: requestedPath.objectName,
				Query: requestedPath.query,
				Verb: request.Verb,
				Body: request.Body,
				Header: request.Header,
				Extra: request.Extra
			}, onSuccess, onError);
		}
		else {
			try {
				let uri = AppXHR.getURI(request.Path);
				if (request.Extra !== undefined) {
					uri += (uri.indexOf("?") > 0 ? "&" : "?") + `x-request-extra=${AppUtility.toBase64Url(request.Extra)}`;
				}
				const data = await this.requestAsync(request.Verb || "GET", uri, request.Header, request.Body);
				if (onSuccess !== undefined) {
					onSuccess(data);
				}
			}
			catch (error) {
				if (onError !== undefined) {
					onError(error);
				}
				else {
					this.showError("Error occurred while processing with remote API", error);
				}
			}
		}
	}

	/** Parses the requested path to get related information */
	protected parseRequestedPath(path: string) {
		const uri = PlatformUtility.parseURI(path);
		const requestedPath = {
			serviceName: uri.Paths[0],
			objectName: uri.Paths.length > 1 ? uri.Paths[1] : "",
			objectIdentity: undefined as string,
			query: uri.QueryParams
		};
		if (uri.Paths.length > 2) {
			requestedPath.objectIdentity = requestedPath.query["object-identity"] = uri.Paths[2];
		}
		return requestedPath;
	}

	/**
	 * Sends a request to fetch data from the remote API (using XHR with GET verb)
	 * @param path The URI path of the remote API to send the request to
	 * @param onNext The handler to run when the process is completed
	 * @param onError The handler to run when got any error
	 * @param headers The additional headers to send the request
	*/
	protected fetchAsync(path: string, onNext?: (data?: any) => void, onError?: (error?: any) => void, headers?: { [header: string]: string }) {
		return this.sendAsync({ Path: path, Header: headers }, onNext, onError, true);
	}

	/**
	 * Gets the URI for working with the remote API
	 * @param objectName The name of the object
	 * @param objectID The identity of the object
	 * @param query The additional query
	*/
	protected getURI(objectName: string, objectID?: string, query?: string) {
		return `${this.name.toLowerCase()}/${objectName.toLowerCase()}` + (AppUtility.isNotEmpty(objectID) ? `/${objectID}` : "") + (AppUtility.isNotEmpty(query) ? `?${query}` : "");
	}

	/**
	 * Gets the URI for searching (with "x-request" parameter in the query string)
	 * @param objectName The name of the object for searching
	 * @param query The additional query
	*/
	protected getSearchURI(objectName: string, query?: string) {
		return this.getURI(objectName, "search", "x-request={{request}}" + (query !== undefined ? `&${query}` : ""));
	}

	/**
	 * Sends a request to remote API to search for instances (with GET verb and "x-request" of query parameter)
	 * @param path The URI path of the remote API to send the request to
	 * @param request The request to search (contains filter, sort and pagination)
	 * @param onNext The handler to run when the process is completed
	 * @param onError The handler to run when got any error
	 * @param dontProcessPagination Set to true to by-pass process pagination
	 * @param headers The additional header
	*/
	protected search(path: string, request: any = {}, onNext?: (data?: any) => void, onError?: (error?: any) => void, dontProcessPagination: boolean = false, headers?: { [header: string]: string }) {
		return AppXHR.get(AppUtility.format(path, { request: AppUtility.toBase64Url(request) }), headers).subscribe(
			data => {
				if (AppUtility.isFalse(dontProcessPagination)) {
					const requestedPath = this.parseRequestedPath(path);
					AppPagination.set(data, `${requestedPath.objectName}@${requestedPath.serviceName}`.toLowerCase());
				}
				if (onNext !== undefined) {
					onNext(data);
				}
			},
			error => this.showError("Error occurred while searching", error, onError)
		);
	}

	/**
	 * Sends a request to remote API to search for instances (with GET verb and "x-request" of query parameter)
	 * @param path The URI path of the remote API to send the request to
	 * @param request The request to search (contains filter, sort and pagination)
	 * @param onNext The handler to run when the process is completed
	 * @param onError The handler to run when got any error
	 * @param dontProcessPagination Set to true to by-pass process pagination
	 * @param useXHR Set to true to use XHR, false to system decides
	 * @param headers The additional header
	*/
	protected async searchAsync(path: string, request: any = {}, onNext?: (data?: any) => void, onError?: (error?: any) => void, dontProcessPagination: boolean = false, useXHR: boolean = false, headers?: { [header: string]: string }) {
		const processPagination = AppUtility.isFalse(dontProcessPagination);
		const requestedPath = processPagination ? this.parseRequestedPath(path) : undefined;
		const paginationPrefix = processPagination ? `${requestedPath.objectName}@${requestedPath.serviceName}`.toLowerCase() : undefined;
		const pagination = processPagination ? AppPagination.get(request, paginationPrefix) : undefined;
		const pageNumber = processPagination && request.Pagination !== undefined ? request.Pagination.PageNumber : pagination !== undefined ? pagination.PageNumber : 0;
		if (pagination !== undefined && (pageNumber < pagination.PageNumber || pagination.TotalPages <= pagination.PageNumber)) {
			if (onNext !== undefined) {
				onNext();
			}
		}
		else {
			if (request.Pagination !== undefined && request.Pagination.PageNumber !== undefined) {
				request.Pagination.PageNumber++;
			}
			await this.sendAsync(
				{
					Path: AppUtility.format(path, { request: AppUtility.toBase64Url(request) }),
					Verb: "GET",
					Header: headers
				},
				data => {
					if (processPagination) {
						AppPagination.set(data, paginationPrefix);
					}
					if (onNext !== undefined) {
						onNext(data);
					}
				},
				error => this.showError("Error occurred while searching", error, onError),
				useXHR
			);
		}
	}

	/**
	 * Sends a request to remote API to create new an instance
	 * @param path The URI path of the remote API to send the request to
	 * @param body The JSON body to send the request
	 * @param onNext The handler to run when the process is completed
	 * @param onError The handler to run when got any error
	 * @param headers The additional headers to send the request
	*/
	protected createAsync(path: string, body: any, onNext?: (data?: any) => void, onError?: (error?: any) => void, headers?: { [header: string]: string }, useXHR: boolean = false) {
		return this.sendAsync(
			{
				Path: path,
				Verb: "POST",
				Body: body,
				Header: headers
			},
			onNext,
			error => this.showError("Error occurred while creating", error, onError),
			useXHR
		);
	}

	/**
	 * Sends a request to remote API to read an instance
	 * @param path The URI path of the remote API to send the request to
	 * @param onNext The handler to run when the process is completed
	 * @param onError The handler to run when got any error
	 * @param headers The additional headers to send the request
	*/
	protected readAsync(path: string, onNext?: (data?: any) => void, onError?: (error?: any) => void, headers?: { [header: string]: string }, useXHR: boolean = false) {
		return this.sendAsync(
			{
				Path: path,
				Verb: "GET",
				Header: headers
			},
			onNext,
			error => this.showError("Error occurred while reading", error, onError),
			useXHR
		);
	}

	/**
	 * Sends a request to remote API to update an instance
	 * @param path The URI path of the remote API to send the request to
	 * @param body The JSON body to send the request
	 * @param onNext The handler to run when the process is completed
	 * @param onError The handler to run when got any error
	 * @param headers The additional headers to send the request
	*/
	protected updateAsync(path: string, body: any, onNext?: (data?: any) => void, onError?: (error?: any) => void, headers?: { [header: string]: string }, useXHR: boolean = false) {
		return this.sendAsync(
			{
				Path: path,
				Verb: "PUT",
				Body: body,
				Header: headers
			},
			onNext,
			error => this.showError("Error occurred while updating", error, onError),
			useXHR
		);
	}

	/**
	 * Sends a request to remote API to delete an instance
	 * @param path The URI path of the remote API to send the request to
	 * @param onNext The handler to run when the process is completed
	 * @param onError The handler to run when got any error
	 * @param headers The additional headers to send the request
	*/
	protected deleteAsync(path: string, onNext?: (data?: any) => void, onError?: (error?: any) => void, headers?: { [header: string]: string }, useXHR: boolean = false) {
		return this.sendAsync(
			{
				Path: path,
				Verb: "DELETE",
				Header: headers
			},
			onNext,
			error => this.showError("Error occurred while deleting", error, onError),
			useXHR
		);
	}

	/** Gets the message for working with console/log file */
	protected getLogMessage(message: string) {
		return `[${this.name}]: ${message}`;
	}

	/** Prints the error message to console/log file and run the next action */
	protected getErrorMessage(message: string, error?: any) {
		return this.getLogMessage(`${message}\n${AppUtility.getErrorMessage(error)}`);
	}

	/** Prints the error message to console/log file and run the next action */
	protected showError(message: string, error?: any, onNext?: (error?: any) => void) {
		console.error(this.getErrorMessage(message, error), error);
		if (onNext !== undefined) {
			onNext(AppUtility.parseError(error));
		}
	}

}

@Injectable()
export class AppReadyGuardService implements CanActivate {

	constructor(
		private router: Router,
		private location: Location
	) {
	}

	canActivate() {
		if (!AppConfig.isReady) {
			AppConfig.url.redirectToWhenReady = AppCrypto.urlEncode(this.location.path());
			this.router.navigateByUrl(AppConfig.url.home);
		}
		return AppConfig.isReady;
	}

}

@Injectable()
export class AuthenticatedGuardService implements CanActivate {

	constructor(
		private router: Router,
		private location: Location
	) {
	}

	canActivate() {
		if (!AppConfig.isAuthenticated) {
			this.router.navigateByUrl(AppConfig.url.users.login + "?next=" + AppCrypto.urlEncode(this.location.path()));
		}
		return AppConfig.isAuthenticated;
	}

}

@Injectable()
export class NotAuthenticatedGuardService implements CanActivate {

	constructor(
		private router: Router
	) {
	}

	canActivate() {
		if (AppConfig.isAuthenticated) {
			this.router.navigateByUrl(AppConfig.url.home);
		}
		return !AppConfig.isAuthenticated;
	}

}

@Injectable()
export class RegisterGuardService implements CanActivate {

	constructor(
		private router: Router
	) {
	}

	canActivate() {
		if (!AppConfig.accountRegistrations.registrable) {
			this.router.navigateByUrl(AppConfig.url.home);
		}
		return AppConfig.accountRegistrations.registrable;
	}

}
