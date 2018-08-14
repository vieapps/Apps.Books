import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import { List } from "linqts";
import { AppAPI } from "../components/app.api";
import { AppCrypto } from "../components/app.crypto";
import { AppRTU } from "../components/app.rtu";
import { AppEvents } from "../components/app.events";
import { AppUtility } from "../components/app.utility";
import { PlatformUtility } from "../components/app.utility.platform";
import { AppData } from "../app.data";
import { Profile } from "../models/profile";
import { Privilege } from "../models/privileges";
import { Base as BaseService } from "./base.service";
import { ConfigurationService } from "./configuration.service";

@Injectable()
export class UserService extends BaseService {

	constructor (
		public http: Http,
		public configSvc: ConfigurationService
	) {
		super(http, "Users");
		AppRTU.registerAsServiceScopeProcessor(this.Name, async (message) => {
			const info = AppRTU.parse(message.Type);
			switch (info.Object) {
				case "Account":
					if (this.configSvc.appConfig.session.account && this.configSvc.appConfig.session.account.id === message.Data.ID) {
						this.configSvc.updateAccount(message.Data);
					}
					break;

				case "Session":
					if (this.configSvc.appConfig.session.id === message.Data.ID && this.configSvc.appConfig.session.account && this.configSvc.appConfig.session.account.id === message.Data.UserID) {
						switch (info.Event) {
							case "Update":
								await this.configSvc.updateSessionAsync(message.Data, () => {
									if (this.configSvc.appConfig.isDebug) {
										console.warn(`[${this.Name}]: Update session with the new token`, this.configSvc.appConfig.session);
									}
									this.configSvc.patchSession(() => this.configSvc.patchAccount());
								});
								break;

							case "Revoke":
								await this.configSvc.deleteSessionAsync(async () => {
									AppEvents.broadcast("AccountIsUpdated", { Type: "Revoke" });
									await this.configSvc.initializeSessionAsync(async () => {
										await this.configSvc.registerSessionAsync(() => {
											console.log(`[${this.Name}]: Revoke session`, this.configSvc.appConfig.isDebug ? this.configSvc.appConfig.session : "");
											AppEvents.broadcast("OpenHomePage");
											this.configSvc.patchSession();
										});
									});
								});
								break;

							case "Status":
								const profile = AppData.profiles.getValue(message.Data.UserID);
								if (profile !== undefined) {
									profile.IsOnline = message.Data.IsOnline;
									profile.LastAccess = new Date();
								}
								if (this.configSvc.appConfig.session.id === message.Data.SessionID && this.configSvc.appConfig.session.account && this.configSvc.appConfig.session.account.id === message.Data.UserID && this.configSvc.appConfig.session.account.profile !== null) {
									this.configSvc.appConfig.session.account.profile.IsOnline = true;
									this.configSvc.appConfig.session.account.profile.LastAccess = new Date();
								}
								break;

							default:
								console.warn(`[${this.Name}]: Got an update of session`, message);
								break;
						}
					}
					else {
						console.warn(`[${this.Name}]: Got an update of session`, message);
					}
					break;

				case "Profile":
					Profile.update(message.Data);
					if (this.configSvc.appConfig.session.account && this.configSvc.appConfig.session.account.id === message.Data.ID && this.configSvc.appConfig.session.token && this.configSvc.appConfig.session.token.uid === message.Data.ID) {
						this.configSvc.appConfig.session.account.id = message.Data.ID;
						this.configSvc.appConfig.session.account.profile = AppData.profiles.getValue(message.Data.ID);
						await this.configSvc.storeProfileAsync(() => {
							if (this.configSvc.appConfig.isDebug) {
								console.log(`[${this.Name}]: Account profile is updated`, this.configSvc.appConfig.session.account);
							}
							if (this.configSvc.appConfig.facebook.token && this.configSvc.appConfig.facebook.id) {
								this.configSvc.getFacebookProfile();
							}
						});
					}
					break;

				default:
					console.warn(`[${this.Name}]: Got an update`, message);
					break;
			}
		});
	}

