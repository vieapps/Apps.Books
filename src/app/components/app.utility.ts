import { Response } from "@angular/http";
import { List } from "linqts";
import { AppConfig } from "../app.config";
import { AppCrypto } from "./app.crypto";

/** Servicing component for working with app */
export class AppUtility {

	private static _exceptions: Array<string> = [
		"UnauthorizedException", "AccessDeniedException",
		"SessionNotFoundException", "SessionExpiredException", "SessionInformationRequiredException", "InvalidSessionException",
		"TokenNotFoundException", "TokenExpiredException", "TokenRevokedException", "InvalidTokenException", "InvalidTokenSignatureException"
	];
	private static _counties: any = {};

	/** Checks to see the object is boolean and equals to true */
	public static isTrue(obj?: any): boolean {
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
		return obj instanceof Array && (this.isTrue(notNull) ? obj !== undefined && obj !== null : true);
	}

	/** Checks to see the object is date or not */
	public static isDate(obj?: any) {
		return obj instanceof Date;
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
	public static isNotEmpty(obj?: string) {
		return this.isNotNull(obj) && typeof obj === "string" && obj.trim() !== "";
	}

	/** Gets the state that determines the emai address is valid or not */
	public static isValidEmail(email?: string) {
		const atPos = this.isNotEmpty(email) ? email.indexOf("@") : -1;
		const dotPos = this.isNotEmpty(email) ? email.indexOf(".", atPos + 1) : -1;
		return atPos > 0 && dotPos > atPos;
	}

	/** Checks the error to see that is security exception or not */
	public static isGotSecurityException(error?: any) {
		return this.isObject(error, true) && this.isNotEmpty(error.Type)
			? new List(this._exceptions).FirstOrDefault(e => e === error.Type) !== undefined
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
			? error.Type === "InformationInvalidException" && error.Message.indexOf("Captcha code is invalid") > -1
			: false;
	}

	/**
	 * Copys data from the source (object or JSON) into the objects" properties
	 * @param source The source (object or JSON) to copy data from
	 * @param obj The instance of an object to copy data into
	 * @param onPreCompleted The handler to run when copying process is completed
	*/
	public static copy(source: any, obj: any, onPreCompleted?: (data: any) => void) {
		try {
			const data = this.isNotEmpty(source)
				? JSON.parse(source)
				: this.isObject(source, true)
					? source
					: {};

			for (const name in data) {
				const type = typeof obj[name];
				if (type !== "undefined" && type !== "function") {
					obj[name] = this.isDate(obj[name])
						? new Date(data[name])
						: data[name];
				}
			}

			if (onPreCompleted !== undefined) {
				onPreCompleted(data);
			}
		}
		catch (e) {
			console.error("[Utility]: Error occurred while copying object", e, source);
		}
	}

	/**
	  * Clones the object (means do stringify the source object and re-parse via JSON
	  * @param source The source object for cloning
	  * @param beRemoved The array of attributes of the cloning object to be removed before returing
	*/
	public static clone(source?: any, beRemoved?: Array<string>): any {
		const exists = [];
		const json = JSON.stringify(source, (key: string, value: any) => {
			if (this.isObject(value, true)) {
				if (exists.indexOf(value) !== -1) {
					return;
				}
				exists.push(value);
			}
			return value;
		});
		const obj = JSON.parse(json);
		if (this.isArray(beRemoved, true)) {
			beRemoved.forEach(a => delete obj[a]);
		}
		return obj;
	}

	/**
	 * Cleans null and undefined properties from the object
	 * @param instance The instance of an object to process
	 * @param onPreCompleted The handler to run when cleaning process is completed
	*/
	public static clean(instance: any, onPreCompleted?: (obj: any) => void) {
		const properties = Object.getOwnPropertyNames(instance);
		for (const property of properties) {
			if (this.isNull(instance[property])) {
				delete instance[property];
			}
			else if (this.isObject(instance[property])) {
				this.clean(instance[property]);
				if (Object.getOwnPropertyNames(instance[property]).length < 1) {
					delete instance[property];
				}
			}
		}
		if (onPreCompleted !== undefined) {
			onPreCompleted(instance);
		}
		return instance;
	}

	/** Gets the position of the sub-string in the string */
	public static indexOf(str: string, substr: string, start?: number) {
		return this.isNotEmpty(str) && this.isNotEmpty(substr)
			? str.indexOf(substr, start)
			: -1;
	}

	/** Finds the index of an item in the sequence base on a predicate */
	public static find<T>(items: Array<T>, predicate: (item: T) => boolean): number {
		for (let index = 0; index < items.length; index++) {
			if (predicate(items[index])) {
				return index;
			}
		}
		return -1;
	}

	/** Removes items in the sequence base on number that count from end */
	public static splice<T>(items: Array<T>, number?: number) {
		number = number || 1;
		const index = items.length - number;
		if (index > 0 && index < items.length) {
			items.splice(index, number);
		}
	}

	/** Gets the query of JSON */
	public static getQueryOfJson(json: any): string {
		let query = "";
		try {
			if (this.isObject(json, true)) {
				for (const name in json) {
					query += `${name}=${encodeURIComponent(json[name])}&`;
				}
			}
		}
		catch { }
		return query !== ""
			? query.substr(0, query.length - 1)
			: "";
	}

	/** Gets the JSON of a query param (means decode by Base64Url and parse to JSON) */
	public static getJsonOfQuery(value: string): any {
		try {
			return this.isNotEmpty(value)
				? JSON.parse(AppCrypto.urlDecode(value))
				: {};
		}
		catch (e) {
			return {};
		}
	}

	/** Gets the array of objects with random scoring number (for ordering) */
	public static getTopScores(objects: Array<any>, take?: number, excluded?: string, dontAddRandomScore?: boolean, nameOfRandomScore?: string) {
		dontAddRandomScore = dontAddRandomScore !== undefined
			? dontAddRandomScore
			: false;
		nameOfRandomScore = nameOfRandomScore !== undefined
			? nameOfRandomScore
			: "Score";

		let list = new List(objects);
		if (excluded !== undefined) {
			list = list.Where(o => excluded !== o.ID);
		}
		list = list.Select(o => {
			const i = this.clone(o);
			if (this.isFalse(dontAddRandomScore)) {
				i[nameOfRandomScore] = Math.random();
			}
			return i;
		});
		if (this.isFalse(dontAddRandomScore)) {
			list = list.OrderByDescending(o => o[nameOfRandomScore]);
		}
		if (take !== undefined) {
			list = list.Take(take);
		}
		return list.ToArray();
	}

	/** Gets the listing of counties of a specified country */
	public static getCounties(country?: string) {
		country = this.isNotEmpty(country)
			? country
			: AppConfig.meta.country;
		if (!this._counties[country]) {
			const theCounties: Array<any> = [];
			(AppConfig.meta.provinces[country] ? AppConfig.meta.provinces[country].provinces as Array<any> : []).forEach(p => {
				(p.counties as Array<any>).forEach(c => {
					theCounties.push({
						county: c.title,
						province: p.title,
						country: country,
						title: c.title + ", " + p.title + ", " + country,
						titleANSI: this.toANSI(c.title + ", " + p.title + ", " + country)
					});
				});
			});
			this._counties[country] = theCounties;
		}
		return this._counties[country] as Array<any>;
	}

	/** Initializes an address for working with type-a-head */
	public static initializeAddress(address?: any): { current: any, addresses: Array<any> } {
		const info = {
			addresses: this.getCounties(),
			current: undefined
		};

		address = this.isObject(address, true)
			? {
					county: this.isNotEmpty(address.county) ? address.county : this.isNotEmpty(address.County) ? address.County : "",
					province: this.isNotEmpty(address.province) ? address.province : this.isNotEmpty(address.Province) ? address.Province : "",
					country: this.isNotEmpty(address.country) ? address.country : this.isNotEmpty(address.Country) ? address.Country : ""
				}
			: {
					county: "",
					province: "",
					country: ""
				};

		info.current = address.county === "" && address.province === "" && address.country === ""
			? undefined
			: new List(info.addresses).FirstOrDefault(a => a.county === address.county && a.province === address.province && a.country === address.country);

		return info;
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

	/** Parses the error */
	public static parseError(error: any) {
		try {
			return error !== undefined && error instanceof Response
				? error.json()
				: error;
		}
		catch (e) {
			return error;
		}
	}

	/** Shows the error to console (and run next action) */
	public static showError(message: string, error: any, next?: (error?: any) => void) {
		error = this.parseError(error);
		if (AppUtility.isObject(error, true) && error.Type && error.Message) {
			console.error(message + " => [" + error.Type + "]: " + error.Message + "\n" + "Correlation ID: " + error.CorrelationID);
			if (next !== undefined) {
				next(error);
			}
		}
		else {
			console.error(message, error);
			if (next !== undefined) {
				next(error);
			}
		}
	}

	/** Gets all the available characters (0 and A-Z) */
	public static getChars() {
		const chars = new Array<string>("0");
		for (let code = 65; code < 91; code++) {
			chars.push(String.fromCharCode(code));
		}
		return chars;
	}

	/** Gets the culture language for working with UI */
	public static getLanguage() {
		return this.isNotNull(AppConfig.session.account) && this.isNotNull(AppConfig.session.account.profile)
			? AppConfig.session.account.profile.Language
			: AppConfig.app.language;
	}

	/** Stringifys the JSON and encode as base64-url */
	public static toBase64Url(json: any) {
		return this.isObject(json, true)
			? AppCrypto.urlEncode(JSON.stringify(json))
			: "";
	}

	/** Splits the string into the array of strings */
	public static toArray(obj: any, separator?: any): Array<string> | Array<any> | Array<{ name: string, value: any }> {
		if (this.isArray(obj)) {
			return obj as Array<any>;
		}
		else if (this.isNotEmpty(obj)) {
			const array = this.indexOf(obj as string, this.isNotEmpty(separator) ? separator : ",") > 0
				? (obj as string).split(separator || ",")
				: [obj as string];
			return array.map(element => this.isNotEmpty(element) ? element.trim() : "");
		}
		else if (this.isObject(obj, true)) {
			if (this.isTrue(separator)) {
				return Object.keys(obj).map(name => {
					return {
						name: name,
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

	/** Converts object to integer */
	public static toInt(value: any) {
		return this.isNotEmpty(value)
			? parseInt(value, 0)
			: 0;
	}

	/** Converts the Vietnamese string to ANSI string */
	public static toANSI(input?: string): string {
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

		// double spaces
		result = result.replace(/\s\s/g, " ");

		return result.trim();
	}
}
