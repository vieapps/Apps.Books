import { AppCrypto } from "@components/app.crypto";
import { AppUtility } from "@components/app.utility";
import { Account } from "@models/account";
import vi_VN from "@angular/common/locales/vi";
import en_US from "@angular/common/locales/en";

/** Configuration of the app */
export class AppConfig {

	/** URIs of the remote API and related resources */
	public static URIs = {
		/** APIs */
		apis: "https://apis.vieapps.net/",

		/** Real-time Updater (if not provided, then use the APIs) */
		updates: undefined as string,

		/** Files HTTP service */
		files: "https://fs.vieapps.net/",

		/** Portals HTTP service */
		portals: "https://portals.vieapps.net/",

		/** App on the web (to perform activation or other)) */
		apps: "https://viebooks.net/",

		/** Collection of all allowed embed medias (hosts/domains) */
		medias: [] as Array<string>
	};

	/** Information of the app */
	public static app = {
		name: "VIEApps NGX Books",
		description: "Free online books from VIEApps.net",
		copyright: "© VIEApps.net",
		license: "Apache-2.0",
		homepage: "https://viebooks.net",
		id: "vieapps-ngx-books",
		version: "1.9.0",
		frameworks: "ionic 5.3 - angular 8.2 - cordova 10.0",
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
			aes: {
				key: undefined as string,
				iv: undefined as string
			},
			rsa: {
				encryptionExponent: undefined as string,
				decryptionExponent: undefined as string,
				exponent: undefined as string,
				modulus: undefined as string
			},
			jwt: undefined as string
		},
		device: "",
		captcha: {
			code: "",
			uri: ""
		}
	};

	/** Services in the app */
	public static services = {
		active: "Books",
		activeID: "",
		all: [
			{
				name: "Books",
				objects: ["Book", "Category", "Statistic"]
			}
		] as Array<{ name: string, objects: Array<string> }>
	};

	/** User account registrations */
	public static accountRegistrations = {
		registrable: true,
		required: ["Gender", "BirthDay", "Address", "Addresses", "Mobile"],
		hidden: ["Gender", "BirthDay", "Address", "Addresses", "Mobile"],
		sendInvitationRole: "Authenticated",
		setServicePrivilegs: true,
		setServicePrivilegsRole: "ServiceAdministrator",
		setObjectPrivilegs: false
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
		stack: [] as Array<{ url: string, params: { [key: string]: any } }>,
		home: "/home",
		base: undefined as string,
		host: undefined as string,
		routerParams: undefined as { [key: string]: any },
		redirectToWhenReady: undefined as string,
		users: {
			root: "/users",
			login: "/users/login",
			register: "/users/register",
			profile: "/users/profile",
			update: "/users/update",
			otp: "/users/otp",
			list: "/users/list",
			search: "/users/search"
		},
		tabs: {
			previous: undefined as string,
			current: undefined as string
		}
	};

	/** URLs for downloading desktop apps */
	public static get downloadURLs() {
		const baseURL = `${this.URIs.apps}releases/${this.app.name.replace(/\s/g, "%20")}`;
		return {
			Windows: `${baseURL}%20Setup%20${this.app.version}.exe`,
			Linux: `${baseURL}-${this.app.version}.AppImage`,
			macOS: `${baseURL}-${this.app.version}.dmg`
		};
	}

	/** Tracking information */
	public static tracking = {
		google: new Array<string>(),
		facebook: new Array<string>(),
		domains: [],
	};

	/** Facebook integration */
	public static facebook = {
		id: undefined as string,
		token: undefined as string,
		url: undefined as string,
		version: "v6.0",
	};

	/** Refer informaion */
	public static refer = {
		id: undefined as string,
		section: undefined as string
	};

	/** Extra configuration */
	public static extras: { [key: string]: any } = {};

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
		return AppUtility.isEquals("NTA", this.app.mode);
	}

	/** Gets the state that determines is web progressive app */
	public static get isWebApp() {
		return !this.isNativeApp && this.app.shell !== "Electron";
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
		return this.languages.map(language => language.Value).map(language => language.replace("-", "_"));
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

	/** Gets the related JSON with active/related service, culture language and host */
	public static getRelatedJson(additional?: { [key: string]: string }, service?: string, activeID?: string, onPreCompleted?: (json: any) => void) {
		const json: { [key: string]: string } = {
			"language": this.language,
			"related-service": (AppUtility.isNotEmpty(service) ? service : this.services.active).trim().toLowerCase(),
			"active-id": (AppUtility.isNotEmpty(activeID) ? activeID : this.services.activeID).trim().toLowerCase()
		};
		if (AppUtility.isObject(additional, true)) {
			Object.keys(additional).forEach(key => json[key] = additional[key]);
		}
		if (onPreCompleted !== undefined) {
			onPreCompleted(json);
		}
		return json;
	}

	/** Gets the related query with active/related service, culture language and host */
	public static getRelatedQuery(service?: string, activeID?: string, onPreCompleted?: (json: any) => void) {
		return AppUtility.getQueryOfJson(this.getRelatedJson(undefined, service, activeID, onPreCompleted));
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
