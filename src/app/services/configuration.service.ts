declare var FB: any;
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
import { AppConfig } from "@app/app.config";
import { AppStorage } from "@components/app.storage";
import { AppCrypto } from "@components/app.crypto";
import { AppEvents } from "@components/app.events";
import { AppUtility } from "@components/app.utility";
import { PlatformUtility } from "@components/app.utility.platform";
import { TrackingUtility } from "@components/app.utility.trackings";
import { Account } from "@models/account";
import { Privilege } from "@models/privileges";
import { UserProfile } from "@models/user";
import { Base as BaseService } from "@services/base.service";

@Injectable()
export class ConfigurationService extends BaseService {

	constructor(
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
		return "dark" === this.appConfig.options.theme ? "dark" : undefined;
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
		return AppCrypto.urlEncode(PlatformUtility.getRedirectURI("home?prego=activate&mode={{mode}}&code={{code}}"));
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
	public get screenWidth(): number {
		return this.platform.width();
	}

	/** Gets the width (pixels) of the screen */
	public get screenHeight(): number {
		return this.platform.height();
	}

	/** Gets the file-size limits */
	public get fileLimits() {
		let limits = this.appConfig.options.extras.fileLimits as { avatar: number; thumbnail: number; file: number };
		if (!AppUtility.isObject(limits, true)) {
			limits = {
				avatar: 1024000,
				thumbnail: 524288,
				file: 819200000
			};
			this.appConfig.options.extras.fileLimits = limits;
			this.storeOptionsAsync(() => console.log("[Configuration]: file limits were updated"));
		}
		return limits;
	}

	/** Prepare the configuration of the app */
	public prepare() {
		const isCordova = this.platform.is("cordova");
		const isNativeApp = isCordova && (this.device.platform === "iOS" || this.device.platform === "Android");

		this.appConfig.app.mode = isNativeApp ? "NTA" : "PWA";
		this.appConfig.app.os = PlatformUtility.getOSPlatform();
		this.appConfig.url.host = PlatformUtility.getHost();

		if (isNativeApp) {
			this.appConfig.url.base = "";
			this.appConfig.app.platform = this.device.platform;
			this.appConfig.session.device = this.device.uuid + "@" + this.appConfig.app.id;
		}

		else {
			this.appConfig.url.base = this.platformLocation.getBaseHrefFromDOM();
			this.appConfig.app.platform = `${PlatformUtility.getAppPlatform()} ${this.appConfig.app.mode}`;
		}

		if (isCordova) {
			if (isNativeApp) {
				this.appVersion.getVersionCode()
					.then(version => this.appConfig.app.version = isNativeApp && !this.isRunningOnIOS ? (version + "").replace(/0/g, ".") : version + "")
					.catch(error => console.error(super.getErrorMessage("Error occurred while preparing the app version", error)));
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
			this.appConfig.app.mode = "Desktop";
			this.appConfig.url.base = "";
			this.appConfig.app.platform = `${this.appConfig.app.os} Desktop`;
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
	public async initializeAsync(onNext?: (data?: any) => void, onError?: (error?: any) => void, dontInitializeSession: boolean = false) {
		// prepare environment
		if (this.appConfig.app.mode === "") {
			this.prepare();
		}

		// load saved session
		if (this.appConfig.session.token === undefined || this.appConfig.session.keys === undefined) {
			await this.loadSessionAsync();
		}

		// initialize session
		if (!dontInitializeSession) {
			await this.initializeSessionAsync(onNext, onError);
		}
		else if (onNext !== undefined) {
			onNext();
		}
	}

	/** Initializes the session with remote APIs */
	public async initializeSessionAsync(onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.fetchAsync(
			"users/session",
			async data => {
				if (this.isDebug) {
					console.log(super.getLogMessage("The session is initialized by APIs"));
				}
				await this.updateSessionAsync(data, _ => {
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

	/** Registers the initialized session (anonymous) with remote APIs */
	public async registerSessionAsync(onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.fetchAsync(
			`users/session?register=${this.appConfig.session.id}`,
			async _ => {
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
	public async updateSessionAsync(session: any, onNext?: (data?: any) => void, dontStore: boolean = false) {
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
					encryptionExponent: session.Keys.RSA.EncryptionExponent,
					decryptionExponent: session.Keys.RSA.DecryptionExponent,
					exponent: session.Keys.RSA.Exponent,
					modulus: session.Keys.RSA.Modulus
				}
			};
			AppCrypto.init(this.appConfig.session.keys);
		}

		if (AppUtility.isNotEmpty(session.Token)) {
			try {
				this.appConfig.session.token = AppCrypto.jwtDecode(session.Token, AppUtility.isObject(this.appConfig.session.keys, true) ? this.appConfig.session.keys.jwt : this.appConfig.app.name);
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
				Query: this.appConfig.getRelatedJson({ "x-status": "" })
			});
			super.send({
				ServiceName: "Users",
				ObjectName: "Profile",
				Query: this.appConfig.getRelatedJson({ "object-identity": this.appConfig.session.account.id })
			});
		}

		if (dontStore) {
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
					Account.set(this.appConfig.session.account);
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
	public async resetSessionAsync(onNext?: (data?: any) => void, doStore: boolean = true) {
		this.appConfig.session.id = undefined;
		this.appConfig.session.token = undefined;
		this.appConfig.session.keys = undefined;
		this.appConfig.session.account = this.getAccount(true);
		await this.deleteSessionAsync(doStore ? async () => await this.storeSessionAsync(onNext) : onNext);
	}

	/** Gets the information of the current/default account */
	public getAccount(getDefault: boolean = false) {
		return (getDefault ? undefined : this.appConfig.session.account) || new Account();
	}

	/** Updates information of the account */
	public updateAccount(data: any, onNext?: (data?: any) => void, updateInstances: boolean = false) {
		const id = data.ID || "";
		const account = Account.get(id) || new Account();

		if (account.id === undefined) {
			account.id = data.ID;
		}

		if (AppUtility.isArray(data.Roles, true)) {
			account.roles = (data.Roles as Array<string>).filter((role, index, array) => array.indexOf(role) === index);
		}

		if (AppUtility.isArray(data.Privileges, true)) {
			account.privileges = (data.Privileges as Array<any>).map(privilege => Privilege.deserialize(privilege));
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

		if (account.id !== undefined && UserProfile.contains(account.id)) {
			account.profile = UserProfile.get(account.id);
		}

		if (this.isAuthenticated && this.getAccount().id === account.id) {
			this.appConfig.session.account = account;
			if (this.isDebug) {
				console.log(super.getLogMessage("Account is updated"), this.appConfig.session.account);
			}
			Account.set(account);
			if (this.appConfig.app.persistence) {
				this.storeSessionAsync(onNext);
			}
			else if (onNext !== undefined) {
				onNext(data);
			}
		}
		else {
			if (account.id !== undefined && (updateInstances || Account.contains(account.id))) {
				Account.set(account);
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
	public async navigateHomeAsync(url?: string, extras?: { [key: string]: any }) {
		await this.navController.navigateRoot(url || this.appConfig.url.home, extras);
	}

	/** Sends a request to navigates back one step */
	public async navigateBackAsync(url?: string, extras?: { [key: string]: any }) {
		await this.navController.navigateBack(url || this.previousUrl, extras);
	}

	/** Sends a request to navigates forward one step */
	public async navigateForwardAsync(url: string, extras?: { [key: string]: any }) {
		await this.navController.navigateForward(url || this.appConfig.url.home, extras);
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

	private async saveGeoMetaAsync(data: any, onNext?: (data?: any) => void) {
		if (AppUtility.isObject(data, true) && AppUtility.isNotEmpty(data.code) && AppUtility.isArray(data.provinces, true)) {
			this.appConfig.geoMeta.provinces[data.code] = data;
		}
		else if (AppUtility.isObject(data, true) && AppUtility.isArray(data.countries, true)) {
			this.appConfig.geoMeta.countries = data.countries;
		}
		await Promise.all([
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

	/** Loads the URI settings of the app */
	public async loadURIsAsync(onNext?: (data?: any) => void) {
		const uris = await AppStorage.getAsync("URIs") || {};
		if (uris.apis !== undefined && uris.updates !== undefined && uris.files !== undefined) {
			this.appConfig.URIs = uris;
			await this.storeURIsAsync(onNext);
		}
		else if (onNext !== undefined) {
			onNext(uris);
		}
	}

	/** Stores the URI settings of the app */
	public async storeURIsAsync(onNext?: (data?: any) => void) {
		await AppStorage.setAsync("URIs", this.appConfig.URIs).then(() => {
			AppEvents.broadcast("App", { Type: "URIsUpdated" });
			if (this.isDebug) {
				console.log(super.getLogMessage("URIs are updated"), this.appConfig.URIs);
			}
			if (onNext !== undefined) {
				onNext(this.appConfig.URIs);
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
	public async storeOptionsAsync(onNext?: (data?: any) => void) {
		await AppStorage.setAsync("Options", this.appConfig.options).then(() => {
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
	public async prepareLanguagesAsync() {
		this.translateSvc.addLangs(this.languages.map(language => language.Value));
		this.translateSvc.setDefaultLang(this.appConfig.language);
		await this.setResourceLanguageAsync(this.appConfig.language);
	}

	/** Changes the language & locale of resources to use in the app */
	public async changeLanguageAsync(language: string, storeOptions: boolean = true) {
		this.appConfig.options.i18n = language;
		await Promise.all([
			storeOptions ? this.storeOptionsAsync() : new Promise<void>(() => {}),
			this.setResourceLanguageAsync(language)
		]).then(() => AppEvents.broadcast("App", { Type: "LanguageChanged" }));
	}

	/** Sets the language & locale of resources to use in the app */
	public async setResourceLanguageAsync(language: string) {
		await this.translateSvc.use(language).toPromise<void>();
	}

	/** Gets the resource (of the current language) by a key */
	public async getResourceAsync(key: string, interpolateParams?: object) {
		return await this.translateSvc.get(key, interpolateParams).toPromise<string>();
	}

	/** Gets the resources (of the current language) by a key */
	public async getResourcesAsync(key: string) {
		return await this.translateSvc.get(key).toPromise<{ [key: string]: string }>();
	}

	/** Definitions (forms, views, resources, ...) */
	public addDefinition(path: string, definition: any) {
		this._definitions[AppCrypto.md5(path.toLowerCase())] = definition;
	}

	public getDefinition(path: string) {
		return this._definitions[AppCrypto.md5(path.toLowerCase())];
	}

	public async fetchDefinitionAsync(path: string, doClone: boolean = true) {
		let definition = this.getDefinition(path);
		if (definition === undefined) {
			await super.fetchAsync(
				path,
				data => this.addDefinition(path, data),
				error => super.showError("Error occurred while working with definitions", error)
			);
			definition = this.getDefinition(path);
		}
		return doClone ? AppUtility.clone(definition) : definition;
	}

	public getDefinitionPath(serviceName?: string, objectName?: string, definitionName?: string, query?: { [key: string]: string }) {
		let path = "discovery/definitions?";
		if (AppUtility.isNotEmpty(serviceName)) {
			path += `x-service-name=${serviceName.toLowerCase()}&`;
		}
		if (AppUtility.isNotEmpty(objectName)) {
			path += `x-object-name=${objectName.toLowerCase()}&`;
		}
		if (AppUtility.isNotEmpty(definitionName)) {
			path += `x-object-identity=${definitionName.toLowerCase()}&`;
		}
		if (AppUtility.isObject(query, true)) {
			Object.keys(query).forEach(key => path += `${key}=${encodeURIComponent(query[key])}&`);
		}
		return path + this.appConfig.getRelatedQuery(serviceName, undefined, json => {
			if (AppUtility.isNotEmpty(serviceName) && AppUtility.isEquals(serviceName, json["related-service"])) {
				delete json["related-service"];
				delete json["active-id"];
			}
		});
	}

	public setDefinition(definition: any, serviceName?: string, objectName?: string, definitionName?: string, query?: { [key: string]: string }) {
		this.addDefinition(this.getDefinitionPath(serviceName, objectName, definitionName, query), definition);
	}

	public async getDefinitionAsync(serviceName?: string, objectName?: string, definitionName?: string, query?: { [key: string]: string }) {
		return await this.fetchDefinitionAsync(this.getDefinitionPath(serviceName, objectName, definitionName, query));
	}

	public getInstructionsAsync(service: string, language?: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return super.fetchAsync(`/statics/instructions/${service}/${language || this.appConfig.language}.json`, onNext, onError);
	}

}
