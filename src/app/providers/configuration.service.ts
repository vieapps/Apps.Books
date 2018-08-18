declare var FB: any;
import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import { Title } from "@angular/platform-browser";
import { Platform } from "@ionic/angular";
import { Storage } from "@ionic/storage";
import { Device } from "@ionic-native/device/ngx";
import { AppVersion } from "@ionic-native/app-version/ngx";
import { List } from "linqts";
import { AppConfig } from "../app.config";
import { AppAPI } from "../components/app.api";
import { AppCrypto } from "../components/app.crypto";
import { AppEvents } from "../components/app.events";
import { AppUtility } from "../components/app.utility";
import { PlatformUtility } from "../components/app.utility.platform";
import { Profile } from "../models/profile";
import { Account } from "../models/account";
import { Privilege } from "../models/privileges";
import { Base as BaseService } from "./base.service";

@Injectable()
export class ConfigurationService extends BaseService {

	constructor (
		public http: Http,
		public platform: Platform,
		public device: Device,
		public storage: Storage,
		public appVer: AppVersion,
		public docTitle: Title
	) {
		super(http, "Configuration");
	}

	/** Gets the configuration of the app */
	public get appConfig() {
		return AppConfig;
	}

	/** Gets the state that determines the app is ready to go */
	public get isReady() {
		return AppUtility.isObject(this.appConfig.session.keys, true) && AppUtility.isObject(this.appConfig.session.token, true);
	}

	/** Gets the state that determines the current account is authenticated or not */
	public get isAuthenticated() {
		return AppUtility.isObject(this.appConfig.session.token, true) && AppUtility.isNotEmpty(this.appConfig.session.token.uid);
	}

	/** Gets the state that determines the app is running in debug mode or not */
	public get isDebug() {
		return this.appConfig.isDebug;
	}

	/** Sets the previous url */
	public setPreviousUrl(value: string) {
		this.appConfig.app.url.previous = value;
	}

	/** Sets the current url */
	public setCurrentUrl(value: string) {
		this.appConfig.app.url.current = value;
	}

	/** Gets the previous url */
	public get previousUrl() {
		return this.appConfig.app.url.previous || "/home";
	}

	/** Gets the current url */
	public get currentUrl() {
		return this.appConfig.app.url.current || "/home";
	}

	/** Sets the current url */
	public set currentUrl(value: string) {
		if (value !== this.currentUrl) {
			if (this.currentUrl !== this.previousUrl) {
				this.setPreviousUrl(this.currentUrl);
			}
			this.setCurrentUrl(value);
		}
	}

	/** Gets the current version of the app title */
	public get appVersion() {
		return this.appConfig.app.version;
	}

	/** Sets the app title (means of title of the current app page) */
	public set appTitle(value: string) {
		this.docTitle.setTitle(`${value} :: ${this.appConfig.app.name}`);
	}

