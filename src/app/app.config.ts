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
		id: "online-books",
		name: "VIEApps Online Books",
		version: "1.0.0-beta",
		mode: "",
		platform: "",
		os: "",
		host: "",
		language: "vi-VN",
		service: "books",
		services: "system,users,books,libraries,marketplaces",
		url: {
			previous: "",
			current: ""
		},
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
		excluded: [/*"Gender", "BirthDay", "Mobile", "Address", "Addresses"*/],
		required: ["Gender", "BirthDay", "Mobile", "Address", "Addresses"],
		sendInvitationRole: "All",
		setPrivilegsRole: "ServiceAdministrator"
	};

	/** Common meta data */
	public static meta = {
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

	/** Tracking information */
	public static tracking = {
		google: "UA-3060572-8",
		googleDomains: ["viebooks.net", "books.vieapps.net", "books.vieapps.com"],
		facebook: ""
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

	/** Gets the culture language for working with UI */
	public static get language() {
		return this.session.account !== undefined && this.session.account.profile !== undefined
			? this.session.account.profile.Language
			: this.app.language;
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
