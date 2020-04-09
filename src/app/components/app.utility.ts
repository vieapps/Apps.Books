import { List } from "linqts";
import { Set } from "typescript-collections";
import { HttpErrorResponse } from "@angular/common/http";
import { AppCrypto } from "./app.crypto";

/** Decorator of an extension method */
export function Extension(object: any) {
	let originalFunction: Function;
	return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
		originalFunction = descriptor.value;
		object.prototype[propertyKey] = (...args) => originalFunction(this, ...args);
	};
}

/** Servicing component for working with app */
export class AppUtility {

	private static _exceptions: Array<string> = [
		"UnauthorizedException", "AccessDeniedException",
		"SessionNotFoundException", "SessionExpiredException", "SessionInformationRequiredException", "InvalidSessionException",
		"TokenNotFoundException", "TokenExpiredException", "TokenRevokedException", "InvalidTokenException", "InvalidTokenSignatureException"
	];

	/** Checks to see the object is boolean and equals to true */
	public static isTrue(obj?: any) {
		return obj !== undefined && typeof obj === "boolean" && obj === true;
	}

	/** Checks to see the object is boolean (or not defined) and equals to false */
	public static isFalse(obj?: any) {
		return obj === undefined || (typeof obj === "boolean" && obj === false);
	}

	/** Checks to see the object is really object or not */
	public static isObject(obj?: any, notNull?: boolean) {
		return obj !== undefined && typeof obj === "object" && (this.isTrue(notNull) ? obj !== null : true);
	}

	/** Checks to see the object is array or not */
	public static isArray(obj?: any, notNull?: boolean) {
		return obj !== undefined && Array.isArray(obj) && (this.isTrue(notNull) ? obj !== null : true);
	}

	/** Checks to see the object is date or not */
	public static isDate(obj?: any) {
		return obj !== undefined && obj instanceof Date;
	}

	/** Checks to see the object is null or not */
	public static isNull(obj?: any) {
		return obj === undefined || obj === null;
	}

	/** Checks to see the object is defined and null or not */
	public static isNotNull(obj?: any) {
		return obj !== undefined && obj !== null;
	}

	/** Checks to see the string is defined and not empty */
	public static isNotEmpty(obj?: any) {
		return this.isNotNull(obj) && typeof obj === "string" && (obj as string).trim() !== "";
	}

	/** Compares two strings to see is equals or not */
	public static isEquals(str1: string, str2: string) {
		return this.isNotNull(str1) && this.isNotNull(str2) && str1.toLowerCase() === str2.toLowerCase();
	}

	/** Gets the position of the sub-string in the string */
	public static indexOf(str: string, substr: string, start?: number) {
		return this.isNotEmpty(str) && this.isNotEmpty(substr)
			? str.indexOf(substr, start)
			: -1;
	}

	/** Gets the state that determines the email address is valid or not */
	public static isValidEmail(email?: string) {
		const atPos = this.isNotEmpty(email) ? email.indexOf("@") : -1;
		const dotPos = this.isNotEmpty(email) ? email.indexOf(".", atPos + 1) : -1;
		return atPos > 0 && dotPos > atPos;
	}

	/** Gets the hidden email address for displaying at the public */
	public static getHiddenEmail(email: string) {
		return `${email.substr(0, email.indexOf("@") - 2)}**@**${email.substr(email.indexOf("@") + 3)}`;
	}

	/** Parses the error */
	public static parseError(error: any) {
		try {
			return error instanceof HttpErrorResponse
				? error.error
				: "Error" === error.Type && error.Data !== undefined ? error.Data : error;
		}
		catch (e) {
			return error;
		}
	}

	/** Gets the error message */
	public static getErrorMessage(error: any) {
		error = this.parseError(error);
		return this.isObject(error, true) && error.Type !== undefined && error.Message !== undefined
			? `Error: ${error.Message}\nType: ${error.Type}\nCorrelation ID: ${error.CorrelationID}`
			: error instanceof Error
				? error.message
				: `Unexpected error: ${error}`;
	}

