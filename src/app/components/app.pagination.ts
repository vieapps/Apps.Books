import * as Collections from "typescript-collections";
import { AppCrypto } from "./app.crypto";
import { AppUtility } from "./app.utility";

/** Servicing component for working with paginations */
export class AppPagination {

	/** All pagination instances */
	public static instances = new Collections.Dictionary<string, { TotalRecords: number, TotalPages: number, PageSize: number, PageNumber: number }>();

	private static getFilterBy(info?: any) {
		return AppUtility.isObject(info, true) && AppUtility.isObject(info.FilterBy, true)
			? info.FilterBy
			: undefined;
	}

	private static getSortBy(info?: any) {
		return AppUtility.isObject(info, true) && AppUtility.isObject(info.SortBy, true)
			? info.SortBy
			: undefined;
	}

	private static getQuery(info?: any) {
		const filterby = this.getFilterBy(info);
		return AppUtility.isObject(filterby, true) && AppUtility.isObject(filterby.FilterBy, true) && AppUtility.isNotEmpty(filterby.FilterBy.Query)
			? filterby.FilterBy.Query as string
			: undefined;
	}

	private static getKey(info?: any, prefix?: string) {
		if (this.getQuery(info)) {
			return undefined;
		}

		prefix = AppUtility.isNotEmpty(prefix) ? prefix : "";
		const filterby = AppUtility.clean(this.getFilterBy(info) || {});
		const sortby = AppUtility.clean(this.getSortBy(info) || {});
		return prefix + ":" + AppCrypto.md5((JSON.stringify(filterby) + JSON.stringify(sortby)).toLowerCase());
	}

	/** Gets the default pagination */
	public static getDefault(info?: any): { TotalRecords: number, TotalPages: number, PageSize: number, PageNumber: number } {
		const pagination = info !== undefined
			? info.Pagination
			: undefined;

		return AppUtility.isObject(pagination, true)
			? {
					TotalRecords: pagination.TotalRecords ? pagination.TotalRecords : -1,
					TotalPages: pagination.TotalPages ? pagination.TotalPages : 0,
					PageSize: pagination.PageSize ? pagination.PageSize : 20,
					PageNumber: pagination.PageNumber ? pagination.PageNumber : 0
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
	public static buildRequest(filterBy?: any, sortBy?: any, pagination?: any, onPreCompleted?: (request: { FilterBy: any, SortBy: any, Pagination: any }) => void): { FilterBy: any, SortBy: any, Pagination: any } {
		const request = {
			FilterBy: AppUtility.isObject(filterBy, true) ? AppUtility.clone(filterBy) : {},
			SortBy: AppUtility.isObject(sortBy, true) ? AppUtility.clone(sortBy) : {},
			Pagination: this.getDefault({ Pagination: AppUtility.isObject(pagination, true) ? AppUtility.clone(pagination) : undefined })
		};
		if (onPreCompleted !== undefined) {
			onPreCompleted(request);
		}
		return request;
	}

}
