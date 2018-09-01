import * as Collections from "typescript-collections";
import { AppCrypto } from "./app.crypto";
import { AppUtility } from "./app.utility";

/** Servicing component for working with paginations */
export class AppPagination {

	/** All pagination instances */
	public static instances = new Collections.Dictionary<string, { TotalRecords: number, TotalPages: number, PageSize: number, PageNumber: number }>();

	private static getKey(info?: any, prefix?: string) {
		const filterBy = info !== undefined
			? AppUtility.clone(info.FilterBy || {}, true)
			: undefined;
		return filterBy !== undefined && AppUtility.isNotEmpty(filterBy.Query)
			? undefined
			: (AppUtility.isNotEmpty(prefix) ? prefix + ":" : "") + AppCrypto.md5((JSON.stringify(filterBy || {}) + JSON.stringify(info !== undefined ? AppUtility.clone(info.SortBy || {}, true) : {})).toLowerCase());
	}

	/** Gets the default pagination */
	public static getDefault(info?: any): { TotalRecords: number, TotalPages: number, PageSize: number, PageNumber: number } {
		const pagination = info !== undefined ? info.Pagination : undefined;
		return AppUtility.isObject(pagination, true)
			? {
					TotalRecords: pagination.TotalRecords !== undefined ? pagination.TotalRecords : -1,
					TotalPages: pagination.TotalPages !== undefined ? pagination.TotalPages : 0,
					PageSize: pagination.PageSize !== undefined ? pagination.PageSize : 20,
					PageNumber: pagination.PageNumber !== undefined ? pagination.PageNumber : 0
				}
			: {
					TotalRecords: -1,
					TotalPages: 0,
					PageSize: 20,
					PageNumber: 0
				};
	}

	/** Gets a pagination */
	public static get(info?: any, prefix?: string) {
		const id = this.getKey(info, prefix);
		return AppUtility.isNotEmpty(id)
			? this.instances.getValue(id)
			: undefined;
	}

	/** Sets a pagination */
	public static set(info?: any, prefix?: string) {
		const id = this.getKey(info, prefix);
		if (AppUtility.isNotEmpty(id)) {
			this.instances.setValue(id, this.getDefault(info));
		}
	}

	/** Removes a pagination */
	public static remove(info?: any, prefix?: string) {
		const id = this.getKey(info, prefix);
		if (AppUtility.isNotEmpty(id)) {
			this.instances.remove(id);
		}
	}

	/** Computes the total of records */
	public static computeTotal(pageNumber: number, pagination?: { TotalRecords: number, TotalPages: number, PageSize: number, PageNumber: number }) {
		let totalRecords = pageNumber * (AppUtility.isObject(pagination, true) ? pagination.PageSize : 20);
		if (AppUtility.isObject(pagination, true) && totalRecords > pagination.TotalRecords) {
			totalRecords = pagination.TotalRecords;
		}
		return totalRecords;
	}

	/** Builds the well-formed request (contains filter, sort and pagination) for working with remote APIs */
	public static buildRequest(filterBy?: any, sortBy?: any, pagination?: any, onCompleted?: (request: { FilterBy: { [key: string]: any }, SortBy: { [key: string]: any }, Pagination: { [key: string]: any } }) => void) {
		const request = {
			FilterBy: AppUtility.clone(filterBy || {}, true),
			SortBy: AppUtility.clone(sortBy || {}, true),
			Pagination: this.getDefault({ Pagination: pagination })
		};
		if (onCompleted !== undefined) {
			onCompleted(request);
		}
		return request;
	}

}
