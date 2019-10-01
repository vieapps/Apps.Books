declare var FB: any;
import { List } from "linqts";
import { Injectable } from "@angular/core";
import { PlatformLocation } from "@angular/common";
import { Title as BrowserTitle } from "@angular/platform-browser";
import { Platform, NavController } from "@ionic/angular";
import { Storage } from "@ionic/storage";
import { Device } from "@ionic-native/device/ngx";
import { Keyboard } from "@ionic-native/keyboard/ngx";
import { AppVersion } from "@ionic-native/app-version/ngx";
import { GoogleAnalytics } from "@ionic-native/google-analytics/ngx";
import { InAppBrowser } from "@ionic-native/in-app-browser/ngx";
import { Clipboard } from "@ionic-native/clipboard/ngx";
import { TranslateService } from "@ngx-translate/core";
import { ElectronService } from "ngx-electron";
import { AppConfig } from "../app.config";
import { AppStorage } from "../components/app.storage";
import { AppCrypto } from "../components/app.crypto";
import { AppEvents } from "../components/app.events";
import { AppUtility } from "../components/app.utility";
import { PlatformUtility } from "../components/app.utility.platform";
import { TrackingUtility } from "../components/app.utility.trackings";
import { Account } from "../models/account";
import { Privilege } from "../models/privileges";
import { UserProfile } from "../models/user";
import { Base as BaseService } from "./base.service";

@Injectable()
export class ConfigurationService extends BaseService {

	constructor (
		private platformLocation: PlatformLocation,
		private platform: Platform,
		private navController: NavController,
		private device: Device,
		private keyboard: Keyboard,
		private inappBrowser: InAppBrowser,
		private clipboard: Clipboard,
		private appVersion: AppVersion,
		private googleAnalytics: GoogleAnalytics,
		private storage: Storage,
		private browserTitle: BrowserTitle,
		private translateSvc: TranslateService,
		private electronSvc: ElectronService
	) {
		super("Configuration");
		AppStorage.initializeAsync(this.storage, () => console.log(super.getLogMessage("KVP storage is ready")));
		AppEvents.on("App", info => {
			if ("PlatformIsReady" === info.args.Type) {
				this.loadGeoMetaAsync();
			}
		});
	}

	private _definitions: { [key: string]: any } = {};

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

	/** Gets the state that determines is native app */
	public get isNativeApp() {
		return this.appConfig.isNativeApp;
	}

	/** Gets the state that determines is web progressive app */
	public get isWebApp() {
		return this.appConfig.isWebApp;
	}

	/** Gets the state that determines the app is running on iOS (native or web browser) */
	public get isRunningOnIOS() {
		return this.appConfig.isRunningOnIOS;
	}

	/** Gets the available languages for working with the app */
	public get languages() {
		return this.appConfig.languages;
	}

	/** Gets the current locale code for working with i18n globalization */
	public get locale() {
		return this.appConfig.locale;
	}

	/** Gets the available locales for working with the app */
	public get locales() {
		return this.appConfig.locales;
	}

	/** Gets the color of the theme (dark or light) */
	public get color() {
		return this.appConfig.options.theme === "dark" ? "dark" : undefined;
	}

	/** Gets the locale data for working with i18n globalization */
	public getLocaleData(locale: string) {
		return this.appConfig.getLocaleData(locale);
	}

	public getCurrentUrl() {
		return this.appConfig.url.stack.length > 0 ? this.appConfig.url.stack[this.appConfig.url.stack.length - 1] : undefined;
	}

	/** Gets the previous url */
	public getPreviousUrl() {
		return this.appConfig.url.stack.length > 1 ? this.appConfig.url.stack[this.appConfig.url.stack.length - 2] : undefined;
	}

	/** Pushs/Adds an url into stack of routes */
	public pushUrl(url: string, params: { [key: string]: any }) {
		url = url.indexOf("?") > 0 ? url.substr(0, url.indexOf("?")) : url;
		this.appConfig.url.stack = url !== this.appConfig.url.home ? this.appConfig.url.stack : [];
		const previous = this.getPreviousUrl();
		const current = this.getCurrentUrl();
		if (previous !== undefined && previous.url.startsWith(url)) {
			this.appConfig.url.stack.pop();
		}
		else if (current === undefined || !current.url.startsWith(url)) {
			this.appConfig.url.stack.push({
				url: url,
				params: params
			});
		}
		if (this.appConfig.url.stack.length > 30) {
			this.appConfig.url.stack.splice(0, this.appConfig.url.stack.length - 30);
		}
	}

