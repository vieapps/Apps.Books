import { Injectable } from "@angular/core";
import { Location } from "@angular/common";
import { Router, CanActivate } from "@angular/router";
import { AppConfig } from "../app.config";
import { AppAPI } from "../components/app.api";
import { AppRTU } from "../components/app.rtu";
import { AppCrypto } from "../components/app.crypto";
import { AppPagination } from "../components/app.pagination";
import { AppUtility } from "../components/app.utility";

/** Base of all providers/services */
export class Base {

	constructor (name?: string) {
		this.Name = name || "";
	}

	/** Name of the service (for working with paginations as prefix, display logs/errors, ...) */
	protected Name = "";

	/** Gets name of the service (for working with paginations as prefix, display logs/errors, ...) */
	public get serviceName() {
		return AppUtility.isNotEmpty(this.Name) ? this.Name : this.constructor.name;
	}

	/**
	 * Creates an instance
	 * @param path The URI path of the remote API to send the request to
	 * @param body The JSON body to send the request
	 * @param onNext The handler to run when the process is completed
	 * @param onError The handler to run when got any error
	 * @param headers The additional headers to send the request
	*/
	protected async createAsync(path: string, body: any, onNext?: (data?: any) => void, onError?: (error?: any) => void, headers?: any) {
		try {
			const response = await AppAPI.postAsync(path, body, headers);
			if (onNext !== undefined) {
				onNext(response);
			}
		}
		catch (error) {
			if (onError !== undefined) {
				onError(AppUtility.parseError(error));
			}
			else {
				this.showError("Error occurred while creating", error);
			}
		}
	}

	/**
	 * Reads an instance
	 * @param path The URI path of the remote API to send the request to
	 * @param onNext The handler to run when the process is completed
	 * @param onError The handler to run when got any error
	 * @param headers The additional headers to send the request
	*/
	protected async readAsync(path: string, onNext?: (data?: any) => void, onError?: (error?: any) => void, headers?: any) {
		try {
			const response = await AppAPI.getAsync(path, headers);
			if (onNext !== undefined) {
				onNext(response);
			}
		}
		catch (error) {
			if (onError !== undefined) {
				onError(AppUtility.parseError(error));
			}
			else {
				this.showError("Error occurred while reading", error);
			}
		}
	}

	/**
	 * Updates an instance
	 * @param path The URI path of the remote API to send the request to
	 * @param body The JSON body to send the request
	 * @param onNext The handler to run when the process is completed
	 * @param onError The handler to run when got any error
	 * @param headers The additional headers to send the request
	*/
	protected async updateAsync(path: string, body: any, onNext?: (data?: any) => void, onError?: (error?: any) => void, headers?: any) {
		try {
			const response = await AppAPI.putAsync(path, body, headers);
			if (onNext !== undefined) {
				onNext(response);
			}
		}
		catch (error) {
			if (onError !== undefined) {
				onError(AppUtility.parseError(error));
			}
			else {
				this.showError("Error occurred while updating", error);
			}
		}
	}

	/**
	 * Deletes an instance
	 * @param path The URI path of the remote API to send the request to
	 * @param onNext The handler to run when the process is completed
	 * @param onError The handler to run when got any error
	 * @param headers The additional headers to send the request
	*/
	protected async deleteAsync(path: string, onNext?: (data?: any) => void, onError?: (error?: any) => void, headers?: any) {
		try {
			const response = await AppAPI.deleteAsync(path, headers);
			if (onNext !== undefined) {
				onNext(response);
			}
		}
		catch (error) {
			if (onError !== undefined) {
				onError(AppUtility.parseError(error));
			}
			else {
				this.showError("Error occurred while deleting", error);
			}
		}
	}