	/** Checks the error to see that is security exception or not */
	public static isGotSecurityException(error?: any) {
		error = this.parseError(error);
		return this.isObject(error, true) && this.isNotEmpty(error.Type)
			? this._exceptions.find(e => e === error.Type) !== undefined
			: false;
	}

	/** Checks the error to see that is wrong account or password exception or not */
	public static isGotWrongAccountOrPasswordException(error?: any) {
		return this.isObject(error, true) && this.isNotEmpty(error.Type)
			? error.Type === "WrongAccountException"
			: false;
	}

	/** Checks the error to see that is captcha exception or not */
	public static isGotCaptchaException(error?: any) {
		return this.isObject(error, true) && this.isNotEmpty(error.Type) && this.isNotEmpty(error.Message)
			? error.Message.indexOf("Captcha code is invalid") > -1
			: false;
	}

	/** Checks the error to see that is OTP exception or not */
	public static isGotOTPException(error?: any) {
		return this.isObject(error, true) && this.isNotEmpty(error.Type) && this.isNotEmpty(error.Message)
			? error.Type === "OTPLoginFailedException" && error.Message.indexOf("Bad OTP") > -1
			: false;
	}

	/**
	 * Copys data from the source (object or JSON) into the objects" properties
	 * @param source The source (object or JSON) to copy data from
	 * @param obj The instance of an object to copy data into
	 * @param onCompleted The handler to run when copying process is completed
	*/
	public static copy(source: any, obj: any, onCompleted?: (data: any) => void) {
		try {
			const data = this.isNotEmpty(source)
				? JSON.parse(source)
				: this.isObject(source, true)
					? source
					: {};

			Object.getOwnPropertyNames(data).forEach(name => {
				const type = typeof obj[name];
				if (type !== "undefined" && type !== "function") {
					obj[name] = this.isDate(obj[name])
						? new Date(data[name])
						: data[name];
				}
			});

			if (onCompleted !== undefined) {
				onCompleted(data);
			}
		}
		catch (error) {
			console.error(`[Utility]: Error occurred while copying object`, error);
		}
	}

	/**
	 * Cleans undefined properties from the object
	 * @param obj The instance of an object to process
	 * @param excluded The collection of excluded properties are not be deleted event value is undefined
	 * @param onCompleted The handler to run when cleaning process is completed
	*/
	public static clean(obj: any, excluded?: Array<string>, onCompleted?: (obj: any) => void) {
		Object.getOwnPropertyNames(obj).forEach(name => {
			if (this.isNull(obj[name])) {
				if (excluded === undefined || excluded.indexOf(name) < 0) {
					delete obj[name];
				}
			}
			else if (this.isObject(obj[name])) {
				this.clean(obj[name], excluded);
				if (Object.getOwnPropertyNames(obj[name]).length < 1) {
					delete obj[name];
				}
			}
		});
		if (onCompleted !== undefined) {
			onCompleted(obj);
		}
		return obj;
	}

	/**
	 * Clones the object (means do stringify the source object and re-parse via JSON
	 * @param source The source object for cloning
	 * @param beRemovedOrCleanUndefined The array of attributes of the cloning object to be removed before returing or the boolean value to specified to clean undefined properties
	 * @param excluded The collection of excluded properties are not be deleted event value is undefined
	 * @param onCompleted The handler to run when process is completed
	*/
	public static clone(source?: any, beRemovedOrCleanUndefined?: Array<string> | boolean, excluded?: Array<string>, onCompleted?: (obj: any) => void) {
		// clone
		const exists = [];
		const obj = JSON.parse(JSON.stringify(source, (key: string, value: any) => {
			if (this.isObject(value, true)) {
				if (exists.indexOf(value) !== -1) {
					return;
				}
				exists.push(value);
			}
			return value;
		}));

		// remove the specified properties
		if (this.isArray(beRemovedOrCleanUndefined, true)) {
			(beRemovedOrCleanUndefined as Array<string>).forEach(name => delete obj[name]);
			if (onCompleted !== undefined) {
				onCompleted(obj);
			}
		}

		// clean undefined
		else if (this.isTrue(beRemovedOrCleanUndefined)) {
			this.clean(obj, excluded, onCompleted);
		}

		else if (onCompleted !== undefined) {
			onCompleted(obj);
		}

		// return clone object
		return obj;
	}

