declare var FB: any;
import { ElementRef } from "@angular/core";
import { InAppBrowser } from "@ionic-native/in-app-browser/ngx";
import { Keyboard } from "@ionic-native/keyboard/ngx";
import { Clipboard } from "@ionic-native/clipboard/ngx";
import { AppConfig } from "../app.config";
import { AppCrypto } from "./app.crypto";
import { AppUtility } from "./app.utility";

/** Servicing component for working with app on a specific platform */
export class PlatformUtility {

	private static _keyboard: Keyboard;
	private static _inappBrowser: InAppBrowser;
	private static _clipboard: Clipboard;

	/** Sets the instance of device keyboard */
	public static setKeyboard(keyboard: Keyboard) {
		this._keyboard = keyboard;
	}

	/** Sets the instance of in-app browser */
	public static setInAppBrowser(inappBrowser: InAppBrowser) {
		this._inappBrowser = inappBrowser;
	}

	/** Sets the instance of app clipboard */
	public static setClipboard(clipboard: Clipboard) {
		this._clipboard = clipboard;
	}

	/**
	 * Sets time-out to run a function
	 * @param action The action to run
	 * @param defer The defer times (in miliseconds)
	 */
	public static setTimeout(action: () => void, defer?: number) {
		if (AppUtility.isNotNull(action)) {
			window.setTimeout(() => action(), defer || 0);
		}
	}

	/** Sets focus into the control */
	public static focus(control: any, defer?: number) {
		if (AppUtility.isNotNull(control)) {
			const ctrl = control instanceof ElementRef
				? (control as ElementRef).nativeElement
				: control;
			if (ctrl !== undefined && typeof ctrl.focus === "function") {
				this.setTimeout(() => {
					if (this._keyboard !== undefined) {
						this._keyboard.show();
					}
					ctrl.focus();
				}, defer || (AppConfig.isRunningOnIOS ? 456 : 234));
			}
		}
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

	/** Getst the state to determines that is Apple Safari */
	public static isSafari(userAgent?: string) {
		userAgent = userAgent || window.navigator.userAgent;
		return userAgent.indexOf("Macintosh") > 0 && userAgent.indexOf("AppleWebKit") > 0 && userAgent.indexOf("Chrome") < 0 && userAgent.indexOf("Edge") < 0;
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
				: AppConfig.URIs.files + "avatars/" + AppConfig.url.host + "-no-avatar.png";
			const email = AppUtility.isObject(data.Contact, true)
				? data.Contact.Email
				: data.Email;
			return AppUtility.isNotEmpty(email)
				? "https://secure.gravatar.com/avatar/" + AppCrypto.md5(email.toLowerCase().trim()) + "?s=300&d=" + encodeURIComponent(noAvatar)
				: noAvatar;
		}
		return avatar;
	}

	/** Opens an uri by OS/In-App browser */
	public static openURI(uri?: string) {
		if (AppUtility.isNotEmpty(uri) && (uri.startsWith("http://") || uri.startsWith("https://"))) {
			window.open(uri);
		}
	}