	/** Prepare the working environments of the app */
	public async prepareAsync(onCompleted?: () => void) {
		this.appConfig.app.mode = this.platform.is("cordova") && this.device.platform !== "browser" ? "NTA" : "PWA";
		this.appConfig.app.os = PlatformUtility.getOSPlatform();

		if (this.appConfig.isNativeApp) {
			this.appConfig.app.platform = this.device.platform;
			this.appConfig.session.device = this.device.uuid + "@" + this.appConfig.app.name;
		}

		else {
			this.appConfig.app.host = PlatformUtility.getHost();
			this.appConfig.app.platform = this.device.platform;
			if (!AppUtility.isNotEmpty(this.appConfig.app.platform) || this.appConfig.app.platform === "browser") {
				this.appConfig.app.platform = PlatformUtility.getAppPlatform();
			}

			if (this.appConfig.app.mode === "PWA") {
				this.appConfig.app.platform += " " + this.appConfig.app.mode;
			}
		}

		this.appVer.getVersionCode()
			.then(version => this.appConfig.app.version = version as string)
			.catch(error => this.error("Cannot get app version", error));

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
		if (this.appConfig.session.token === null || this.appConfig.session.keys === null) {
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
		return super.readAsync("users/session",
			async data => {
				await this.updateSessionAsync(data, () => {
					if (this.isAuthenticated) {
						this.appConfig.session.account = AppUtility.isObject(this.appConfig.session.account, true)
							? this.appConfig.session.account
							: this.getAccount(true);
						if (!this.appConfig.session.account.id) {
							this.appConfig.session.account.id = this.appConfig.session.token.uid;
						}
					}
					else {
						this.appConfig.session.account = this.getAccount(true);
					}
					if (this.isAuthenticated) {
						AppEvents.broadcast("Session", { Type: "Register", Info: this.appConfig.session });
					}
					else {
						AppEvents.broadcast("Session", { Type: "Initialize", Info: this.appConfig.session });
					}
					this.log("The session is initialized");
					if (onNext !== undefined) {
						onNext(data);
					}
				});
			},
			error => this.error("Error occurred while initializing the session", error, onError)
		);
	}

	/** Registers the initialized session (anonymous) with REST API */
	public registerSessionAsync(onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return this.readAsync("users/session?register=" + this.appConfig.session.id,
			async data => {
				this.appConfig.session.account = this.getAccount(true);
				await this.storeSessionAsync(() => {
					AppEvents.broadcast("Session", { Type: "Register", Info: this.appConfig.session });
					this.log("The session is registered");
				});
				if (onNext !== undefined) {
					onNext(data);
				}
			},
			error => this.error("Error occurred while registering the session", error, onError)
		);
	}

	/** Updates the session and stores into storage */
	public updateSessionAsync(session: any, onCompleted?: () => void) {
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

		return this.storeSessionAsync(onCompleted);
	}

	/** Loads the session from storage */
	public async loadSessionAsync(onCompleted?: () => void) {
		try {
			const data = await this.storage.get("VIEApps-Session");
			if (AppUtility.isNotEmpty(data) && data !== "{}") {
				this.appConfig.session = JSON.parse(data as string);
				if (this.appConfig.session.account !== null && this.appConfig.session.account.profile !== null) {
					this.appConfig.session.account.profile = Profile.deserialize(this.appConfig.session.account.profile);
				}
				AppEvents.broadcast("Session", { Type: "Loaded", Info: this.appConfig.session });
			}
		}
		catch (error) {
			this.error("Error occurred while loading the saved/offline session", error);
		}
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	/** Stores the session into storage */
	public async storeSessionAsync(onCompleted?: () => void) {
		try {
			const session = AppUtility.clone(this.appConfig.session, ["jwt", "captcha"]);
			await this.storage.set("VIEApps-Session", JSON.stringify(session));
		}
		catch (error) {
			this.error("Error occurred while saving/storing the session", error);
		}
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	/** Deletes the session from storage */
	public async deleteSessionAsync(onCompleted?: () => void) {
		this.appConfig.session.id = null;
		this.appConfig.session.token = null;
		this.appConfig.session.keys = null;
		this.appConfig.session.account = this.getAccount(true);
		const session = AppUtility.clone(this.appConfig.session, ["jwt", "captcha"]);
		await this.storage.set("VIEApps-Session", JSON.stringify(session));
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	/** Send request to patch the session */
	public patchSession(onNext?: () => void, defer?: number): void {
		PlatformUtility.setTimeout(() => {
			this.send({
				ServiceName: "users",
				ObjectName: "session",
				Verb: "PATCH",
				Query: null,
				Header: AppAPI.getAuthHeaders(),
				Body: null,
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
		const account = AppUtility.isTrue(getDefault) || this.appConfig.session.account === null
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
				Providers: new Array<{Label: string, Type: string, Time: Date, Info: string}>()
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
				account.TwoFactorsAuthentication.Providers = (data.TwoFactorsAuthentication.Providers as Array<any>).map(p => {
					return {
						Label: p.Label,
						Type: p.Type,
						Time: new Date(p.Time),
						Info: p.Info
					};
				});
			}
		}

		return account;
	}

	/** Updates information of the account */
	public updateAccount(data: any, onCompleted?: () => void) {
		const info = this.prepareAccount(data);
		this.appConfig.session.account.roles = info.Roles;
		this.appConfig.session.account.privileges = info.Privileges;
		this.appConfig.session.account.status = info.Status;
		this.appConfig.session.account.twoFactors = {
			required: info.TwoFactorsAuthentication.Required,
			providers: info.TwoFactorsAuthentication.Providers
		};
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	/** Send request to patch information of the account */
	public patchAccount(onNext?: () => void, defer?: number) {
		PlatformUtility.setTimeout(() => {
			this.send({
				ServiceName: "users",
				ObjectName: "account",
				Verb: "GET",
				Query: { "x-status": "" },
				Header: null,
				Body: null,
				Extra: null
			});
			if (onNext !== undefined) {
				onNext();
			}
		}, defer || 345);
	}

	/** Sends the request to get profile information of current account via WebSocket connection */
	public getProfile(onNext?: () => void) {
		this.send({
			ServiceName: "users",
			ObjectName: "profile",
			Verb: "GET",
			Query: {
				"object-identity": this.getAccount().id,
				"related-service": this.appConfig.app.service,
				"language": AppUtility.getLanguage(),
				"host": PlatformUtility.getHost()
			},
			Header: null,
			Body: null,
			Extra: null
		});
		if (onNext !== undefined) {
			onNext();
		}
	}

	/** Store the information of current account profile into storage */
	public async storeProfileAsync(onCompleted?: (data?: any) => void) {
		await this.storeSessionAsync();
		AppEvents.broadcast("Session", { Type: "Updated", Info: this.appConfig.session });
		if (onCompleted !== undefined) {
			onCompleted(this.appConfig.session);
		}
	}

	/** Watch the connection of Facebook */
	public watchFacebookConnect() {
		FB.Event.subscribe("auth.authResponseChange",
			response => {
				if (response.status === "connected") {
					this.appConfig.facebook.token = response.authResponse.accessToken;
					this.appConfig.facebook.id = response.authResponse.userID;
					this.log("Facebook is connected", this.appConfig.isDebug ? this.appConfig.facebook : "");
					if (this.appConfig.session.account.facebook !== null) {
						this.getFacebookProfile();
					}
				}
				else {
					this.appConfig.facebook.token = null;
				}
			}
		);
	}

	/** Get the information of Facebook profile */
	public getFacebookProfile() {
		FB.api("/" + this.appConfig.facebook.version + "/me?fields=id,name,picture&access_token=" + this.appConfig.facebook.token,
			response => {
				this.appConfig.session.account.facebook = {
					id: response.id,
					name: response.name,
					profileUrl: "https://www.facebook.com/app_scoped_user_id/" + response.id,
					pictureUrl: undefined
				};
				this.storeProfileAsync(() => {
					this.log("Account profile is updated with information of Facebook profile", this.appConfig.isDebug ? this.appConfig.session.account : "");
				});
				this.getFacebookAvatar();
			}
		);
	}

	/** Get the avatar picture (large picture) of Facebook profile */
	public getFacebookAvatar() {
		if (this.appConfig.session.account.facebook && this.appConfig.session.account.facebook.id && this.appConfig.session.token && this.appConfig.session.token.oauths
			&& this.appConfig.session.token.oauths["facebook"] && this.appConfig.session.token.oauths["facebook"] === this.appConfig.session.account.facebook.id) {
			FB.api("/" + this.appConfig.facebook.version + "/" + this.appConfig.session.account.facebook.id + "/picture?type=large&redirect=false&access_token=" + this.appConfig.facebook.token,
				response => {
					this.appConfig.session.account.facebook.pictureUrl = response.data.url;
					this.storeProfileAsync(() => {
						this.log("Account is updated with information of Facebook profile (large profile picture)", this.appConfig.isDebug ? response : "");
					});
				}
			);
		}
	}

}