	/** Removes the current url from the stack, also pop the current view */
	public popUrl() {
		this.navController.pop().then(() => this.appConfig.url.stack.pop());
	}

	private getUrl(info: { url: string, params: { [key: string]: any } }, alternativeUrl?: string) {
		return info !== undefined
			? PlatformUtility.getURI(info.url, info.params)
			: alternativeUrl || this.appConfig.url.home;
	}

	/** Gets the current url */
	public get currentUrl() {
		return this.getUrl(this.getCurrentUrl());
	}

	/** Gets the previous url */
	public get previousUrl() {
		return this.getUrl(this.getPreviousUrl());
	}

	/** Gets the URI for activating new account/password */
	public get activateURI() {
		return AppCrypto.urlEncode(PlatformUtility.getRedirectURI("prego=activate&mode={mode}&code={code}", false));
	}

	/** Sets the app title (means title of the browser) */
	public set appTitle(value: string) {
		this.browserTitle.setTitle(`${value} :: ${this.appConfig.app.name}`);
	}

	/** Gets the query with related service, language and host */
	public get relatedQuery() {
		return this.appConfig.getRelatedQuery();
	}

	/** Gets the router params of the current page/view */
	public get routerParams() {
		return this.appConfig.url.routerParams;
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

	/** Gets the width (pixels) of the screen */
	public get screenWidth() {
		return this.platform.width();
	}

	/** Gets the width (pixels) of the screen */
	public get screenHeight() {
		return this.platform.height();
	}

	/** Prepare the configuration of the app */
	public prepare() {
		const isCordova = this.platform.is("cordova");
		const isNativeApp = isCordova && (this.device.platform === "iOS" || this.device.platform === "Android");

		this.appConfig.app.mode = isNativeApp ? "NTA" : "PWA";
		this.appConfig.app.os = PlatformUtility.getOSPlatform();

		if (isNativeApp) {
			this.appConfig.app.platform = this.device.platform;
			this.appConfig.session.device = this.device.uuid + "@" + this.appConfig.app.id;
			this.appConfig.url.base = "/";
		}

		else {
			this.appConfig.app.platform = PlatformUtility.getAppPlatform() + " " + this.appConfig.app.mode;
			this.appConfig.url.host = PlatformUtility.getHost();
			this.appConfig.url.base = this.platformLocation.getBaseHrefFromDOM();
		}

		if (isCordova) {
			if (isNativeApp) {
				this.appVersion.getVersionCode()
					.then(version => this.appConfig.app.version = isNativeApp && !this.isRunningOnIOS ? (version + "").replace(/0/g, ".") : version + "")
					.catch(error => console.error(super.getErrorMessage("Error occurred while preparing app version", error)));
				PlatformUtility.setInAppBrowser(this.inappBrowser);
				PlatformUtility.setClipboard(this.clipboard);
				if (!this.isRunningOnIOS) {
					PlatformUtility.setKeyboard(this.keyboard);
				}
			}

			TrackingUtility.initializeAsync(this.googleAnalytics);
			if (this.isDebug) {
				console.log(super.getLogMessage(`Device Info\n- UUID: ${this.device.uuid}\n- Manufacturer: ${this.device.manufacturer}\n- Model: ${this.device.model}\n- Serial: ${this.device.serial}\n- Platform: ${this.device.platform} ${this.device.platform !== "browser" ? this.device.version : "[" + this.device.model + " v" + this.device.version + "]"}`));
			}
		}

		if (this.electronSvc !== undefined && this.electronSvc.isElectronApp) {
			AppEvents.initializeElectronService(this.electronSvc);
			PlatformUtility.setElectronService(this.electronSvc);
			this.appConfig.app.shell = "Electron";
			this.electronSvc.ipcRenderer.on("electron.ipc2app", ($event: any, $info: any) => {
				$info = $info || {};
				if (AppUtility.isNotEmpty($info.event)) {
					AppEvents.broadcast($info.event, $info.args);
				}
				if (this.isDebug) {
					console.log("[Electron]: Got an IPC message", $event, $info);
				}
			});
		}
		else {
			this.appConfig.app.shell = isNativeApp ? "Cordova" : "Browser";
		}
	}

	/** Initializes the configuration settings of the app */
	public async initializeAsync(onNext?: (data?: any) => void, onError?: (error?: any) => void, dontInitializeSession?: boolean) {
		// prepare environment
		if (this.appConfig.app.mode === "") {
			this.prepare();
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
	public initializeSessionAsync(onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return super.fetchAsync(
			"users/session",
			async data => {
				if (this.isDebug) {
					console.log(super.getLogMessage("The session is initialized by APIs"));
				}
				await this.updateSessionAsync(data, () => {
					this.appConfig.session.account = this.getAccount(!this.isAuthenticated);
					if (this.isAuthenticated) {
						this.appConfig.session.account.id = this.appConfig.session.token.uid;
					}
					AppEvents.broadcast("Session", { Type: this.isAuthenticated ? "Registered" : "Initialized" });
					if (onNext !== undefined) {
						onNext(data);
					}
				});
			},
			error => super.showError("Error occurred while initializing the session", error, onError)
		);
	}

	/** Registers the initialized session (anonymous) with REST API */
	public registerSessionAsync(onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return super.fetchAsync(
			`users/session?register=${this.appConfig.session.id}`,
			async () => {
				this.appConfig.session.account = this.getAccount(true);
				if (this.isDebug) {
					console.log(super.getLogMessage("The session is registered by APIs"));
				}
				AppEvents.broadcast("Session", { Type: "Registered" });
				await this.storeSessionAsync(onNext);
			},
			error => super.showError("Error occurred while registering the session", error, onError)
		);
	}

	/** Updates the session and stores into storage */
	public async updateSessionAsync(session: any, onNext?: (data?: any) => void, dontStore?: boolean) {
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
			try {
				const jwtKey = AppUtility.isObject(this.appConfig.session.keys, true)
					? this.appConfig.session.keys.jwt
					: this.appConfig.app.name;
				this.appConfig.session.token = AppCrypto.jwtDecode(session.Token, jwtKey);
			}
			catch (error) {
				this.appConfig.session.token = undefined;
				super.showError("Error occurred while decoding token =>" + session.Token, error);
			}
		}

		this.appConfig.session.account = this.getAccount(!this.isAuthenticated);
		if (this.isAuthenticated) {
			this.appConfig.session.account.id = this.appConfig.session.token.uid;
			if (this.appConfig.session.account.profile !== undefined) {
				AppEvents.broadcast("Profile", { Type: "Updated" });
			}
			super.send({
				ServiceName: "Users",
				ObjectName: "Account",
				Query: {
					"x-status": ""
				}
			});
			super.send({
				ServiceName: "Users",
				ObjectName: "Profile",
				Query: this.appConfig.getRelatedJson(undefined, { "object-identity": this.appConfig.session.account.id })
			});
		}

		if (AppUtility.isTrue(dontStore)) {
			if (onNext !== undefined) {
				onNext(this.appConfig.session);
			}
		}
		else {
			await this.storeSessionAsync(onNext);
		}
	}

	/** Loads the session from storage */
	public async loadSessionAsync(onNext?: (data?: any) => void) {
		try {
			const session = await AppStorage.getAsync("Session");
			if (AppUtility.isObject(session, true)) {
				this.appConfig.session = JSON.parse(JSON.stringify(session));
				AppEvents.broadcast("Session", { Type: "Loaded" });
				this.appConfig.session.account = Account.deserialize(this.appConfig.session.account);
				if (this.appConfig.session.account.id !== undefined) {
					Account.instances.setValue(this.appConfig.session.account.id, this.appConfig.session.account);
					if (this.appConfig.session.account.profile !== undefined) {
						AppEvents.broadcast("Profile", { Type: "Updated" });
					}
				}
				if (this.isDebug) {
					console.log(super.getLogMessage("The session is loaded from storage"), this.appConfig.session);
				}
			}
		}
		catch (error) {
			super.showError("Error occurred while loading the session from storage", error);
		}
		if (onNext !== undefined) {
			onNext(this.appConfig.session);
		}
	}

	/** Stores the session into storage */
	public async storeSessionAsync(onNext?: (data?: any) => void) {
		if (this.appConfig.app.persistence) {
			try {
				await AppStorage.setAsync("Session", AppUtility.clone(this.appConfig.session, ["jwt", "captcha"]));
				if (this.isDebug) {
					console.log(super.getLogMessage("The session is stored into storage"));
				}
			}
			catch (error) {
				super.showError("Error occurred while storing the session into storage", error);
			}
		}
		AppEvents.broadcast("Session", { Type: "Updated" });
		if (onNext !== undefined) {
			onNext(this.appConfig.session);
		}
	}

	/** Deletes the session from storage */
	public async deleteSessionAsync(onNext?: (data?: any) => void) {
		try {
			await AppStorage.removeAsync("Session");
			if (this.isDebug) {
				console.log(super.getLogMessage("The session is deleted from storage"));
			}
		}
		catch (error) {
			super.showError("Error occurred while deleting the session from storage", error);
		}
		if (onNext !== undefined) {
			onNext(this.appConfig.session);
		}
	}

	/** Resets session information and re-store into storage */
	public resetSessionAsync(onNext?: (data?: any) => void, doStore: boolean = true) {
		this.appConfig.session.id = undefined;
		this.appConfig.session.token = undefined;
		this.appConfig.session.keys = undefined;
		this.appConfig.session.account = this.getAccount(true);
		return this.deleteSessionAsync(doStore ? () => this.storeSessionAsync(onNext) : onNext);
	}

	/** Gets the information of the current/default account */
	public getAccount(getDefault?: boolean) {
		const account = AppUtility.isTrue(getDefault) || this.appConfig.session.account === undefined
			? undefined
			: this.appConfig.session.account;
		return account || new Account();
	}

	/** Updates information of the account */
	public updateAccount(data: any, onNext?: (data?: any) => void, updateInstances?: boolean) {
		const id = data.ID || "";
		const account = Account.instances.containsKey(id)
			? Account.instances.getValue(id)
			: new Account();

		if (account.id === undefined) {
			account.id = data.ID;
		}

		if (AppUtility.isArray(data.Roles, true)) {
			account.roles = new List<string>(data.Roles).Select(r => r.trim()).Distinct().ToArray();
		}

		if (AppUtility.isArray(data.Privileges, true)) {
			account.privileges = (data.Privileges as Array<any>).map(p => Privilege.deserialize(p));
		}

		if (AppUtility.isNotEmpty(data.Status)) {
			account.status = data.Status as string;
		}

		if (AppUtility.isObject(data.TwoFactorsAuthentication, true)) {
			account.twoFactors = {
				required: AppUtility.isTrue(data.TwoFactorsAuthentication.Required),
				providers: AppUtility.isArray(data.TwoFactorsAuthentication.Providers, true)
					? (data.TwoFactorsAuthentication.Providers as Array<any>).map(provider => {
							return {
								Label: provider.Label,
								Type: provider.Type,
								Time: new Date(provider.Time),
								Info: provider.Info
							};
						})
					: []
			};
		}

		if (account.id !== undefined && UserProfile.instances.containsKey(account.id)) {
			account.profile = UserProfile.get(account.id);
		}

		if (this.isAuthenticated && this.getAccount().id === account.id) {
			this.appConfig.session.account = account;
			if (this.isDebug) {
				console.log(super.getLogMessage("Account is updated"), this.appConfig.session.account);
			}
			Account.instances.setValue(account.id, account);
			if (this.appConfig.app.persistence) {
				this.storeSessionAsync(onNext);
			}
			else if (onNext !== undefined) {
				onNext(data);
			}
		}
		else {
			if (account.id !== undefined && (AppUtility.isTrue(updateInstances) || Account.instances.containsKey(account.id))) {
				Account.instances.setValue(account.id, account);
			}
			if (onNext !== undefined) {
				onNext(data);
			}
		}
	}

	/** Watch the connection of Facebook */
	public watchFacebookConnect() {
		FB.Event.subscribe(
			"auth.authResponseChange",
			(response: any) => {
				if (response.status === "connected") {
					this.appConfig.facebook.token = response.authResponse.accessToken;
					this.appConfig.facebook.id = response.authResponse.userID;
					console.log(super.getLogMessage("Facebook is connected"), this.appConfig.isDebug ? this.appConfig.facebook : "");
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
			(response: any) => {
				this.appConfig.session.account.facebook = {
					id: response.id,
					name: response.name,
					profileUrl: `https://www.facebook.com/app_scoped_user_id/${response.id}`,
					pictureUrl: undefined
				};
				this.storeSessionAsync(() => console.log(super.getLogMessage("Account is updated with information of Facebook profile"), this.appConfig.isDebug ? this.appConfig.session.account : ""));
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
				(response: any) => {
					this.appConfig.session.account.facebook.pictureUrl = response.data.url;
					this.storeSessionAsync(() => console.log(super.getLogMessage("Account is updated with information of Facebook profile (large profile picture)"), this.appConfig.isDebug ? response : ""));
				}
			);
		}
	}

	/** Sends a request to navigates to home screen */
	public navigateHomeAsync(url?: string, extras?: { [key: string]: any }) {
		return this.navController.navigateRoot(url || this.appConfig.url.home, extras);
	}

	/** Sends a request to navigates back one step */
	public navigateBackAsync(url?: string, extras?: { [key: string]: any }) {
		return this.navController.navigateBack(url || this.previousUrl, extras);
	}

	/** Sends a request to navigates forward one step */
	public navigateForwardAsync(url: string, extras?: { [key: string]: any }) {
		return this.navController.navigateForward(url || this.appConfig.url.home, extras);
	}

	private async loadGeoMetaAsync() {
		this.appConfig.geoMeta.country = await AppStorage.getAsync("GeoMeta-Country") || "VN";
		this.appConfig.geoMeta.countries = await AppStorage.getAsync("GeoMeta-Countries") || [];
		this.appConfig.geoMeta.provinces = await AppStorage.getAsync("GeoMeta-Provinces") || {};

		if (this.appConfig.geoMeta.provinces[this.appConfig.geoMeta.country] !== undefined) {
			AppEvents.broadcast("App", { Type: "GeoMetaUpdated", Data: this.appConfig.geoMeta });
		}

		await super.readAsync(
			`statics/geo/provinces/${this.appConfig.geoMeta.country}.json`,
			async provinces => await this.saveGeoMetaAsync(provinces, async () => {
				if (this.appConfig.geoMeta.countries.length < 1) {
					await super.readAsync(
						"statics/geo/countries.json",
						async countries => await this.saveGeoMetaAsync(countries),
						error => super.showError("Error occurred while fetching the meta countries", error)
					);
				}
			}),
			error => super.showError("Error occurred while fetching the meta provinces", error)
		);
	}

	private saveGeoMetaAsync(data: any, onNext?: (data?: any) => void) {
		if (AppUtility.isObject(data, true) && AppUtility.isNotEmpty(data.code) && AppUtility.isArray(data.provinces, true)) {
			this.appConfig.geoMeta.provinces[data.code] = data;
		}
		else if (AppUtility.isObject(data, true) && AppUtility.isArray(data.countries, true)) {
			this.appConfig.geoMeta.countries = data.countries;
		}
		return Promise.all([
			AppStorage.setAsync("GeoMeta-Country", this.appConfig.geoMeta.country),
			AppStorage.setAsync("GeoMeta-Countries", this.appConfig.geoMeta.countries),
			AppStorage.setAsync("GeoMeta-Provinces", this.appConfig.geoMeta.provinces)
		]).then(() => {
			AppEvents.broadcast("App", { Type: "GeoMetaUpdated", Data: this.appConfig.geoMeta });
			if (onNext !== undefined) {
				onNext(data);
			}
		});
	}

	/** Loads the options of the app */
	public async loadOptionsAsync(onNext?: (data?: any) => void) {
		const options = await AppStorage.getAsync("Options") || {};
		if (options.i18n !== undefined && options.timezone !== undefined && options.extras !== undefined) {
			this.appConfig.options = options;
			if (this.appConfig.options.theme === undefined) {
				this.appConfig.options.theme = "light";
			}
			await this.storeOptionsAsync(onNext);
		}
		else if (onNext !== undefined) {
			onNext(options);
		}
	}

	/** Stores the options of the app */
	public storeOptionsAsync(onNext?: (data?: any) => void) {
		return AppStorage.setAsync("Options", this.appConfig.options).then(() => {
			AppEvents.broadcast("App", { Type: "OptionsUpdated" });
			if (this.isDebug) {
				console.log(super.getLogMessage("Options are updated"), this.appConfig.options);
			}
			if (onNext !== undefined) {
				onNext(this.appConfig.options);
			}
		});
	}

	/** Prepares the UI languages */
	public prepareLanguagesAsync() {
		this.translateSvc.addLangs(this.languages.map(language => language.Value));
		this.translateSvc.setDefaultLang(this.appConfig.language);
		return this.setResourceLanguageAsync(this.appConfig.language);
	}

	/** Changes the language & locale of resources to use in the app */
	public changeLanguageAsync(language: string, storeOptions: boolean = true) {
		this.appConfig.options.i18n = language;
		return Promise.all([
			storeOptions ? this.storeOptionsAsync() : new Promise<void>(() => {}),
			this.setResourceLanguageAsync(language)
		]).then(() => AppEvents.broadcast("App", { Type: "LanguageChanged" }));
	}

	/** Sets the language & locale of resources to use in the app */
	public setResourceLanguageAsync(language: string) {
		return this.translateSvc.use(language).toPromise<void>();
	}

	/** Gets the resource (of the current language) by a key */
	public getResourceAsync(key: string, interpolateParams?: object) {
		return this.translateSvc.get(key, interpolateParams).toPromise<string>();
	}

	/** Gets the resources (of the current language) by a key */
	public getResourcesAsync(key: string) {
		return this.translateSvc.get(key).toPromise<{ [key: string]: string }>();
	}

	/** Definitions (forms, views, resources, ...) */
	public getDefinition(path: string) {
		return this._definitions[AppCrypto.md5(path.toLowerCase())];
	}

	public addDefinition(definition: any, path: string) {
		this._definitions[AppCrypto.md5(path.toLowerCase())] = definition;
	}

	private getDefinitionPath(serviceName?: string, objectName?: string, definitionName?: string, repositoryID?: string, entityID?: string) {
		let path = "discovery/definitions?" + this.relatedQuery;
		if (AppUtility.isNotEmpty(serviceName)) {
			path += "&x-service-name=" + serviceName;
		}
		if (AppUtility.isNotEmpty(objectName)) {
			path += "&x-object-name=" + objectName;
		}
		if (AppUtility.isNotEmpty(definitionName)) {
			path += "&x-object-identity=" + definitionName;
		}
		if (AppUtility.isNotEmpty(repositoryID)) {
			path += "&x-repository-id=" + repositoryID;
		}
		if (AppUtility.isNotEmpty(entityID)) {
			path += "&x-entity-id=" + entityID;
		}
		return path;
	}

	public setDefinition(definition: any, serviceName?: string, objectName?: string, definitionName?: string, repositoryID?: string, entityID?: string) {
		this.addDefinition(definition, this.getDefinitionPath(serviceName, objectName, definitionName, repositoryID, entityID));
	}

	public async getDefinitionAsync(serviceName?: string, objectName?: string, definitionName?: string, repositoryID?: string, entityID?: string) {
		const path = this.getDefinitionPath(serviceName, objectName, definitionName, repositoryID, entityID);
		if (this.getDefinition(path) === undefined) {
			await super.fetchAsync(
				path,
				data => this.addDefinition(data, path),
				error => super.showError("Error occurred while working with definitions", error)
			);
		}
		return this.getDefinition(path);
	}

}