	/** Gets the compare function for sorting a sequence */
	public static getCompareFunction(...sorts: Array<string | { name: string, reverse?: boolean, primer?: (object: any) => any }>) {
		// preprocess sorting options
		const compareFn = (a: any, b: any): number => a === b ? 0 : a < b ? -1 : 1;
		const sortBy = sorts.map(sort => {
			return typeof sort === "string"
				? { name: sort as string, compare: compareFn }
				: { name: sort.name, compare: (a: any, b: any) => (sort.reverse ? -1 : 1) * (sort.primer !== undefined ? compareFn(sort.primer(a), sort.primer(b)) : compareFn(a, b)) };
		});

		// final comparison function
		return (a: any, b: any) => {
			let result = 0;
			for (let index = 0; index < sortBy.length; index++) {
				const name = sortBy[index].name;
				result = sortBy[index].compare(a[name], b[name]);
				if (result !== 0) {
					break;
				}
			}
			return result;
		};
	}

	/**
	 * Removes an item from the sequence base on index
	 * @param sequence The sequence for processing
	 * @param index The zero-based index to remove
	*/
	public static removeAt<T>(sequence: Array<T>, index: number) {
		if (index > -1 && index < sequence.length) {
			sequence.splice(index, 1);
		}
		return sequence;
	}

	/**
	 * Inserts an item into the sequence by the specific index
	 * @param sequence The sequence for processing
	 * @param item The item to insert into the sequence
	 * @param index The zero-based index to insert
	*/
	public static insertAt<T>(sequence: Array<T>, item: T, index: number = -1) {
		if (index > -1 && index < sequence.length) {
			sequence.splice(index, 0, item);
		}
		else {
			sequence.push(item);
		}
		return sequence;
	}

	/**
	 * Moves an item of the sequence to new position
	 * @param sequence The sequence for processing
	 * @param oldIndex The zero-based index to move from
	 * @param newIndex The zero-based index to move to
	*/
	public static moveTo<T>(sequence: Array<T>, oldIndex: number, newIndex: number) {
		if (oldIndex !== newIndex && oldIndex > -1 && oldIndex < sequence.length && newIndex > -1 && newIndex < sequence.length) {
			const items = sequence.splice(oldIndex, 1);
			if (items !== undefined && items.length > 0) {
				sequence.splice(newIndex < oldIndex ? newIndex : newIndex - 1, 0, items[0]);
			}
		}
	}

	/**
	 * Filters and sorts the sequence by the specified conditions
	 * @param sequence The sequence for processing
	 * @param filter The callback function to filter the sequence
	 * @param sort The callback function to sort the sequence
	*/
	public static filter<T>(sequence: Array<T>, filter: (value: T, index?: number, array?: Array<T>) => boolean, sort?: (a: any, b: any) => number) {
		return filter !== undefined && sort !== undefined
			? sequence.filter(filter).sort(sort)
			: filter !== undefined
				? sequence.filter(filter)
				: sort !== undefined
					? sequence.sort(sort)
					: sequence;
	}

	/**
	 * Converts, filters and sorts the sequence by the specified conditions
	 * @param sequence The sequence for processing
	 * @param converter The callback function to convert the sequence
	 * @param filter The callback function to filter the sequence
	 * @param sorter The callback function to sort the sequence
	*/
	public static convert<S, T>(sequence: Array<S>, converter: (value: S, index?: number, array?: Array<S>) => T, filter?: (value: T, index?: number, array?: Array<T>) => boolean, sorter?: (a: any, b: any) => number) {
		return this.filter(sequence.map(converter), filter, sorter);
	}

