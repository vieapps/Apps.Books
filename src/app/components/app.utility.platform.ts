declare var FB: any;
import { ElementRef } from "@angular/core";
import { Keyboard } from "@ionic-native/keyboard/ngx";
import { Clipboard } from "@ionic-native/clipboard/ngx";
import { InAppBrowser } from "@ionic-native/in-app-browser/ngx";
import { ElectronService } from "ngx-electron";
import { AppConfig } from "../app.config";
import { AppCrypto } from "./app.crypto";
import { AppUtility } from "./app.utility";

/** Servicing component for working with app on a specific platform */
export class PlatformUtility {

	private static _keyboard: Keyboard;
	private static _clipboard: Clipboard;
	private static _inappBrowser: InAppBrowser;
	private static _electronService: ElectronService;

	/** Sets the instance of device keyboard */
	public static setKeyboard(keyboard: Keyboard) {
		this._keyboard = keyboard;
	}

	/** Sets the instance of app clipboard */
	public static setClipboard(clipboard: Clipboard) {
		this._clipboard = clipboard;
	}

	/** Sets the instance of in-app browser (native app) */
	public static setInAppBrowser(inappBrowser: InAppBrowser) {
		this._inappBrowser = inappBrowser;
	}

	/** Sets the instance of Electron service (web app) */
	public static setElectronService(electronService: ElectronService) {
		this._electronService = electronService;
	}

	/**
	 * Invokes an action when time out
	 * @param action The action to invoke
	 * @param defer The defer times (in miliseconds)
	 */
	public static invoke(action: () => void, defer?: number) {
		if (AppUtility.isNotNull(action)) {
			setTimeout(() => action(), defer || 0);
		}
	}

	/**
	 * Sets focus into the control
	 * @param control The control to focus into
	 * @param defer The defer times (in miliseconds)
	 */
	public static focus(control: any, defer?: number) {
		if (AppUtility.isNotNull(control)) {
			const ctrl = control instanceof ElementRef
				? (control as ElementRef).nativeElement
				: control;
			if (ctrl !== undefined) {
				this.invoke(() => {
					if (typeof ctrl.setFocus === "function") {
						ctrl.setFocus();
					}
					else if (typeof ctrl.focus === "function") {
						ctrl.focus();
					}
					if (this._keyboard !== undefined) {
						this._keyboard.show();
					}
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
						: "Generic OS";
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

	/** Opens an uri in browser */
	public static openURI(uri?: string) {
		if (AppUtility.isNotEmpty(uri)) {
			if (this._inappBrowser !== undefined) {
				this._inappBrowser.create(uri, "_blank");
			}
			else if (this._electronService !== undefined) {
				this._electronService.shell.openExternal(uri);
			}
			else {
				window.open(uri);
			}
		}
	}

	/** Parses an uri */
	public static parseURI(uri?: string) {
		uri = uri || (window && window.location ? window.location.href : "scheme://service.as.host/path?query=#?hash=");

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
				hashParams[params[0]] = decodeURIComponent(params[1]);
			});
		}

		return {
			AbsoluteURI: uri,
			RelativeURI: relativeURI,
			HostURI: scheme + "://" + host + (port !== "" ? ":" + port : ""),
			Scheme: scheme,
			Host: host,
			HostNames: AppUtility.toArray(host, ".") as Array<string>,
			Port: port,
			Path: path,
			Paths: AppUtility.toArray(path, "/") as Array<string>,
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
		return (uri.Scheme === "file" || uri.Scheme === "ionic"
			? AppConfig.URIs.activations
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
						console.log("Clipboard copied...", value);
					}
				},
				error => {
					console.error(`Clipboard copy error => ${AppUtility.getErrorMessage(error)}`, JSON.stringify(error));
				}
			);
		}
		else {
			const parentNode = window.document.body;
			const textarea = this.appendElement({ value: value }, "textarea", parentNode) as HTMLTextAreaElement;
			textarea.style.position = "fixed";
			textarea.style.left = "0";
			textarea.style.top = "0";
			textarea.style.opacity = "0";
			textarea.focus();
			textarea.select();
			window.document.execCommand("copy");
			parentNode.removeChild(textarea);
		}
	}

	/** Prepares environments of the PWA */
	public static preparePWAEnvironment(onFacebookInit?: () => void) {
		// Facebook SDKs
		if (AppUtility.isNotEmpty(AppConfig.facebook.id) && this.parseURI().Scheme !== "file") {
			this.appendElement({
				id: "facebook-jssdk",
				async: "true",
				src: "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=" + AppConfig.facebook.version
			}, "script");
			window["fbAsyncInit"] = function() {
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

		// scrollbars (on Windows & Linux)
		if (this.getOSPlatform() !== "macOS") {
			this.appendElement({
				type: "text/css",
				innerText: "::-webkit-scrollbar,.hydrated::-webkit-scrollbar{background:#eee}"
					+ "::-webkit-scrollbar:horizontal,.hydrated::-webkit-scrollbar:horizontal{height:14px}"
					+ "::-webkit-scrollbar:vertical,.hydrated::-webkit-scrollbar:vertical{width:10px}"
					+ "::-webkit-scrollbar-thumb,.hydrated::-webkit-scrollbar-thumb{background:#ddd;border-radius:20px}"
					+ "::-webkit-scrollbar-thumb:hover,.hydrated::-webkit-scrollbar-thumb:hover,"
					+ "::-webkit-scrollbar-thumb:active,.hydrated::-webkit-scrollbar-thumb:active{background:#b2b2b2}"
			}, "style");
		}
	}

	private static appendElement(options: { [key: string]: any }, tagName: string, parentNode: HTMLElement = window.document.head) {
		const element = window.document.createElement(tagName);
		Object.keys(options).forEach(name => element[name] = options[name]);
		parentNode.appendChild(element);
		return element;
	}

}
