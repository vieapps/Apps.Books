import { Account } from "./models/account";

/** Configuration of the app */
export class AppConfig {
	/** URIs of the remote API and resources */
	static URIs = {
		/** URI of the remote API */
		apis: "https://apis.vieapps.net/",
		// apis: "https://apis.vieapps.com/",

		/** URI of the remote HTTP Files service */
		files: "https://fs.vieapps.net/",
		// files: "https://fs.vieapps.com/",

		/** URI to perform activation (on the web) */
		activations: "https://viebooks.net/"
		// activations: "https://books.vieapps.com/"
	};

	/** Settings of the app */
	static app = {
		id: "online-books",
		name: "VIEApps Online Books",
		version: "0.9.1",
		mode: "",
		platform: "",
		os: "",
		host: "",
		language: "vi-VN",
		service: "books",
		debug: true,
		offline: false
	};

	/** Session information */
	static session = {
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
	static accountRegistrations = {
		registrable: true,
		sendInvitationRole: "All",
		setPrivilegsRole: "ServiceAdministrator"
	};

	/** Common meta data */
	static meta = {
		country: "VN",
		countries: [],
		provinces: {}
	};

	/** Tracking information */
	static tracking = {
		google: "UA-3060572-8",
		googleDomains: ["viebooks.net", "books.vieapps.net", "books.vieapps.com"],
		facebook: ""
	};

	/** Facebook integration */
	static facebook = {
		id: null,
		token: null,
		url: null,
		version: "v3.1",
	};

	static refer = {
		id: null as string,
		section: null as string
	};

	/** Gets the state that determines is native app */
	static get isNativeApp() {
		return this.app.mode === "NTA";
	}

	/** Gets the state that determines is web progressive app */
	static get isWebApp() {
		return this.app.mode === "PWA";
	}

	/** Gets the state that determines the app is running in debug mode */
	static get isDebug() {
		return this.app.debug;
	}

	/** Gets the state that determines the app is running in offline mode */
	static get isOffline() {
		return this.app.offline;
	}

	/** Gets the reading options fo the book app */
	static readingOptions = {
		font: "default",
		size: "normal",
		color: "white",
		paragraph: "one",
		align: "align-left"
	};
}
