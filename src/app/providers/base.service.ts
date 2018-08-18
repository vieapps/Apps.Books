import { Http } from "@angular/http";
import { map } from "rxjs/operators";
import { AppAPI } from "../components/app.api";
import { AppRTU } from "../components/app.rtu";
import { AppUtility } from "../components/app.utility";
import { AppPagination } from "../components/app.pagination";

/** Base of all providers/services */
export class Base {

	/** Name of the service (for working with paginations as prefix, display error, ...) */
	protected Name = "";

	private get serviceName() {
		return AppUtility.isNotEmpty(this.Name) ? this.Name : this.constructor.name;
	}

	constructor(http: Http, name?: string) {
		AppAPI.initialize(http);
		this.Name = name || "";
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
				this.error("Error occurred while creating", error);
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
				this.error("Error occurred while reading", error);
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
				this.error("Error occurred while updating", error);
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
				this.error("Error occurred while deleting", error);
			}
		}
	}

	/** Sends a request/info to remote API via WebSocket connection (of the real-time update component) */
	protected send(request: { ServiceName: string, ObjectName: string, Verb: string, Query: any, Header: any, Body: any, Extra: any }, whenNotReady?: (data?: any) => void) {
		AppRTU.send(request, whenNotReady);
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
				this.error("Error occurred while searching", error);
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
			return null;
		}

		// update the page number and send request to search
		request.Pagination.PageNumber++;
		const searcher = AppAPI.get(path);

		// return the observable if onNext is unavailable
		if (AppUtility.isNull(onNext)) {
			return searcher;
		}

		// wait for the results and perform next action
		return searcher.pipe(map(response => response.json())).subscribe(
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
					this.error("Error occurred while searching", error);
				}
			}
		);
	}

	/** Prints the error message to console/log file and run the next action */
	protected error(message: string, error?: any, onError?: (error?: any) => void) {
		AppUtility.showError(`[${this.serviceName}]: ${message}`, error, onError);
	}

	/** Prints the log message to console/log file */
	protected log(message: string, ...params) {
		console.log(`[${this.serviceName}]: ${message}`, params);
	}

}