	search(request: any, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/profile/search"
			+ "?x-request=" + AppUtility.toBase64Url(request)
			+ "&related-service=" + this.configSvc.appConfig.app.service
			+ "&language=" + AppUtility.getLanguage();
		onNext = AppUtility.isNull(onNext)
			? undefined
			: data => {
				(data.Objects as Array<any>).forEach(p => Profile.update(p));
				onNext(data);
			};
		return super.search(path, request, onNext, onError);
	}

	registerAsync(info: any, captcha: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/account"
			+ "?related-service=" + this.configSvc.appConfig.app.service
			+ "&language=" + AppUtility.getLanguage()
			+ "&host=" + PlatformUtility.getHost()
			+ "&uri=" + AppCrypto.urlEncode(PlatformUtility.getActivateURI());

		const body = AppUtility.clone(info, ["ConfirmEmail", "ConfirmPassword", "Captcha"]);
		body.Email = AppCrypto.rsaEncrypt(body.Email);
		body.Password = AppCrypto.rsaEncrypt(body.Password);
		body.ReferID = this.configSvc.appConfig.refer.id;
		body.ReferSection = this.configSvc.appConfig.refer.section;

		return this.createAsync(path, body, onNext, onError, AppAPI.getCaptchaHeaders(captcha));
	}

	sendInvitationAsync(name: string, email: string, privileges?: Array<Privilege>, relatedInfo?: any, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/account/invite"
			+ "?related-service=" + this.configSvc.appConfig.app.service
			+ "&language=" + AppUtility.getLanguage()
			+ "&host=" + PlatformUtility.getHost()
			+ "&uri=" + AppCrypto.urlEncode(PlatformUtility.getURI("/home") + "?prego=activate&mode={mode}&code={code}");

		const body = {
			Name: name,
			Email: AppCrypto.rsaEncrypt(email),
			Campaign: "InApp-Invitation",
			Medium: this.configSvc.appConfig.app.id
		};
		if (privileges) {
			body["Privileges"] = AppCrypto.rsaEncrypt(JSON.stringify(privileges));
		}
		if (relatedInfo) {
			body["RelatedInfo"] = AppCrypto.rsaEncrypt(JSON.stringify(relatedInfo));
		}

		return this.createAsync(path, body, onNext, error => this.showError("Error occurred while sending an invitation", error, onError));
	}

	activateAsync(mode: string, code: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/activate"
			+ "?mode=" + mode
			+ "&code=" + code
			+ "&related-service=" + this.configSvc.appConfig.app.service
			+ "&language=" + AppUtility.getLanguage()
			+ "&host=" + PlatformUtility.getHost();
		return this.readAsync(path,
			async (data) => {
				await this.configSvc.updateSessionAsync(data, () => {
					this.configSvc.appConfig.session.account.id = this.configSvc.appConfig.session.token.uid;
					this.configSvc.storeSessionAsync();
					console.log("[User]: Activated...", this.configSvc.appConfig.isDebug ? this.configSvc.appConfig.session : "");
					if (onNext !== undefined) {
						onNext(data);
					}
				});
			},
			error => this.showError("Error occurred while activating (" + mode + ")", error, onError)
		);
	}

	getProfileAsync(id?: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		id = id || this.configSvc.getAccount().id;
		if (AppData.profiles.containsKey(id)) {
			if (onNext !== undefined) {
				onNext();
			}
		}
		else {
			const path = "users/profile/" + id
				+ "?related-service=" + this.configSvc.appConfig.app.service
				+ "&language=" + AppUtility.getLanguage()
				+ "&host=" + PlatformUtility.getHost();
			return this.readAsync(path,
				data => {
					const profile = Profile.deserialize(data);
					AppData.profiles.setValue(profile.ID, profile);
					if (onNext !== undefined) {
						onNext(data);
					}
				},
				error => this.showError("Error occurred while reading profile", error, onError)
			);
		}
	}