	/**
	 * Searchs for instances (sends a request to remote API for searching with GET verb and "x-request" of query parameter)
	 * @param path The URI path of the remote API to send the request to (with 'x-request' query string)
	 * @param request The request to search (contains filter, sort and pagination)
	 * @param onNext The handler to run when the process is completed
	 * @param onError The handler to run when got any error
	 * @param dontProcessPagination Set to true to by-pass process pagination
	*/
	protected async searchAsync(path: string, request: any = {}, onNext?: (data?: any) => void, onError?: (error?: any) => void, dontProcessPagination?: boolean) {
		const processPagination = AppUtility.isFalse(dontProcessPagination);
		const pagination = processPagination ? AppPagination.get(request, this.serviceName) : undefined;
		const pageNumber = processPagination && request.Pagination !== undefined ? request.Pagination.PageNumber : pagination !== undefined ? pagination.PageNumber : 0;
		if (pagination !== undefined && (pageNumber < pagination.PageNumber || pagination.TotalPages <= pagination.PageNumber)) {
			if (onNext !== undefined) {
				onNext();
			}
		}
		else {
			try {
				if (request.Pagination !== undefined && request.Pagination.PageNumber !== undefined) {
					request.Pagination.PageNumber++;
				}
				const response = await AppAPI.getAsync(path + AppUtility.toBase64Url(request));
				if (processPagination || onNext !== undefined) {
					if (processPagination) {
						AppPagination.set(response, this.serviceName);
					}
					if (onNext !== undefined) {
						onNext(response);
					}
				}
			}
			catch (error) {
				if (onError !== undefined) {
					onError(AppUtility.parseError(error));
				}
				else {
					this.showError("Error occurred while searching", error);
				}
			}
		}
	}

	/**
	 * Searchs for instances (sends a request to remote API for searching with GET verb and "x-request" of query parameter)
	 * @param path The URI path of the remote API to send the request to (with 'x-request' query string)
	 * @param request The request to search (contains filter, sort and pagination)
	 * @param onNext The handler to run when the process is completed
	 * @param onError The handler to run when got any error
	 * @param dontProcessPagination Set to true to by-pass process pagination
	*/
	protected search(path: string, request: any = {}, onNext?: (data?: any) => void, onError?: (error?: any) => void, dontProcessPagination?: boolean) {
		return AppAPI.get(path + AppUtility.toBase64Url(request)).subscribe(
			response => {
				if (AppUtility.isFalse(dontProcessPagination) || onNext !== undefined) {
					if (AppUtility.isFalse(dontProcessPagination)) {
						AppPagination.set(response, this.serviceName);
					}
					if (onNext !== undefined) {
						onNext(response);
					}
				}
			},
			error => {
				if (onError !== undefined) {
					onError(AppUtility.parseError(error));
				}
				else {
					this.showError("Error occurred while searching", error);
				}
			}
		);
	}

	/**
	 * Sends a request to remote API to perform an action of a specified service
	 * @param request The request to send
	 * @param callback The callback function to handle the returning data
	*/
	protected send(request: {
			ServiceName: string,
			ObjectName: string,
			Verb: string,
			Query?: { [key: string]: string },
			Body?: any,
			Header?: { [key: string]: string },
			Extra?: { [key: string]: string }
		},
		callback?: (data: any) => void
	) {
		AppRTU.send(request, callback);
	}

	/** Gets the message for working with console/log file */
	protected getLogMessage(message: string) {
		return `[${this.serviceName}]: ${message}`;
	}

	/** Prints the error message to console/log file and run the next action */
	protected getErrorMessage(message: string, error?: any) {
		return this.getLogMessage(message + "\n" + AppUtility.getErrorMessage(error));
	}

	/** Prints the error message to console/log file and run the next action */
	protected showError(message: string, error?: any, onNext?: (error?: any) => void) {
		console.error(this.getErrorMessage(message, error), error);
		if (onNext !== undefined) {
			onNext(error);
		}
	}

}

@Injectable()
export class AppReadyGuardService implements CanActivate {
	constructor(
		public location: Location,
		public router: Router
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
		public location: Location,
		public router: Router
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
	constructor(public router: Router) {
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
	constructor(public router: Router) {
	}
	canActivate() {
		if (!AppConfig.accountRegistrations.registrable) {
			this.router.navigateByUrl(AppConfig.url.home);
		}
		return AppConfig.accountRegistrations.registrable;
	}
}