	/** Gets the query of JSON */
	public static getQueryOfJson(json: { [key: string]: any }) {
		try {
			return this.isObject(json, true)
				? this.toStr(Object.keys(json).map(name => `${name}=${encodeURIComponent(json[name])}`), "&")
				: "";
		}
		catch (error) {
			return "";
		}
	}

	/** Gets the JSON of a query param (means decode by Base64Url and parse to JSON) */
	public static getJsonOfQuery(value: string): { [key: string]: any } {
		try {
			return this.isNotEmpty(value)
				? JSON.parse(AppCrypto.urlDecode(value))
				: {};
		}
		catch (error) {
			return {};
		}
	}

	/** Gets the sub-sequence the sequence that ordering by the random scoring number */
	public static getTopScores<T>(sequence: Array<any> | List<any>, take?: number, converter?: (element: any) => T): T[] | any[] {
		const list = (this.isArray(sequence) ? new List(sequence as Array<any>) : sequence as List<any>).Select(element => this.clone(element, undefined, undefined, obj => obj["Score"] = Math.random())).OrderByDescending(element => element["Score"]);
		const results = (take !== undefined && take > 0 ? list.Take(take) : list).ToArray();
		return converter === undefined
			? results
			: results.map(element => converter(element));
	}

	/** Removes tags from the HTML content */
	public static removeTags(html?: string) {
		return this.isNotEmpty(html)
			? html.replace(/<\/?[^>]+(>|$)/g, "")
			: "";
	}

	/** Normalizes the HTML content */
	public static normalizeHtml(html?: string, removeTags?: boolean) {
		const wellHtml = this.isNotEmpty(html)
			? this.isTrue(removeTags)
				? this.removeTags(html)
				: html
			: "";
		return wellHtml !== ""
			? wellHtml.replace(/\&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/\r/g, "").replace(/\n/g, "<br/>")
			: "";
	}

	/** Gets all the available characters (0 and A-Z) */
	public static getChars() {
		const chars = new Array<string>("0");
		for (let code = 65; code < 91; code++) {
			chars.push(String.fromCharCode(code));
		}
		return chars;
	}

	/** Parses the mustache-style (double braces) template to get the collection of params */
	public static parse(template: string, noBraces?: boolean) {
		const params = template.match(/{{([^{}]*)}}/g);
		return this.isTrue(noBraces)
			? params.map(param => param.match(/[\w\.]+/)[0])
			: params;
	}

	/** Formats the mustache-style (double braces) template with params */
	public static format(template: string, params: { [key: string]: any }) {
		return template.replace(/{{([^{}]*)}}/g, (str, param) => (params[param.trim()] || "").toString());
	}

	/** Gets the values as an array from a set */
	public static getArray<T>(set: Set<T>) {
		return set === undefined
			? new Array<T>()
			: set.toArray();
	}

	/** Updates the values of a set from values of an array */
	public static updateSet<T>(set: Set<T>, array: Array<T>, add: boolean = true, clearBeforeUpdating: boolean = false) {
		set = set || new Set<T>();
		if (clearBeforeUpdating) {
			set.clear();
		}
		if (array !== undefined && array.length > 0) {
			array.forEach(value => {
				if (add) {
					set.add(value);
				}
				else {
					set.remove(value);
				}
			});
		}
		return set;
	}

	/** Converts the array to a set */
	public static toSet<T>(array: Array<T>) {
		const set = new Set<T>();
		if (array !== undefined && array.length > 0) {
			array.forEach(value => set.add(value));
		}
		return set;
	}

	/** Stringifys the JSON and encode as base64-url */
	public static toBase64Url(json: any) {
		return this.isObject(json, true)
			? AppCrypto.urlEncode(JSON.stringify(json))
			: "";
	}