	requestProfile(id?: string, onNext?: () => void) {
		id = id || this.configSvc.getAccount().id;
		if (!AppData.profiles.containsKey(id)) {
			this.send({
				ServiceName: "users",
				ObjectName: "profile",
				Verb: "GET",
				Query: {
					"object-identity": id,
					"related-service": this.configSvc.appConfig.app.service,
					"language": AppUtility.getLanguage(),
					"host": PlatformUtility.getHost()
				},
				Header: null,
				Body: null,
				Extra: null
			});
		}
		if (onNext !== undefined) {
			onNext();
		}
	}

	updateProfileAsync(body: any, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/profile/" + (body.ID || this.configSvc.getAccount().id)
			+ "?related-service=" + this.configSvc.appConfig.app.service
			+ "&language=" + AppUtility.getLanguage()
			+ "&host=" + PlatformUtility.getHost();
		return this.updateAsync(path, body,
			data => {
				const profile = Profile.deserialize(data);
				AppData.profiles.setValue(profile.ID, profile);
				AppEvents.broadcast("Session", { Type: "Update", Info: data });
				if (onNext !== undefined) {
					onNext(data);
				}
			},
			error => this.showError("Error occurred while updating profile", error, onError)
		);
	}

	updatePasswordAsync(oldPassword: string, password: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/account/password"
			+ "?related-service=" + this.configSvc.appConfig.app.service
			+ "&language=" + AppUtility.getLanguage()
			+ "&host=" + PlatformUtility.getHost();
		const body = {
			OldPassword: AppCrypto.rsaEncrypt(oldPassword),
			Password: AppCrypto.rsaEncrypt(password)
		};
		return this.updateAsync(path, body, onNext, error => this.showError("Error occurred while updating password", error, onError));
	}

	updateEmailAsync(oldPassword: string, email: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/account/email"
			+ "?related-service=" + this.configSvc.appConfig.app.service
			+ "&language=" + AppUtility.getLanguage()
			+ "&host=" + PlatformUtility.getHost();
		const body = {
			OldPassword: AppCrypto.rsaEncrypt(oldPassword),
			Email: AppCrypto.rsaEncrypt(email)
		};
		return this.updateAsync(path, body, onNext, error => this.showError("Error occurred while updating email", error, onError));
	}

	add2FAMethodAsync(body: any, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/otp"
			+ "?related-service=" + this.configSvc.appConfig.app.service
			+ "&language=" + AppUtility.getLanguage()
			+ "&host=" + PlatformUtility.getHost();
		return this.updateAsync(path, body, onNext, error => this.showError("Error occurred while adding new an 2FA method", error, onError));
	}

	delete2FAMethodAsync(info: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/otp"
			+ "?info=" + info
			+ "&related-service=" + this.configSvc.appConfig.app.service
			+ "&language=" + AppUtility.getLanguage()
			+ "&host=" + PlatformUtility.getHost();
		return this.deleteAsync(path, onNext, error => this.showError("Error occurred while deleting an 2FA method", error, onError));
	}

	getPrivilegesAsync(id?: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/account/" + (id || this.configSvc.getAccount().id)
			+ "?related-service=" + this.configSvc.appConfig.app.service
			+ "&language=" + AppUtility.getLanguage()
			+ "&host=" + PlatformUtility.getHost();
		return this.readAsync(path, onNext, error => this.showError("Error occurred while reading privileges", error, onError));
	}

	updatePrivilegesAsync(id: string, privileges: Array<Privilege>, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/account/" + id
			+ "?related-service=" + this.configSvc.appConfig.app.service
			+ "&language=" + AppUtility.getLanguage()
			+ "&host=" + PlatformUtility.getHost();
		const body = {
			Privileges: AppCrypto.rsaEncrypt(JSON.stringify(privileges))
		};
		return this.updateAsync(path, body, onNext, error => this.showError("Error occurred while updating privileges", error, onError));
	}

}
