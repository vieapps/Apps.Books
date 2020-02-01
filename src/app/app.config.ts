import { AppCrypto } from "./components/app.crypto";
import { AppUtility } from "./components/app.utility";
import { Account } from "./models/account";
import vi_VN from "@angular/common/locales/vi";
import en_US from "@angular/common/locales/en";

/** Configuration of the app */
export class AppConfig {

	/** URIs of the remote API and related resources */
	public static URIs = {
		/** APIs */
		apis: "https://apis.vieapps.net/",

		/** Real-time Updater */
		updates: "https://rt.vieapps.net/",

		/** Files HTTP service */
		files: "https://fs.vieapps.net/",

		/** URI to perform activation (on the web) */
		activations: "https://viebooks.net/"
	};

	/** Information of the app */
	public static app = {
		id: "vieapps-ngx-books",
		name: "VIEApps NGX Books",
		description: "Online Books from VIEApps.net",
		version: "1.3.0",
		copyright: "© 2016 - 2020 VIEApps.net",
		license: "Apache-2.0",
		frameworks: "ionic 4.11 - angular 8.2 - cordova 9.0",
		homepage: "https://viebooks.net",
		mode: "",
		platform: "",
		os: "",
		shell: "",
		persistence: true,
		debug: false,
		offline: false
	};

	/** Session information */
	public static session = {
		id: undefined as string,
		token: undefined as any,
		account: undefined as Account,
		keys: {
			jwt: undefined as string,
			aes: {
				key: undefined as string,
				iv: undefined as string
			},
			rsa: {
				exponent: undefined as string,
				modulus: undefined as string
			}
		},
		device: "",
		captcha: {
			code: "",
			uri: ""
		}
	};

	/** Services in the app */
	public static services = {
		active: "books",
		all: [
			{
				name: "books",
				objects: ["book", "category", "statistic"]
			}
		] as Array<{ name: string, objects: Array<string> }>
	};

	/** Available organizations in the app */
	public static organizations = {
		all: new Array<string>(),
		current: ""
	};

	/** User account registrations */
	public static accountRegistrations = {
		registrable: true,
		required: ["Gender", "BirthDay", "Address", "Addresses", "Mobile"],
		hidden: ["Gender", "BirthDay", "Address", "Addresses", "Mobile"],
		sendInvitationRole: "Authenticated",
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

	/** Options of the app */
	public static options = {
		i18n: "vi-VN",
		theme: "light",
		timezone: +7.00,
		extras: {} as { [key: string]: any }
	};

	/** Information for working with url (stack, host, ...) */
	public static url = {
		stack: new Array<{
			url: string,
			params: { [key: string]: any }
		}>(),
		home: "/home",
		base: undefined as string,
		host: undefined as string,
		routerParams: undefined as { [key: string]: any },
		redirectToWhenReady: undefined as string,
		users: {
			login: "/users/login",
			register: "/users/register",
			profile: "/users/profile",
			list: "/users/list"
		},
		tabs: {
			previous: undefined as string,
			current: undefined as string
		}
	};

	/** Tracking information */
	public static tracking = {
		google: ["UA-3060572-8"],
		facebook: new Array<string>(),
		domains: ["viebooks.net"],
	};

	/** Facebook integration */
	public static facebook = {
		id: undefined as string,
		token: undefined as string,
		url: undefined as string,
		version: "v3.1",
	};

	/** Refer informaion */
	public static refer = {
		id: undefined as string,
		section: undefined as string
	};

	/** Extra configuration */
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

	/** Gets the language for working with the app */
	public static get language() {
		return this.session.account !== undefined && this.session.account.profile !== undefined
			? this.session.account.profile.Language || this.options.i18n
			: this.options.i18n;
	}

	/** Gets the available languages for working with the app */
	public static get languages() {
		return [
			{
				Value: "en-US",
				Label: "English"
			},
			{
				Value: "vi-VN",
				Label: "Tiếng Việt"
			}
		];
	}

	/** Gets the locale code for working with i18n globalization */
	public static get locale() {
		return this.language.replace("-", "_");
	}

	/** Gets the available locales for working with the app */
	public static get locales() {
		return this.languages.map(language => language.Value.replace("-", "_"));
	}

	/** Gets the locale data for working with i18n globalization */
	public static getLocaleData(locale: string) {
		switch (locale || this.locale) {
			case "vi_VN":
				return vi_VN;
			default:
				return en_US;
		}
	}

	/** Gets the JSON query with related service, culture language and host */
	public static getRelatedJson(service?: string, additional?: { [key: string]: string }) {
		const json: { [key: string]: string } = {
			"language": this.language,
			"host": this.url.host,
			"related-service": AppUtility.isNotEmpty(service) ? service : this.services.active
		};
		if (AppUtility.isObject(additional, true)) {
			Object.keys(additional).forEach(key => json[key] = additional[key]);
		}
		return json;
	}

	/** Gets the query with related service, culture language and host */
	public static getRelatedQuery(service?: string) {
		return AppUtility.getQueryOfJson(this.getRelatedJson(service));
	}

	/** Gets the authenticated headers (JSON) for making requests to APIs */
	public static getAuthenticatedHeaders(addToken: boolean = true, addAppInfo: boolean = true, addDeviceID: boolean = true) {
		const headers: { [header: string]: string } = {};

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
		} as { [header: string]: string };
	}

}