	/** Parses an uri */
	public static parseURI(uri?: string) {
		uri = uri || (window && window.location ? window.location.href : "vieapps://service-as-host/path?query=#?hash=");

		let scheme = "http", host = "local", relativeURI = "";

		let pos = uri.indexOf("://");
		if (pos > -1 ) {
			scheme = uri.substr(0, pos);
			pos += 3;
			const end = uri.indexOf("/", pos);
			relativeURI = uri.substr(end);
			if (scheme !== "file") {
				host = uri.substr(pos, end - pos);
			}
		}
		else {
			relativeURI = uri;
		}

		let port = "";
		pos = host.indexOf(":");
		if (pos > 0) {
			port = host.substr(pos + 1);
			host = host.substr(0, pos);
		}

		const hostnames = AppUtility.toArray(host, ".") as Array<string>;

		let path = "", query = "", hash = "";
		pos = relativeURI.indexOf("?");
		if (pos > 0) {
			path = relativeURI.substr(0, pos);
			query = relativeURI.substr(pos + 1);
			let end = relativeURI.indexOf("#");
			if (end > 0 && end < pos) {
				hash = query;
				query = "";
			}
			else if (end > 0 && end > pos) {
				end = query.indexOf("#");
				hash = query.substr(end + 1);
				query = query.substr(0, end);
			}
		}
		else {
			path = relativeURI;
		}

		while (path.endsWith("?") || path.endsWith("&") || path.endsWith("#")) {
			path = path.substr(0, path.length - 1);
		}

		const queryParams = {} as { [key: string]: string };
		while (query.startsWith("?") || query.startsWith("&")) {
			query = query.substr(1);
		}
		if (query !== "") {
			query.split("&").forEach(param => {
				const params = param.split("=");
				queryParams[params[0]] = decodeURIComponent(params[1]);
			});
		}

		const hashParams = {} as { [key: string]: string };
		while (hash.startsWith("?") || hash.startsWith("&") || hash.startsWith("#")) {
			hash = hash.substr(1);
		}
		if (hash !== "") {
			hash.split("&").forEach(param => {
				const params = param.split("=");
				hashParams[params[0]] = params[1];
			});
		}

		return {
			AbsoluteURI: uri,
			RelativeURI: relativeURI,
			HostURI: scheme + "://" + host + (port !== "" ? ":" + port : ""),
			Scheme: scheme,
			Host: host,
			HostNames: hostnames,
			Port: port,
			Path: path,
			Query: query,
			QueryParams: queryParams,
			Hash: hash,
			HashParams: hashParams
		};
	}

	/** Gets the URI for navigating */
	public static getURI(path: string, queryParams?: { [key: string]: any }) {
		const query = AppUtility.getQueryOfJson(queryParams);
		return path + (query !== "" ? "?" + query : "");
	}

	/** Gets the redirect URI for working with external */
	public static getRedirectURI(path: string, addAsRedirectParam: boolean = true) {
		const uri = this.parseURI(AppConfig.isWebApp ? window.location.href : AppConfig.URIs.activations);
		return (uri.Scheme === "file"
			? this.parseURI(AppConfig.URIs.activations).AbsoluteURI
			: uri.HostURI + AppConfig.url.base) + "?" + (AppUtility.isTrue(addAsRedirectParam) ? "redirect=" + AppCrypto.urlEncode(path) : path);
	}

	/** Gets the host name from an url */
	public static getHost(url?: string) {
		const uri = this.parseURI(url);
		if (uri.Host.indexOf(".") < 0) {
			return uri.Host;
		}
		else {
			let host = uri.HostNames[uri.HostNames.length - 2] + "." + uri.HostNames[uri.HostNames.length - 1];
			if (uri.HostNames.length > 2 && uri.HostNames[uri.HostNames.length - 3] !== "www") {
				host = uri.HostNames[uri.HostNames.length - 3] + "." + host;
			}
			if (uri.HostNames.length > 3 && uri.HostNames[uri.HostNames.length - 4] !== "www") {
				host = uri.HostNames[uri.HostNames.length - 4] + "." + host;
			}
			return host;
		}
	}

	/** Opens Google Maps by address or location via query */
	public static openGoogleMaps(info: string) {
		this.openURI("https://www.google.com/maps?q=" + encodeURIComponent(info));
	}

	/** Copies the value into clipboard */
	public static copyToClipboard(value: string) {
		if (AppConfig.isNativeApp) {
			this._clipboard.copy(value).then(
				() => {
					if (AppConfig.isDebug) {
						console.log("Clipboard copied...");
					}
				},
				error => {
					console.error(`Clipboard copy error => ${AppUtility.getErrorMessage(error)}`, JSON.stringify(error));
				}
			);
		}
		else {
			const textarea = window.document.createElement("textarea");
			textarea.style.position = "fixed";
			textarea.style.left = "0";
			textarea.style.top = "0";
			textarea.style.opacity = "0";
			textarea.value = value;
			window.document.body.appendChild(textarea);
			textarea.focus();
			textarea.select();
			window.document.execCommand("copy");
			window.document.body.removeChild(textarea);
		}
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