	/** Converts the string/object to an array of strings/key-value pair/value of objects' properties */
	public static toArray(obj: any, separator?: any): Array<string> | Array<any> | Array<{ key: string, value: any }> {
		if (this.isArray(obj)) {
			return obj as Array<any>;
		}
		else if (this.isNotEmpty(obj)) {
			const array = this.indexOf(obj as string, this.isNotEmpty(separator) ? separator : ",") > 0
				? (obj as string).split(this.isNotEmpty(separator) ? separator : ",")
				: [obj as string];
			return array.map(element => this.isNotEmpty(element) ? element.trim() : "");
		}
		else if (this.isObject(obj, true)) {
			if (this.isTrue(separator)) {
				return Object.keys(obj).map(name => {
					return {
						key: name,
						value: obj[name]
					};
				});
			}
			else {
				return Object.keys(obj).map(name => obj[name]);
			}
		}
		else {
			return [obj];
		}
	}

	/** Converts and joins the array of objects to a string */
	public static toStr(array: Array<any>, separator?: string) {
		if (!this.isArray(array, true)) {
			return "";
		}
		let string = "";
		array.forEach(item => string += (string !== "" ? (separator || "") : "") + item.toString());
		return string;
	}

	/** Converts object to integer */
	public static toInt(value: any) {
		return this.isNotEmpty(value)
			? parseInt(value, 0)
			: 0;
	}

	/**
	 * Converts date-time object to ISO 8601 date time string to use with date-picker
	 * @param date the date value to convert
	 * @param seconds true to include the value of seconds
	 * @param miliseconds true to include the value of mili-seconds
	 * @param useLocalTimezone true to use local time zone
	*/
	public static toIsoDateTime(date: string | number | Date, seconds: boolean = false, miliseconds: boolean = false, useLocalTimezone: boolean = true) {
		const datetime = new Date(date);
		if (useLocalTimezone) {
			const timeOffsetInHours = (datetime.getTimezoneOffset() / 60) * (-1);
			datetime.setHours(datetime.getHours() + timeOffsetInHours);
		}
		let isoDateTime = datetime.toJSON().replace("Z", "");
		if (miliseconds) {
			return isoDateTime;
		}
		isoDateTime = isoDateTime.substr(0, 19);
		return seconds ? isoDateTime : isoDateTime.substr(0, 16);
	}

	/** Converts date-time object to ISO 8601 date string to use with date-picker */
	public static toIsoDate(date: string | number | Date) {
		return date === undefined || "-" === date
			? undefined
			: this.toIsoDateTime(date, true, true).substr(0, 10);
	}

