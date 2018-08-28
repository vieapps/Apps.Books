import { Http } from "@angular/http";
import { map } from "rxjs/operators";
import { AppAPI } from "../components/app.api";
import { AppRTU } from "../components/app.rtu";
import { AppPagination } from "../components/app.pagination";
import { AppUtility } from "../components/app.utility";

/** Base of all providers/services */
export class Base {

	constructor (
		http: Http,
		name?: string
	) {
		AppAPI.initialize(http);
		this.Name = name || "";
	}

	/** Name of the service (for working with paginations as prefix, display logs/errors, ...) */
	protected Name = "";

	private get serviceName() {
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
				onNext(response.json());
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
				onNext(response.json());
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
				onNext(response.json());
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
				onNext(response.json());
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
	 * @param path The URI path of the remote API to send the request to
	 * @param request The request to search (contains filter, sort and pagination)
	 * @param onNext The handler to run when the process is completed
	 * @param onError The handler to run when got any error
	 * @param dontProcessPagination Set to true to by-pass process pagination
	*/
	protected async searchAsync(path: string, request: any, onNext?: (data?: any) => void, onError?: (error?: any) => void, dontProcessPagination?: boolean) {
		// stop if got pagination (means data are already)
		const processPagination = AppUtility.isFalse(dontProcessPagination);
		const pagination = processPagination
			? AppPagination.get(request, this.Name)
			: undefined;
		if (AppUtility.isNotNull(pagination) && pagination.PageNumber >= pagination.TotalPages) {
			if (onNext !== undefined) {
				onNext();
			}
			return null;
		}

		// update the page number and send request to search
		try {
			request.Pagination.PageNumber++;
			const response = await AppAPI.getAsync(path);
			if (processPagination || onNext !== undefined) {
				const data = response.json();
				if (processPagination) {
					AppPagination.set(data, this.Name);
				}
				if (onNext !== undefined) {
					onNext(data);
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

	/**
	 * Searchs for instances (sends a request to remote API for searching with GET verb and "x-request" of query parameter)
	 * @param path The URI path of the remote API to send the request to
	 * @param request The request to search (contains filter, sort and pagination)
	 * @param onNext The handler to run when the process is completed - null or undefined to get the Observable instance
	 * @param onError The handler to run when got any error
	 * @param dontProcessPagination Set to true to by-pass process pagination
	*/
	protected search(path: string, request: any, onNext?: (data?: any) => void, onError?: (error?: any) => void, dontProcessPagination?: boolean) {
		// stop if got pagination (means data are already)
		const processPagination = AppUtility.isFalse(dontProcessPagination);
		const pagination = processPagination
			? AppPagination.get(request, this.Name)
			: undefined;
		if (AppUtility.isNotNull(pagination) && pagination.PageNumber >= pagination.TotalPages) {
			if (onNext !== undefined) {
				onNext();
			}
			return undefined;
		}

		// update the page number and send request to search
		request.Pagination.PageNumber++;
		const searcher = AppAPI.get(path);

		// return the observable/subscription
		return AppUtility.isNotNull(onNext)
			? searcher.pipe(map(response => response.json())).subscribe(
				data => {
					if (processPagination) {
						AppPagination.set(data, this.Name);
					}
					onNext(data);
				},
				error => {
					if (onError !== undefined) {
						onError(AppUtility.parseError(error));
					}
					else {
						this.showError("Error occurred while searching", error);
					}
				})
			: searcher;
	}

	/** Sends a request/info to remote API via WebSocket connection (of the real-time update component) */
	protected send(request: { ServiceName: string, ObjectName: string, Verb: string, Query: any, Header: any, Body: any, Extra: any }, whenNotReady?: (data?: any) => void) {
		AppRTU.send(request, whenNotReady);
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
		console.error(this.getErrorMessage(message, error));
		if (onNext !== undefined) {
			onNext(error);
		}
	}

}
