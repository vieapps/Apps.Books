import { AppConfig } from "../app.config";
import { AppCrypto } from "./app.crypto";
import { AppUtility } from "./app.utility";

declare var FB: any;

/** Servicing component for working with app on a specific platform */
export class PlatformUtility {

	/** Prints the log message to console/log file */
	public static showLog(message: string, ...optionalParams: any[]) {
		if (optionalParams.length < 1 || (AppUtility.isArray(optionalParams[0]) && optionalParams[0].length < 1)) {
			console.log(message);
		}
		else {
			console.log(message, optionalParams);
		}
	}

	/** Prints the warning message to console/log file */
	public static showWarning(message: string, ...optionalParams: any[]) {
		if (optionalParams.length < 1 || (AppUtility.isArray(optionalParams[0]) && optionalParams[0].length < 1)) {
			console.warn(message);
		}
		else {
			console.warn(message, optionalParams);
		}
	}

	/** Prints the error to console/log file (and run next action) */
	public static showError(message: string, error: any, next?: (error?: any) => void) {
		error = AppUtility.parseError(error);
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

	/**
	 * Sets time-out to run a function
	 * @param action The action to run
	 * @param defer The defer times (in miliseconds)
	 */
	public static setTimeout(action: () => void, defer?: number) {
		if (AppUtility.isNotNull(action)) {
			window.setTimeout(() => {
				action();
			}, defer || 0);
		}
	}

	/** Gets the state that determines the app is running on Apple iOS */
	public static get isAppleOS() {
		return AppConfig.app.platform.indexOf("iOS") === 0;
	}

	/** Gets the running platform of the app */
	public static getAppPlatform(userAgent?: string) {
		userAgent = userAgent || window.navigator.userAgent;
		return /iPhone|iPad|iPod|Windows Phone|Android|BlackBerry|BB10|IEMobile|webOS|Opera Mini/i.test(userAgent)
			? /iPhone|iPad|iPod/i.test(userAgent)
				? "iOS"
				: /Windows Phone/i.test(userAgent)
					? "Windows Phone"
					: /Android/i.test(userAgent)
						? "Android"
						: /BlackBerry|BB10/i.test(userAgent)
							? "BlackBerry"
							: "Mobile"
			: "Desktop";
	}

	/** Gets the running OS platform of the app */
	public static getOSPlatform(userAgent?: string) {
		userAgent = userAgent || window.navigator.userAgent;
		const platform = this.getAppPlatform(userAgent);
		return platform !== "Desktop"
			? platform
			: /Windows/i.test(userAgent)
				? "Windows"
				: /Linux/i.test(userAgent)
					? "Linux"
					: /Macintosh/i.test(userAgent)
						? "macOS"
						: "Other";
	}

	/** Gets the avatar image */
	public static getAvatarImage(data?: any, noAvatar?: string) {
		const avatar: string = AppUtility.isObject(data, true) && AppUtility.isNotEmpty(data.Avatar)
			? data.Avatar
			: AppUtility.isObject(data, true) && AppUtility.isNotEmpty(data.Gravatar)
				? data.Gravatar
				: "";
		if (avatar === "" && AppUtility.isObject(data, true)) {
			noAvatar = AppUtility.isNotEmpty(noAvatar)
				? noAvatar
				: AppConfig.URIs.files + "avatars/" + AppConfig.app.host + "-no-avatar.png";
			const email = AppUtility.isObject(data.Contact, true)
				? data.Contact.Email
				: data.Email;
			return AppUtility.isNotEmpty(email)
				? "https://secure.gravatar.com/avatar/" + AppCrypto.md5(email.toLowerCase().trim()) + "?s=300&d=" + encodeURIComponent(noAvatar)
				: noAvatar;
		}
		return avatar;
	}

	/** Gets the current host name */
	public static get host() {
		if (AppUtility.indexOf(window.location.hostname, ".") < 0) {
			return window.location.hostname;
		}
		const info = AppUtility.toArray(window.location.hostname, ".");
		let host = info[info.length - 2] + "." + info[info.length - 1];
		if (info.length > 2 && info[info.length - 3] !== "www") {
			host = info[info.length - 3] + "." + host;
		}
		if (info.length > 3 && info[info.length - 4] !== "www") {
			host = info[info.length - 4] + "." + host;
		}
		return host;
	}

	/** Opens an uri by OS/In-App browser */
	public static openURI(uri?: string) {
		if (AppUtility.isNotEmpty(uri) && AppUtility.indexOf(uri, "http") === 0) {
			window.open(uri);
		}
	}

	/** Parses an uri */
	public static parseURI(uri?: string) {
		const parser = window.document.createElement("a");
		parser.href = uri || window.location.href;

		// convert query string to object
		const searchParams = {};
		if (parser.search !== "") {
			const queries = parser.search.replace(/^\?/, "").split("&");
			for (let index = 0; index < queries.length; index++ ) {
				const split = queries[index].split("=");
				searchParams[split[0]] = split[1];
			}
		}

		// convert hash string to object
		const hashParams = {};
		let hash = parser.hash;
		while (hash.indexOf("#") === 0 || hash.indexOf("?") === 0) {
			hash = hash.substring(1);
		}
		if (hash !== "") {
			const queries = hash.replace(/^\?/, "").split("&");
			for (let index = 0; index < queries.length; index++ ) {
				const split = queries[index].split("=");
				hashParams[split[0]] = split[1];
			}
		}

		return {
			protocol: parser.protocol + "//",
			host: parser.hostname,
			port: parser.port,
			path: parser.pathname,
			search: parser.search,
			searchParams: searchParams,
			hash: parser.hash,
			hashParams: hashParams
		};
	}

	/** Gets the URI for activating */
	public static get activateURI() {
		let url = AppConfig.URIs.activations;
		if (AppConfig.isWebApp && AppUtility.indexOf(window.location.href, "file://") < 0) {
			const uri = this.parseURI();
			url = uri.protocol + uri.host + (uri.port !== "" ? ":" + uri.port : "") + "/";
		}
		return url + "home?prego=activate&mode={mode}&code={code}";
	}

	/** Gets the CSS classes for working with label in Ionic */
	public static get labelCss() {
		return "label " + (this.isAppleOS ? "label-ios" : "label-md");
	}

	/** Gets the CSS classes for working with input control in Ionic */
	public static get inputCss() {
		return "text-input " + (this.isAppleOS ? "text-input-ios" : "text-input-md");
	}

	/** Get the button for working with action sheet */
	public static getActionButton(text: string, icon?: string, handler?: () => boolean | void, role?: string) {
		return {
			text: text,
			icon: this.isAppleOS ? undefined : icon,
			handler: handler,
			role: role
		};
	}

	/** Opens Google Maps by address or location via query */
	public static openGoogleMaps(info: string) {
		this.openURI("https://www.google.com/maps?q=" + encodeURIComponent(info));
	}

	/** Sets environments of the PWA */
	public static setPWAEnvironment(onFacebookInit?: () => void) {
		// Javascript libraries (only available when working in web browser)
		if (window.location.href.indexOf("file://") < 0) {
			// Facebook SDK
			if (AppUtility.isNotEmpty(AppConfig.facebook.id)) {
				if (!window.document.getElementById("facebook-jssdk")) {
					const js = window.document.createElement("script");
					js.id = "facebook-jssdk";
					js.async = true;
					js.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=" + AppConfig.facebook.version;

					const ref = window.document.getElementsByTagName("script")[0];
					ref.parentNode.insertBefore(js, ref);
				}
				window["fbAsyncInit"] = function () {
					FB.init({
						appId: AppConfig.facebook.id,
						channelUrl: "/assets/facebook.html",
						status: true,
						cookie: true,
						xfbml: true,
						version: AppConfig.facebook.version
					});
					if (onFacebookInit !== undefined) {
						onFacebookInit();
					}
				};
			}
		}

		// scrollbars (on Windows & Linux)
		const osPlatform = this.getOSPlatform();
		if (osPlatform === "Windows" || osPlatform === "Linux") {
			const css = window.document.createElement("style");
			css.type = "text/css";
			css.innerText = "::-webkit-scrollbar{height:14px;width:10px;background:#eee;border-left:solid1px#ddd;}::-webkit-scrollbar-thumb{background:#ddd;border:solid1px#cfcfcf;}::-webkit-scrollbar-thumb:hover{background:#b2b2b2;border:solid1px#b2b2b2;}::-webkit-scrollbar-thumb:active{background:#b2b2b2;border:solid1px#b2b2b2;}";
			const ref = window.document.getElementsByTagName("link")[0];
			ref.parentNode.insertBefore(css, ref);
		}
	}

}