	/** Converts the ANSI string to a string that can use in an URI */
	public static toURI(input?: string): string {
		if (!this.isNotEmpty(input) || input.trim() === "") {
			return "";
		}

		let result = input.trim();
		result = result.replace(/\s/g, "-").replace(/\&/g, "").replace(/\?/g, "");
		result = result.replace(/\+/g, "").replace(/\//g, "-").replace(/\'/g, "");
		result = result.replace(/\\/g, "-").replace(/\=/g, "").replace(/\,/g, "").replace(/\./g, "-");
		result = result.replace(/\(/g, "").replace(/\)/g, "").replace(/\#/g, "").replace(/\%/g, "");
		result = result.replace(/\`/g, "").replace(/\!/g, "").replace(/\@/g, "").replace(/\$/g, "");
		result = result.replace(/\>/g, "").replace(/\</g, "").replace(/\{/g, "").replace(/\}/g, "");
		result = result.replace(/\[/g, "").replace(/\]/g, "").replace(/\*/g, "").replace(/\^/g, "");
		result = result.replace(/\:/g, "").replace(/\;/g, "").replace(/\|/g, "").replace(/\"/g, "");
		result = result.replace(/\_\-\_/g, "-").replace(/\-\_\-/g, "-").replace(/\-\-\-/g, "-").replace(/\-\-/g, "-");
		return result.toLowerCase();
	}

	/** Converts the Vietnamese string to ANSI string */
	public static toANSI(input?: string, asURI?: boolean): string {
		if (!this.isNotEmpty(input) || input.trim() === "") {
			return "";
		}

		let result = input.trim();

		// a A
		result = result.replace(/\u00E1/g, "a");
		result = result.replace(/\u00C1/g, "A");
		result = result.replace(/\u00E0/g, "a");
		result = result.replace(/\u00C0/g, "A");
		result = result.replace(/\u1EA3/g, "a");
		result = result.replace(/\u1EA2/g, "A");
		result = result.replace(/\u00E3/g, "a");
		result = result.replace(/\u00C3/g, "A");
		result = result.replace(/\u1EA1/g, "a");
		result = result.replace(/\u1EA0/g, "A");

		result = result.replace(/\u0103/g, "a");
		result = result.replace(/\u0102/g, "A");
		result = result.replace(/\u1EAF/g, "a");
		result = result.replace(/\u1EAE/g, "A");
		result = result.replace(/\u1EB1/g, "a");
		result = result.replace(/\u1EB0/g, "A");
		result = result.replace(/\u1EB3/g, "a");
		result = result.replace(/\u1EB2/g, "A");
		result = result.replace(/\u1EB5/g, "a");
		result = result.replace(/\u1EB4/g, "A");
		result = result.replace(/\u1EB7/g, "a");
		result = result.replace(/\u1EB6/g, "A");

		result = result.replace(/\u00E2/g, "a");
		result = result.replace(/\u00C2/g, "A");
		result = result.replace(/\u1EA5/g, "a");
		result = result.replace(/\u1EA4/g, "A");
		result = result.replace(/\u1EA7/g, "a");
		result = result.replace(/\u1EA6/g, "A");
		result = result.replace(/\u1EA9/g, "a");
		result = result.replace(/\u1EA8/g, "A");
		result = result.replace(/\u1EAB/g, "a");
		result = result.replace(/\u1EAA/g, "A");
		result = result.replace(/\u1EAD/g, "a");
		result = result.replace(/\u1EAC/g, "A");

		// e E
		result = result.replace(/\u00E9/g, "e");
		result = result.replace(/\u00C9/g, "E");
		result = result.replace(/\u00E8/g, "e");
		result = result.replace(/\u00C8/g, "E");
		result = result.replace(/\u1EBB/g, "e");
		result = result.replace(/\u1EBA/g, "E");
		result = result.replace(/\u1EBD/g, "e");
		result = result.replace(/\u1EBC/g, "E");
		result = result.replace(/\u1EB9/g, "e");
		result = result.replace(/\u1EB8/g, "E");

		result = result.replace(/\u00EA/g, "e");
		result = result.replace(/\u00CA/g, "E");
		result = result.replace(/\u1EBF/g, "e");
		result = result.replace(/\u1EBE/g, "E");
		result = result.replace(/\u1EC1/g, "e");
		result = result.replace(/\u1EC0/g, "E");
		result = result.replace(/\u1EC3/g, "e");
		result = result.replace(/\u1EC2/g, "E");
		result = result.replace(/\u1EC5/g, "e");
		result = result.replace(/\u1EC4/g, "E");
		result = result.replace(/\u1EC7/g, "e");
		result = result.replace(/\u1EC6/g, "E");

		// i I
		result = result.replace(/\u00ED/g, "i");
		result = result.replace(/\u00CD/g, "I");
		result = result.replace(/\u00EC/g, "i");
		result = result.replace(/\u00CC/g, "I");
		result = result.replace(/\u1EC9/g, "i");
		result = result.replace(/\u1EC8/g, "I");
		result = result.replace(/\u0129/g, "i");
		result = result.replace(/\u0128/g, "I");
		result = result.replace(/\u1ECB/g, "i");
		result = result.replace(/\u1ECA/g, "I");

		// o O
		result = result.replace(/\u00F3/g, "o");
		result = result.replace(/\u00D3/g, "O");
		result = result.replace(/\u00F2/g, "o");
		result = result.replace(/\u00D2/g, "O");
		result = result.replace(/\u1ECF/g, "o");
		result = result.replace(/\u1ECE/g, "O");
		result = result.replace(/\u00F5/g, "o");
		result = result.replace(/\u00D5/g, "O");
		result = result.replace(/\u1ECD/g, "o");
		result = result.replace(/\u1ECC/g, "O");

		result = result.replace(/\u01A1/g, "o");
		result = result.replace(/\u01A0/g, "O");
		result = result.replace(/\u1EDB/g, "o");
		result = result.replace(/\u1EDA/g, "O");
		result = result.replace(/\u1EDD/g, "o");
		result = result.replace(/\u1EDC/g, "O");
		result = result.replace(/\u1EDF/g, "o");
		result = result.replace(/\u1EDE/g, "O");
		result = result.replace(/\u1EE1/g, "o");
		result = result.replace(/\u1EE0/g, "O");
		result = result.replace(/\u1EE3/g, "o");
		result = result.replace(/\u1EE2/g, "O");

		result = result.replace(/\u00F4/g, "o");
		result = result.replace(/\u00D4/g, "O");
		result = result.replace(/\u1ED1/g, "o");
		result = result.replace(/\u1ED0/g, "O");
		result = result.replace(/\u1ED3/g, "o");
		result = result.replace(/\u1ED2/g, "O");
		result = result.replace(/\u1ED5/g, "o");
		result = result.replace(/\u1ED4/g, "O");
		result = result.replace(/\u1ED7/g, "o");
		result = result.replace(/\u1ED6/g, "O");
		result = result.replace(/\u1ED9/g, "o");
		result = result.replace(/\u1ED8/g, "O");

		// u U
		result = result.replace(/\u00FA/g, "u");
		result = result.replace(/\u00DA/g, "U");
		result = result.replace(/\u00F9/g, "u");
		result = result.replace(/\u00D9/g, "U");
		result = result.replace(/\u1EE7/g, "u");
		result = result.replace(/\u1EE6/g, "U");
		result = result.replace(/\u0169/g, "u");
		result = result.replace(/\u0168/g, "U");
		result = result.replace(/\u1EE5/g, "u");
		result = result.replace(/\u1EE4/g, "U");

		result = result.replace(/\u01B0/g, "u");
		result = result.replace(/\u01AF/g, "U");
		result = result.replace(/\u1EE9/g, "u");
		result = result.replace(/\u1EE8/g, "U");
		result = result.replace(/\u1EEB/g, "u");
		result = result.replace(/\u1EEA/g, "U");
		result = result.replace(/\u1EED/g, "u");
		result = result.replace(/\u1EEC/g, "U");
		result = result.replace(/\u1EEF/g, "u");
		result = result.replace(/\u1EEE/g, "U");
		result = result.replace(/\u1EF1/g, "u");
		result = result.replace(/\u1EF0/g, "U");

		// y Y
		result = result.replace(/\u00FD/g, "y");
		result = result.replace(/\u00DD/g, "Y");
		result = result.replace(/\u1EF3/g, "y");
		result = result.replace(/\u1EF2/g, "Y");
		result = result.replace(/\u1EF7/g, "y");
		result = result.replace(/\u1EF6/g, "Y");
		result = result.replace(/\u1EF9/g, "y");
		result = result.replace(/\u1EF8/g, "Y");
		result = result.replace(/\u1EF5/g, "y");
		result = result.replace(/\u1EF4/g, "Y");

		// d D
		result = result.replace(/\u00D0/g, "D");
		result = result.replace(/\u0110/g, "D");
		result = result.replace(/\u0111/g, "d");

		// spaces
		result = result.replace(/\s\s+/g, " ");

		return this.isTrue(asURI)
			? this.toURI(result)
			: result.trim();
	}

}
