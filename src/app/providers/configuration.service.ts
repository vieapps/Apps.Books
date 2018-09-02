declare var FB: any;
import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import { Title } from "@angular/platform-browser";
import { Platform } from "@ionic/angular";
import { Device } from "@ionic-native/device/ngx";
import { Keyboard } from "@ionic-native/keyboard/ngx";
import { AppVersion } from "@ionic-native/app-version/ngx";
import { GoogleAnalytics } from "@ionic-native/google-analytics/ngx";
import { Storage } from "@ionic/storage";
import { List } from "linqts";
import { AppConfig } from "../app.config";
import { AppCrypto } from "../components/app.crypto";
import { AppEvents } from "../components/app.events";
import { AppUtility } from "../components/app.utility";
import { PlatformUtility } from "../components/app.utility.platform";
import { TrackingUtility } from "../components/app.utility.trackings";
import { Account } from "../models/account";
import { Privilege } from "../models/privileges";
import { Base as BaseService } from "./base.service";

@Injectable()
export class ConfigurationService extends BaseService {

	constructor (
		public http: Http,
		public platform: Platform,
		public device: Device,
		public keyboard: Keyboard,
		public appVer: AppVersion,
		public googleAnalytics: GoogleAnalytics,
		public storage: Storage,
		public browserTitle: Title
	) {
		super(http, "Configuration");
		AppEvents.on("AppIsInitialized", async info => await this.loadGeoMetaAsync());
	}

	/** Gets the configuration of the app */
	public get appConfig() {
		return AppConfig;
	}

	/** Gets the state that determines the app is ready to go */
	public get isReady() {
		return this.appConfig.isReady;
	}

	/** Gets the state that determines the current account is authenticated or not */
	public get isAuthenticated() {
		return this.appConfig.isAuthenticated;
	}

	/** Gets the state that determines the app is running in debug mode or not */
	public get isDebug() {
		return this.appConfig.isDebug;
	}

	/** Gets the state that determines is web progressive app */
	public get isWebApp() {
		return this.appConfig.isWebApp;
	}

	/** Gets the state that determines the app is running on iOS (native or web browser) */
	public get isRunningOnIOS() {
		return this.appConfig.isRunningOnIOS;
	}

	private getCurrentUrl() {
		return this.appConfig.app.routes.length > 0 ? this.appConfig.app.routes[this.appConfig.app.routes.length - 1] : undefined;
	}

	/** Gets the previous url */
	private getPreviousUrl() {
		return this.appConfig.app.routes.length > 1 ? this.appConfig.app.routes[this.appConfig.app.routes.length - 2] : undefined;
	}

	/** Adds an url into stack of routes */
	public addUrl(url: string, params: { [key: string]: any }) {
		url = url.indexOf("?") > 0 ? url.substr(0, url.indexOf("?")) : url;
		if (url === "/home") {
			this.appConfig.app.routes = [];
			this.appConfig.app.routes.push({
				url: url,
				params: params
			});
		}
		else {
			const previous = this.getPreviousUrl();
			const current = this.getCurrentUrl();
			if (previous !== undefined && previous.url.startsWith(url)) {
				this.appConfig.app.routes.pop();
			}
			else if (current === undefined || !current.url.startsWith(url)) {
				this.appConfig.app.routes.push({
					url: url,
					params: params
				});
			}
			if (this.appConfig.app.routes.length > 30) {
				this.appConfig.app.routes.splice(0, this.appConfig.app.routes.length - 30);
			}
		}
	}

	private getUrl(info: { url: string, params: { [key: string]: any } }, alternativeUrl?: string) {
		return info !== undefined
			? PlatformUtility.getURI(info.url, info.params)
			: alternativeUrl || "/home";
	}

	/** Gets the current url */
	public get currentUrl() {
		return this.getUrl(this.getCurrentUrl());
	}

	/** Gets the previous url */
	public get previousUrl() {
		return this.getUrl(this.getPreviousUrl());
	}

	/** Gets the current version of the app title */
	public get appVersion() {
		return this.appConfig.app.version;
	}

	/** Sets the app title (means title of the browser) */
	public set appTitle(value: string) {
		this.browserTitle.setTitle(`${value} :: ${this.appConfig.app.name}`);
	}

