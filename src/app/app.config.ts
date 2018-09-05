import { AppCrypto } from "./components/app.crypto";
import { AppUtility } from "./components/app.utility";
import { Account } from "./models/account";

/** Configuration of the app */
export class AppConfig {
	/** URIs of the remote API and resources */
	public static URIs = {
		/** URI of the remote API */
		apis: "https://apis.vieapps.net/",

		/** URI of the remote HTTP Files service */
		files: "https://fs.vieapps.net/",

		/** URI to perform activation (on the web) */
		activations: "https://books.vieapps.net/"
	};

	/** Settings of the app */
	public static app = {
		id: "ngx-books",
		name: "VIEApps NGX Books",
		version: "1.0.0-beta",
		mode: "",
		platform: "",
		os: "",
		service: "books",
		services: "system,users,books,libraries,marketplaces",
		debug: true,
		offline: false
	};

	/** Session information */
	public static session = {
		id: undefined as string,
		token: undefined as any,
		account: undefined as Account,
		keys: undefined as any,
		device: "",
		captcha: {
			code: "",
			uri: ""
		}
	};

	/** Settings for working with user accounts */
	public static accountRegistrations = {
		registrable: true,
		excluded: ["Gender", "BirthDay", "Mobile", "Address"],
		required: ["Gender", "BirthDay", "Mobile", "Address"],
		sendInvitationRole: "All",
		setPrivilegsRole: "ServiceAdministrator"
	};

	/** Geographic meta */
	public static geoMeta = {
		country: "VN",
		countries: new Array<{ name: string, code: string, code3: string }>(),
		provinces: {} as {
			[key: string]: {
				code: string,
				name: string,
				title: string,
				provinces: Array<{
					code: string,
					name: string,
					title: string,
					counties: Array<{
						code: string,
						name: string,
						type: string,
						title: string
					}>
				}>
			}
		}
	};

	/** App options */
	public static options = {
		i18n: "vi-VN",
		extras: {} as { [key: string]: any }
	};

	/** Gets the related information of url (stack, host, ...) */
	public static url = {
		stack: new Array<{
			url: string,
			params: { [key: string]: any }
		}>(),
		home: "/home",
		base: undefined as string,
		host: undefined as string,
		redirectToWhenReady: undefined as string
	};

	/** Tracking information */
	public static tracking = {
		google: ["UA-3060572-8"],
		facebook: new Array<string>(),
		domains: ["viebooks.net", "books.vieapps.net", "books.vieapps.com"],
	};

	/** Facebook integration */
	public static facebook = {
		id: undefined as string,
		token: undefined as string,
		url: undefined as string,
		version: "v3.1",
	};

	public static refer = {
		id: undefined as string,
		section: undefined as string
	};

	/** Gets the extra configuration */
	public static extras: {
		[key: string]: any
	} = {};

	/** Gets the state that determines the app is ready to go */
	public static get isReady() {
		return AppUtility.isObject(this.session.keys, true) && AppUtility.isObject(this.session.token, true);
	}

	/** Gets the state that determines the current account is authenticated or not */
	public static get isAuthenticated() {
		return this.isReady && AppUtility.isNotEmpty(this.session.token.uid);
	}

	/** Gets the state that determines is native app */
	public static get isNativeApp() {
		return "NTA" === this.app.mode;
	}

	/** Gets the state that determines is web progressive app */
	public static get isWebApp() {
		return "PWA" === this.app.mode;
	}

	/** Gets the state that determines the app is running on iOS (native or web browser) */
	public static get isRunningOnIOS() {
		return this.app.platform.startsWith("iOS");
	}

	/** Gets the state that determines the app is running in debug mode */
	public static get isDebug() {
		return this.app.debug;
	}

	/** Gets the state that determines the app is running in offline mode */
	public static get isOffline() {
		return this.app.offline;
	}

	/** Gets the globalization for working with the app */
	public static get globalization() {
		const lang = (this.session.account !== undefined && this.session.account.profile !== undefined ? this.session.account.profile.Language : undefined) || this.options.i18n;
		return {
			culture: lang,
			language: lang.substr(0, 2),
			locale: lang.replace("-", "_")
		};
	}

	/** Gets the query with related service, culture language and host */
	public static getRelatedQuery(service?: string) {
		service = service || this.app.service;
		return (AppUtility.isNotEmpty(service) ? "related-service=" + service + "&" : "") + "language=" + this.globalization.culture + "&host=" + this.url.host;
	}

	/** Gets the authenticated headers (JSON) for making requests to APIs */
	public static getAuthenticatedHeaders(addToken: boolean = true, addAppInfo: boolean = true, addDeviceID: boolean = true) {
		const headers: {
			[key: string]: string
		} = {};

		if (addToken && AppUtility.isObject(this.session.token, true) && AppUtility.isObject(this.session.keys, true) && AppUtility.isNotEmpty(this.session.keys.jwt)) {
			headers["x-app-token"] = AppCrypto.jwtEncode(this.session.token, this.session.keys.jwt);
		}

		if (addAppInfo) {
			headers["x-app-name"] = this.app.name;
			headers["x-app-platform"] = this.app.platform;
		}

		if (addDeviceID && AppUtility.isNotEmpty(this.session.device)) {
			headers["x-device-id"] = this.session.device;
		}

		return headers;
	}

	/** Gets the captcha headers (JSON) for making requests to APIs */
	public static getCaptchaHeaders(captcha: string) {
		return {
			"x-captcha": "true",
			"x-captcha-registered": AppCrypto.aesEncrypt(this.session.captcha.code),
			"x-captcha-input": AppCrypto.aesEncrypt(captcha)
		};
	}

}
