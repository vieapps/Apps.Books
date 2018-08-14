declare var FB: any;
import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import { Platform } from "@ionic/angular";
import { Storage } from "@ionic/storage";
import { Device } from "@ionic-native/device/ngx";
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
		public storage: Storage
	) {
		super(http, "Configuration");
	}

	/** Gets the configuration of the app */
	get appConfig() {
		return AppConfig;
	}

	/** Gets the state that determines the app is ready to go */
	get isReady() {
		return AppUtility.isObject(this.appConfig.session.keys, true) && AppUtility.isObject(this.appConfig.session.token, true);
	}

	/** Gets the state that determines the current account is authenticated or not */
	get isAuthenticated() {
		return AppUtility.isObject(this.appConfig.session.token, true) && AppUtility.isNotEmpty(this.appConfig.session.token.uid);
	}

	/** Prepare the working environments of the app */
	prepare(onCompleted?: () => void) {
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

		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	/** Initializes the configuration settings of the app */
	async initializeAsync(onNext?: (data?: any) => void, onError?: (error?: any) => void, dontInitializeSession?: boolean) {
		// prepare environment
		if (this.appConfig.app.mode === "") {
			this.prepare();
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
	initializeSessionAsync(onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return super.readAsync("users/session",
			async (data) => {
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
					console.log(`[${this.Name}]: The session is initialized`);
					if (onNext !== undefined) {
						onNext(data);
					}
				});
			},
			error => this.showError("Error occurred while initializing the session", error, onError)
		);
	}

	/** Registers the initialized session (anonymous) with REST API */
	registerSessionAsync(onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return this.readAsync("users/session?register=" + this.appConfig.session.id,
			async (data) => {
				this.appConfig.session.account = this.getAccount(true);
				await this.storeSessionAsync(() => {
					AppEvents.broadcast("Session", { Type: "Register", Info: this.appConfig.session });
					console.log(`[${this.Name}]: The session is registered`);
				});
				if (onNext !== undefined) {
					onNext(data);
				}
			},
			error => this.showError("Error occurred while registering the session", error, onError)
		);
	}

	/** Updates the session and stores into storage */
	updateSessionAsync(session: any, onCompleted?: () => void) {
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
	async loadSessionAsync(onCompleted?: () => void) {
		try {
			const data = await this.storage.get("VIEApps-Session");
			if (AppUtility.isNotEmpty(data) && data !== "{}") {
				this.appConfig.session = JSON.parse(data as string);
				if (this.appConfig.session.account !== null && this.appConfig.session.account.profile !== null) {
					this.appConfig.session.account.profile = Profile.deserialize(this.appConfig.session.account.profile);
				}
				AppEvents.broadcast("SessionIsLoaded", this.appConfig.session);
			}
		}
		catch (error) {
			this.showError("Error occurred while loading the saved/offline session", error);
		}
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	/** Stores the session into storage */
	async storeSessionAsync(onCompleted?: () => void) {
		try {
			const session = AppUtility.clone(this.appConfig.session, ["jwt", "captcha"]);
			await this.storage.set("VIEApps-Session", JSON.stringify(session));
		}
		catch (error) {
			this.showError("Error occurred while saving/storing the session", error);
		}
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	/** Deletes the session from storage */
	async deleteSessionAsync(onCompleted?: () => void) {
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
	patchSession(onNext?: () => void, defer?: number): void {
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
	getAccount(getDefault?: boolean) {
		const account = AppUtility.isTrue(getDefault) || this.appConfig.session.account === null
			? undefined
			: this.appConfig.session.account;
		return account || new Account();
	}

	/** Prepares account information */
	prepareAccount(data: any) {
		const account: {
			Roles: Array<string>,
			Privileges: Array<Privilege>,
			Status: string,
			TwoFactorsAuthentication: { Required: boolean, Providers: Array<{Label: string, Type: string, Time: Date, Info: string}> }
		} = {
			Roles: [],
			Privileges: [],
			Status: "Registered",
			TwoFactorsAuthentication: {
				Required: false,
				Providers: new Array<{Label: string, Type: string, Time: Date, Info: string}>()
			}
		};

		if (data.Roles && AppUtility.isArray(data.Roles)) {
			account.Roles = new List<string>(data.Roles)
				.Select(r => r.trim())
				.Distinct()
				.ToArray();
		}

		if (data.Privileges && AppUtility.isArray(data.Privileges)) {
			account.Privileges = (data.Privileges as Array<any>).map(p => Privilege.deserialize(p));
		}

		if (AppUtility.isNotEmpty(data.Status)) {
			account.Status = data.Status as string;
		}

		if (AppUtility.isObject(data.TwoFactorsAuthentication, true)) {
			account.TwoFactorsAuthentication.Required = AppUtility.isTrue(data.TwoFactorsAuthentication.Required);
			if (AppUtility.isArray(data.TwoFactorsAuthentication.Providers)) {
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
	updateAccount(data: any, onCompleted?: () => void) {
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
	patchAccount(onNext?: () => void, defer?: number) {
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

	/** Store the information of current account profile into storage */
	async storeProfileAsync(onCompleted?: (data?: any) => void) {
		await this.storeSessionAsync();
		AppEvents.broadcast("AccountIsUpdated", { Type: "Profile" });
		if (onCompleted !== undefined) {
			onCompleted(this.appConfig.session);
		}
	}

	/** Watch the connection of Facebook */
	watchFacebookConnect() {
		FB.Event.subscribe("auth.authResponseChange",
			response => {
				if (response.status === "connected") {
					this.appConfig.facebook.token = response.authResponse.accessToken;
					this.appConfig.facebook.id = response.authResponse.userID;
					console.log(`[${this.Name}]: Facebook is connected`, this.appConfig.isDebug ? this.appConfig.facebook : "");

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
	getFacebookProfile() {
		FB.api("/" + this.appConfig.facebook.version + "/me?fields=id,name,picture&access_token=" + this.appConfig.facebook.token,
			response => {
				this.appConfig.session.account.facebook = {
					id: response.id,
					name: response.name,
					profileUrl: "https://www.facebook.com/app_scoped_user_id/" + response.id,
					pictureUrl: undefined
				};

				this.storeProfileAsync(() => {
					console.log(`[${this.Name}]: Account profile is updated with information of Facebook profile`, this.appConfig.isDebug ? this.appConfig.session.account : "");
				});

				this.getFacebookAvatar();
			}
		);
	}

	/** Get the avatar picture (large picture) of Facebook profile */
	getFacebookAvatar() {
		if (this.appConfig.session.account.facebook && this.appConfig.session.account.facebook.id && this.appConfig.session.token && this.appConfig.session.token.oauths
			&& this.appConfig.session.token.oauths["facebook"] && this.appConfig.session.token.oauths["facebook"] === this.appConfig.session.account.facebook.id) {
			FB.api("/" + this.appConfig.facebook.version + "/" + this.appConfig.session.account.facebook.id + "/picture?type=large&redirect=false&access_token=" + this.appConfig.facebook.token,
				response => {
					this.appConfig.session.account.facebook.pictureUrl = response.data.url;
					this.storeProfileAsync(() => {
						console.log(`[${this.Name}]: Account is updated with information of Facebook profile (large profile picture)`, this.appConfig.isDebug ? response : "");
					});
				}
			);
		}
	}

}
