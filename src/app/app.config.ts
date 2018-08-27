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
		url: {
			previous: "",
			current: ""
		},
		debug: true,
		offline: false
	};

	/** Session information */
	public static session = {
		id: null as string,
		token: null,
		account: null as Account,
		keys: null,
		device: "",
		captcha: {
			code: "",
			uri: ""
		}
	};

	/** Settings for working with user accounts */
	public static accountRegistrations = {
		registrable: true,
		excluded: ["Gender", "BirthDay", "Mobile", "Address", "Addresses"],
		required: ["Gender", "BirthDay", "Mobile"],
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
		return this.app.platform.startsWith("iOS", 0);
	}

	/** Gets the state that determines the app is running in debug mode */
	public static get isDebug() {
		return this.app.debug;
	}

	/** Gets the state that determines the app is running in offline mode */
	public static get isOffline() {
		return this.app.offline;
	}

	/** Gets the reading options fo the book app */
	public static readingOptions = {
		font: "default",
		size: "normal",
		color: "white",
		paragraph: "one",
		align: "align-left"
	};
}