	/** Gets the query with related service, language and host */
	public get relatedQuery() {
		return PlatformUtility.getRelatedQuery(this.appConfig.app.service);
	}

	/** Gets the query params of the current page/view */
	public get queryParams() {
		const current = this.getCurrentUrl();
		return current !== undefined ? current.params : {} as { [key: string]: any };
	}

	/** Gets the request params of the current page/view (means decoded JSON of 'x-request' query parameter) */
	public get requestParams() {
		return AppUtility.getJsonOfQuery(this.queryParams["x-request"]);
	}

	/** Prepare the working environments of the app */
	public async prepareAsync(onCompleted?: () => void) {
		this.appConfig.app.mode = this.platform.is("cordova") && this.device.platform !== "browser" ? "NTA" : "PWA";
		this.appConfig.app.os = PlatformUtility.getOSPlatform();

		if (this.appConfig.isNativeApp) {
			this.appConfig.app.platform = this.device.platform;
			this.appConfig.session.device = this.device.uuid + "@" + this.appConfig.app.id;
		}

		else {
			this.appConfig.app.host = PlatformUtility.host;
			this.appConfig.app.platform = this.platform.is("cordova") ? this.device.platform : undefined;
			if (!AppUtility.isNotEmpty(this.appConfig.app.platform) || this.appConfig.app.platform === "browser") {
				this.appConfig.app.platform = PlatformUtility.getAppPlatform();
			}
			this.appConfig.app.platform += " " + this.appConfig.app.mode;
		}

		if (this.platform.is("cordova")) {
			await TrackingUtility.initializeAsync(this.googleAnalytics);
			if (this.device.platform !== "browser") {
				PlatformUtility.keyboard = this.keyboard;
				this.appVer.getVersionCode()
					.then(version => this.appConfig.app.version = version as string)
					.catch(error => console.error(this.getErrorMessage("Cannot get app version", error)));
			}
		}

		await this.storage.ready();
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	/** Initializes the configuration settings of the app */
	public async initializeAsync(onNext?: (data?: any) => void, onError?: (error?: any) => void, dontInitializeSession?: boolean) {
		// prepare environment
		if (this.appConfig.app.mode === "") {
			await this.prepareAsync();
		}

		// load saved session
		if (this.appConfig.session.token === undefined || this.appConfig.session.keys === undefined) {
			await this.loadSessionAsync();
		}

		// initialize session
		if (AppUtility.isFalse(dontInitializeSession)) {
			await this.initializeSessionAsync(onNext, onError);
		}
		else if (onNext !== undefined) {
			onNext();
		}
	}

	/** Initializes the session with REST API */
	public async initializeSessionAsync(onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.readAsync(
			"users/session",
			async data => {
				await this.updateSessionAsync(data, () => {
					this.appConfig.session.account = this.getAccount(!this.isAuthenticated);
					if (this.isAuthenticated) {
						this.appConfig.session.account.id = this.appConfig.session.token.uid;
					}
					if (this.isDebug) {
						console.log(this.getLogMessage("The session is initialized by APIs"));
					}
					AppEvents.broadcast("Session", { Type: this.isAuthenticated ? "Register" : "Initialize", Info: this.appConfig.session });
					if (onNext !== undefined) {
						onNext(data);
					}
				});
			},
			error => this.showError("Error occurred while initializing the session", error, onError)
		);
	}

	/** Registers the initialized session (anonymous) with REST API */
	public async registerSessionAsync(onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.readAsync(
			`users/session?register=${this.appConfig.session.id}`,
			async () => {
				this.appConfig.session.account = this.getAccount(true);
				if (this.isDebug) {
					console.log(this.getLogMessage("The session is registered by APIs"));
				}
				AppEvents.broadcast("Session", { Type: "Register", Info: this.appConfig.session });
				await this.storeSessionAsync(onNext);
			},
			error => this.showError("Error occurred while registering the session", error, onError)
		);
	}

	/** Updates the session and stores into storage */
	public async updateSessionAsync(session: any, onCompleted?: (data?: any) => void, dontStore?: boolean) {
		if (AppUtility.isNotEmpty(session.ID)) {
			this.appConfig.session.id = session.ID;
		}

		if (AppUtility.isNotEmpty(session.DeviceID)) {
			this.appConfig.session.device = session.DeviceID;
		}

		if (AppUtility.isObject(session.Keys, true)) {
			this.appConfig.session.keys = {
				jwt: session.Keys.JWT,
				aes: {
					key: session.Keys.AES.Key,
					iv: session.Keys.AES.IV
				},
				rsa: {
					exponent: session.Keys.RSA.Exponent,
					modulus: session.Keys.RSA.Modulus
				}
			};
			AppCrypto.init(this.appConfig.session.keys);
		}

		if (AppUtility.isNotEmpty(session.Token)) {
			this.appConfig.session.token = AppCrypto.jwtDecode(session.Token, AppUtility.isObject(this.appConfig.session.keys, true) ? this.appConfig.session.keys.jwt : this.appConfig.app.name);
		}

		this.appConfig.session.account = this.getAccount(!this.isAuthenticated);
		if (this.isAuthenticated) {
			this.appConfig.session.account.id = this.appConfig.session.token.uid;
		}

		if (AppUtility.isTrue(dontStore)) {
			if (onCompleted !== undefined) {
				onCompleted(this.appConfig.session);
			}
		}
		else {
			await this.storeSessionAsync(onCompleted);
		}
	}

	/** Loads the session from storage */
	public async loadSessionAsync(onCompleted?: (data?: any) => void) {
		try {
			const session = await this.storage.get("VIEApps-Session");
			if (AppUtility.isNotEmpty(session) && session !== "{}") {
				this.appConfig.session = JSON.parse(session as string);
				this.appConfig.session.account = Account.deserialize(this.appConfig.session.account);
				if (this.isDebug) {
					console.log(this.getLogMessage("The session is loaded from storage"), this.appConfig.session);
				}
				AppEvents.broadcast("Session", { Type: "Loaded", Info: this.appConfig.session });
			}
		}
		catch (error) {
			this.showError("Error occurred while loading the session from storage", error);
		}
		if (onCompleted !== undefined) {
			onCompleted(this.appConfig.session);
		}
	}

	/** Stores the session into storage */
	public async storeSessionAsync(onCompleted?: (data?: any) => void) {
		try {
			await this.storage.set("VIEApps-Session", JSON.stringify(AppUtility.clone(this.appConfig.session, ["jwt", "captcha"])));
			if (this.isDebug) {
				console.log(this.getLogMessage("The session is stored into storage"));
			}
			AppEvents.broadcast("Session", { Type: "Updated", Info: this.appConfig.session });
		}
		catch (error) {
			this.showError("Error occurred while storing the session into storage", error);
		}
		if (onCompleted !== undefined) {
			onCompleted(this.appConfig.session);
		}
	}

	/** Resets session information and re-store into storage */
	public async resetSessionAsync(onCompleted?: (data?: any) => void) {
		this.appConfig.session.id = undefined;
		this.appConfig.session.token = undefined;
		this.appConfig.session.keys = undefined;
		this.appConfig.session.account = this.getAccount(true);
		await this.storeSessionAsync(onCompleted);
	}

	/** Send request to patch the session */
	public patchSession(onNext?: () => void, defer?: number): void {
		PlatformUtility.setTimeout(() => {
			super.send({
				ServiceName: "users",
				ObjectName: "session",
				Verb: "PATCH",
				Query: undefined,
				Header: this.appConfig.getAuthenticatedHeaders(),
				Body: undefined,
				Extra: {
					"x-session": this.appConfig.session.id
				}
			});
			if (onNext !== undefined) {
				onNext();
			}
		}, defer || 456);
	}

	/** Gets the information of the current/default account */
	public getAccount(getDefault?: boolean) {
		const account = AppUtility.isTrue(getDefault) || this.appConfig.session.account === undefined
			? undefined
			: this.appConfig.session.account;
		return account || new Account();
	}

	/** Prepares account information */
	public prepareAccount(data: any) {
		const account = {
			Roles: new Array<string>(),
			Privileges: new Array<Privilege>(),
			Status: "Registered",
			TwoFactorsAuthentication: {
				Required: false,
				Providers: new Array<{ Label: string, Type: string, Time: Date, Info: string }>()
			}
		};

		if (AppUtility.isArray(data.Roles, true)) {
			account.Roles = new List<string>(data.Roles).Select(r => r.trim()).Distinct().ToArray();
		}

		if (AppUtility.isArray(data.Privileges, true)) {
			account.Privileges = (data.Privileges as Array<any>).map(p => Privilege.deserialize(p));
		}

		if (AppUtility.isNotEmpty(data.Status)) {
			account.Status = data.Status as string;
		}

		if (AppUtility.isObject(data.TwoFactorsAuthentication, true)) {
			account.TwoFactorsAuthentication.Required = AppUtility.isTrue(data.TwoFactorsAuthentication.Required);
			if (AppUtility.isArray(data.TwoFactorsAuthentication.Providers, true)) {
				account.TwoFactorsAuthentication.Providers = (data.TwoFactorsAuthentication.Providers as Array<any>).map(provider => {
					return {
						Label: provider.Label,
						Type: provider.Type,
						Time: new Date(provider.Time),
						Info: provider.Info
					};
				});
			}
		}

		return account;
	}

	/** Updates information of the account */
	public updateAccount(data: any, onCompleted?: (data?: any) => void) {
		if (this.appConfig.session.account.id !== undefined && this.appConfig.session.account.id === data.ID) {
			const account = this.prepareAccount(data);
			this.appConfig.session.account.roles = account.Roles;
			this.appConfig.session.account.privileges = account.Privileges;
			this.appConfig.session.account.status = account.Status;
			this.appConfig.session.account.twoFactors = {
				required: account.TwoFactorsAuthentication.Required,
				providers: account.TwoFactorsAuthentication.Providers
			};
			AppEvents.broadcast("Account", { Type: "Updated", Info: this.appConfig.session.account });
			this.storeSessionAsync(onCompleted);
		}
		else if (onCompleted !== undefined) {
			onCompleted(data);
		}
	}

	/** Send request to patch information of the account */
	public patchAccount(onNext?: () => void, defer?: number) {
		PlatformUtility.setTimeout(() => {
			super.send({
				ServiceName: "users",
				ObjectName: "account",
				Verb: "GET",
				Query: { "x-status": "" },
				Header: undefined,
				Body: undefined,
				Extra: undefined
			});
			if (onNext !== undefined) {
				onNext();
			}
		}, defer || 345);
	}

	/** Sends the request to get profile information of current account via WebSocket connection */
	public getProfile(onNext?: () => void) {
		super.send({
			ServiceName: "users",
			ObjectName: "profile",
			Verb: "GET",
			Query: {
				"object-identity": this.getAccount().id,
				"related-service": this.appConfig.app.service,
				"language": this.appConfig.language,
				"host": PlatformUtility.host
			},
			Header: undefined,
			Body: undefined,
			Extra: undefined
		});
		if (onNext !== undefined) {
			onNext();
		}
	}

	/** Store the information of current account profile into storage */
	public async storeProfileAsync(onCompleted?: (data?: any) => void) {
		await this.storeSessionAsync(onCompleted);
	}

	/** Watch the connection of Facebook */
	public watchFacebookConnect() {
		FB.Event.subscribe(
			"auth.authResponseChange",
			response => {
				if (response.status === "connected") {
					this.appConfig.facebook.token = response.authResponse.accessToken;
					this.appConfig.facebook.id = response.authResponse.userID;
					console.log(this.getLogMessage("Facebook is connected"), this.appConfig.isDebug ? this.appConfig.facebook : "");
					if (this.appConfig.session.account.facebook !== undefined) {
						this.getFacebookProfile();
					}
				}
				else {
					this.appConfig.facebook.token = undefined;
				}
			}
		);
	}

	/** Get the information of Facebook profile */
	public getFacebookProfile() {
		FB.api(
			`/${this.appConfig.facebook.version}/me?fields=id,name,picture&access_token=${this.appConfig.facebook.token}`,
			response => {
				this.appConfig.session.account.facebook = {
					id: response.id,
					name: response.name,
					profileUrl: `https://www.facebook.com/app_scoped_user_id/${response.id}`,
					pictureUrl: undefined
				};
				this.storeProfileAsync(() => {
					console.log(this.getLogMessage("Account is updated with information of Facebook profile"), this.appConfig.isDebug ? this.appConfig.session.account : "");
				});
				this.getFacebookAvatar();
			}
		);
	}

	/** Get the avatar picture (large picture) of Facebook profile */
	public getFacebookAvatar() {
		if (this.appConfig.session.account.facebook && this.appConfig.session.account.facebook.id && this.appConfig.session.token && this.appConfig.session.token.oauths
			&& this.appConfig.session.token.oauths["facebook"] && this.appConfig.session.token.oauths["facebook"] === this.appConfig.session.account.facebook.id) {
			FB.api(
				`/${this.appConfig.facebook.version}/${this.appConfig.session.account.facebook.id}/picture?type=large&redirect=false&access_token=${this.appConfig.facebook.token}`,
				response => {
					this.appConfig.session.account.facebook.pictureUrl = response.data.url;
					this.storeProfileAsync(() => {
						console.log(this.getLogMessage("Account is updated with information of Facebook profile (large profile picture)"), this.appConfig.isDebug ? response : "");
					});
				}
			);
		}
	}

	/** Sends a request to tell app component navigates to home screen */
	public navigateHome(animated: boolean = true, extras?: { [key: string]: any }) {
		AppEvents.broadcast("NavigateHome", {
			animated: AppUtility.isTrue(animated),
			extras: extras
		});
	}

	/** Sends a request to tell app component navigates back one step */
	public navigateBack(animated: boolean = true, extras?: { [key: string]: any }) {
		AppEvents.broadcast("NavigateBack", {
			url: this.previousUrl,
			animated: AppUtility.isTrue(animated),
			extras: extras
		});
	}

	/** Sends a request to tell app component navigates forward one step */
	public navigateForward(url: string, animated: boolean = true, extras?: { [key: string]: any }) {
		AppEvents.broadcast("NavigateForward", {
			url: url,
			animated: AppUtility.isTrue(animated),
			extras: extras
		});
	}

	private async loadGeoMetaAsync() {
		this.appConfig.meta.country = await this.storage.get("VIEApps-GeoMeta-Country") || "VN";
		this.appConfig.meta.countries = await this.storage.get("VIEApps-GeoMeta-Countries") || [];
		this.appConfig.meta.provinces = await this.storage.get("VIEApps-GeoMeta-Provinces") || {};

		if (this.appConfig.meta.provinces[this.appConfig.meta.country] !== undefined) {
			AppEvents.broadcast("GeoMeta", { Type: "Loaded", Data: this.appConfig.meta });
		}

		await this.loadGeoProvincesAsync(this.appConfig.meta.country, async () => {
			if (this.appConfig.meta.countries.length < 1) {
				await this.loadGeoCountriesAsync();
			}
		});
	}

	private async saveGeoMetaAsync(data: any, onCompleted?: (data?: any) => void) {
		if (AppUtility.isObject(data, true) && AppUtility.isNotEmpty(data.code) && AppUtility.isArray(data.provinces, true)) {
			this.appConfig.meta.provinces[data.code] = data;
		}
		else if (AppUtility.isObject(data, true) && AppUtility.isArray(data.countries, true)) {
			this.appConfig.meta.countries = data.countries;
		}

		await Promise.all([
			this.storage.set("VIEApps-GeoMeta-Country", this.appConfig.meta.country),
			this.storage.set("VIEApps-GeoMeta-Countries", this.appConfig.meta.countries),
			this.storage.set("VIEApps-GeoMeta-Provinces", this.appConfig.meta.provinces)
		]);

		AppEvents.broadcast("GeoMeta", { Type: "Loaded", Data: this.appConfig.meta });
		if (onCompleted !== undefined) {
			onCompleted(data);
		}
	}

	private async loadGeoCountriesAsync(onCompleted?: (data?: any) => void) {
		await super.readAsync(
			"statics/geo/countries.json",
			async data => await this.saveGeoMetaAsync(data, onCompleted),
			error => this.showError("Error occurred while fetching the meta countries", error)
		);
	}

	private async loadGeoProvincesAsync(country?: string, onCompleted?: () => void) {
		await super.readAsync(
			`statics/geo/provinces/${country || this.appConfig.meta.country}.json`,
			async data => await this.saveGeoMetaAsync(data, onCompleted),
			error => this.showError("Error occurred while fetching the meta provinces", error)
		);
	}

}
