import { Dictionary } from "typescript-collections";
import { AppCrypto } from "./app.crypto";
import { AppUtility } from "./app.utility";

/** Presents a data pagination */
export interface AppDataPagination {
	TotalRecords: number;
	TotalPages: number;
	PageSize: number;
	PageNumber: number;
}

/** Presents a data request */
export interface AppDataRequest {
	FilterBy?: { [key: string]: any };
	SortBy?: { [key: string]: any };
	Pagination?: AppDataPagination;
}

/** Servicing component for working with paginations */
export class AppPagination {

	/** All pagination instances */
	public static instances = new Dictionary<string, AppDataPagination>();

	private static cloneFilterBy(filterBy: { [key: string]: any }) {
		const filter = AppUtility.clone(
			filterBy || {},
			true,
			["IsNull", "IsNotNull", "IsEmpty", "IsNotEmpty"],
			obj => Object.getOwnPropertyNames(obj)
				.filter(name => AppUtility.isArray(obj[name], true))
				.map(name => obj[name] as Array<any>)
				.forEach(array => {
					let index = 0;
					while (index < array.length) {
						if (AppUtility.isNull(array[index])) {
							array.splice(index, 1);
						}
						else {
							index++;
						}
					}
				})
		) as { [key: string]: any };
		if (filter.Query === undefined) {
			delete filter.Query;
		}
		if (filter.And === undefined && filter.Or === undefined) {
			filter["And"] = [];
		}
		return filter;
	}

	private static getKey(info?: any, prefix?: string) {
		const filterBy = info !== undefined ? this.cloneFilterBy(info.FilterBy) : undefined;
		return filterBy !== undefined && AppUtility.isNotEmpty(filterBy.Query)
			? undefined
			: (AppUtility.isNotEmpty(prefix) ? prefix + ":" : "") + AppCrypto.md5((JSON.stringify(filterBy || {}) + JSON.stringify(info !== undefined ? info.SortBy || {} : {})).toLowerCase());
	}

	/** Gets the default pagination */
	public static getDefault(info?: any): AppDataPagination {
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
	public static get(info?: any, prefix?: string): AppDataPagination {
		const key = this.getKey(info, prefix);
		const pagination = AppUtility.isNotEmpty(key) ? this.instances.getValue(key) : undefined;
		return pagination !== undefined
			? {
					TotalRecords: pagination.TotalRecords,
					TotalPages: pagination.TotalPages,
					PageSize: pagination.PageSize,
					PageNumber: pagination.PageNumber
				}
			: undefined;
	}

	/** Sets a pagination */
	public static set(info?: any, prefix?: string) {
		const key = this.getKey(info, prefix);
		if (AppUtility.isNotEmpty(key)) {
			this.instances.setValue(key, this.getDefault(info));
		}
	}

	/** Removes a pagination */
	public static remove(info?: any, prefix?: string) {
		const key = this.getKey(info, prefix);
		if (AppUtility.isNotEmpty(key)) {
			this.instances.remove(key);
		}
	}

	/** Computes the total of records */
	public static computeTotal(pageNumber: number, pagination?: AppDataPagination) {
		let totalRecords = pageNumber * (AppUtility.isObject(pagination, true) ? pagination.PageSize : 20);
		if (AppUtility.isObject(pagination, true) && totalRecords > pagination.TotalRecords) {
			totalRecords = pagination.TotalRecords;
		}
		return totalRecords;
	}

	/** Builds the well-formed request (contains filter, sort and pagination) for working with remote APIs */
	public static buildRequest(filterBy?: { [key: string]: any }, sortBy?: { [key: string]: any }, pagination?: AppDataPagination, onCompleted?: (request: AppDataRequest) => void) {
		const request: AppDataRequest = {
			FilterBy: this.cloneFilterBy(filterBy),
			SortBy: AppUtility.clone(sortBy || {}, true) as { [key: string]: any },
			Pagination: this.getDefault({ Pagination: pagination })
		};
		if (onCompleted !== undefined) {
			onCompleted(request);
		}
		return request;
	}

}
