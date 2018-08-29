import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import { AppRTU } from "../components/app.rtu";
import { AppEvents } from "../components/app.events";
import { AppCrypto } from "../components/app.crypto";
import { AppUtility } from "../components/app.utility";
import { PlatformUtility } from "../components/app.utility.platform";
import { AppCustomCompleter } from "../components/app.completer";
import { AppPagination } from "../components/app.pagination";
import { UserProfile } from "../models/user";
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
		AppRTU.registerAsServiceScopeProcessor(this.Name, message => this.processRTUMessageAsync(message));
	}

	private async processRTUMessageAsync(message: { Type: { Service: string, Object: string, Event: string }, Data: any }) {
		switch (message.Type.Object) {
			case "Session":
				if (this.configSvc.appConfig.session.id === message.Data.ID && this.configSvc.isAuthenticated && this.configSvc.getAccount().id === message.Data.UserID) {
					switch (message.Type.Event) {
						case "Update":
							await this.configSvc.updateSessionAsync(message.Data, () => {
								console.warn(this.getLogMessage("The session is updated with new token"), this.configSvc.appConfig.session);
								this.configSvc.patchSession(() => this.configSvc.patchAccount());
							});
							break;

						case "Revoke":
							await this.configSvc.resetSessionAsync(async () => {
								await this.configSvc.initializeSessionAsync(async () => {
									await this.configSvc.registerSessionAsync(() => {
										console.warn(this.getLogMessage("The session is revoked by the APIs"), this.configSvc.isDebug ? this.configSvc.appConfig.session : "");
										this.configSvc.patchSession(() => AppEvents.broadcast("GoHome"));
									});
								});
							});
							break;

						case "Status":
							const profile = UserProfile.get(message.Data.UserID);
							if (profile !== undefined) {
								profile.IsOnline = message.Data.IsOnline;
								profile.LastAccess = new Date();
							}
							break;

						default:
							console.warn(this.getLogMessage("Got an update of session"), message);
							break;
					}
				}
				else {
					console.warn(this.getLogMessage("Got an update of session"), message);
				}
				break;

			case "Account":
				if (this.configSvc.isAuthenticated && this.configSvc.getAccount().id === message.Data.ID) {
					this.configSvc.updateAccount(message.Data);
					if (this.configSvc.isDebug) {
						console.log(this.getLogMessage("Account is updated"), this.configSvc.getAccount());
					}
				}
				break;

			case "Profile":
				UserProfile.update(message.Data);
				if (this.configSvc.isAuthenticated && this.configSvc.getAccount().id === message.Data.ID) {
					this.configSvc.getAccount().profile = UserProfile.get(message.Data.ID);
					await this.configSvc.storeProfileAsync(() => {
						if (this.configSvc.isDebug) {
							console.log(this.getLogMessage("User profile is updated"), this.configSvc.getAccount().profile);
						}
						if (this.configSvc.appConfig.facebook.token !== undefined && this.configSvc.appConfig.facebook.id !== undefined) {
							this.configSvc.getFacebookProfile();
						}
					});
				}
				break;

			default:
				console.warn(this.getLogMessage("Got an update"), message);
				break;
		}
	}

	private getSearchURI(request: any) {
		return "users/profile/search?x-request=" + AppUtility.toBase64Url(request) + "&" + this.configSvc.relatedQuery;
	}

	public get completerDataSource() {
		return new AppCustomCompleter(
			term => this.getSearchURI(AppPagination.buildRequest({ Query: term })),
			data => (data.Objects as Array<any>).map(o => {
				const profile = UserProfile.deserialize(o);
				return {
					title: profile.Name,
					description: profile.Email,
					image: profile.avatarUri,
					originalObject: profile
				};
			})
		);
	}

	public search(request: any, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = this.getSearchURI(request);
		onNext = AppUtility.isNotNull(onNext)
			? data => {
				(data.Objects as Array<any>).forEach(profile => UserProfile.update(profile));
				onNext(data);
			}
			: undefined;
		return super.search(path, request, onNext, onError);
	}

	public async registerAsync(body: any, captcha: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/account?" + this.configSvc.relatedQuery + "&uri=" + AppCrypto.urlEncode(PlatformUtility.activateURI);
		body["Email"] = AppCrypto.rsaEncrypt(body["Email"]);
		body["Password"] = AppCrypto.rsaEncrypt(body["Password"]);
		body["ReferID"] = this.configSvc.appConfig.refer.id;
		body["ReferSection"] = this.configSvc.appConfig.refer.section;
		await this.createAsync(path, body, onNext, onError, this.configSvc.appConfig.getCaptchaHeaders(captcha));
	}

	public async sendInvitationAsync(name: string, email: string, privileges?: Array<Privilege>, relatedInfo?: any, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/account/invite?" + this.configSvc.relatedQuery + "&uri=" + AppCrypto.urlEncode(PlatformUtility.activateURI);
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
		await this.createAsync(path, body, onNext, error => this.showError("Error occurred while sending an invitation", error, onError));
	}

	public async activateAsync(mode: string, code: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/activate?mode=" + mode + "&code=" + code + "&" + this.configSvc.relatedQuery;
		await this.readAsync(path,
			async data => {
				await this.configSvc.updateSessionAsync(data, () => {
					console.log(this.getLogMessage("Activated..."), this.configSvc.isDebug ? this.configSvc.appConfig.session : "");
					if (onNext !== undefined) {
						onNext(data);
					}
				});
			},
			error => this.showError(`Error occurred while activating (${mode})`, error, onError)
		);
	}

	public async getProfileAsync(id?: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		id = id || this.configSvc.getAccount().id;
		if (UserProfile.instances.containsKey(id)) {
			if (onNext !== undefined) {
				onNext();
			}
		}
		else {
			const path = "users/profile/" + id + "?" + this.configSvc.relatedQuery;
			await this.readAsync(path,
				data => {
					UserProfile.update(data);
					if (onNext !== undefined) {
						onNext(data);
					}
				},
				error => this.showError("Error occurred while reading profile", error, onError)
			);
		}
	}

	public async updateProfileAsync(body: any, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/profile/" + (body.ID || this.configSvc.getAccount().id) + "?" + this.configSvc.relatedQuery;
		await this.updateAsync(path, body,
			data => {
				UserProfile.update(data);
				if (onNext !== undefined) {
					onNext(data);
				}
			},
			error => this.showError("Error occurred while updating profile", error, onError)
		);
	}

	public async updatePasswordAsync(oldPassword: string, password: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/account/password?" + this.configSvc.relatedQuery;
		const body = {
			OldPassword: AppCrypto.rsaEncrypt(oldPassword),
			Password: AppCrypto.rsaEncrypt(password)
		};
		await this.updateAsync(path, body, onNext, error => this.showError("Error occurred while updating password", error, onError));
	}

	public async updateEmailAsync(oldPassword: string, email: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/account/email?" + this.configSvc.relatedQuery;
		const body = {
			OldPassword: AppCrypto.rsaEncrypt(oldPassword),
			Email: AppCrypto.rsaEncrypt(email)
		};
		await this.updateAsync(path, body, onNext, error => this.showError("Error occurred while updating email", error, onError));
	}

	public async prepare2FAMethodAsync(onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/otp?" + this.configSvc.relatedQuery;
		await this.readAsync(path, onNext, error => this.showError("Error occurred while preparing an 2FA method", error, onError));
	}

	public async add2FAMethodAsync(provisioning: string, otp: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/otp?" + this.configSvc.relatedQuery;
		const body = {
			Provisioning: provisioning,
			OTP: otp
		};
		await this.updateAsync(path, body, data => this.configSvc.updateAccount(data, onNext), error => this.showError("Error occurred while adding an 2FA method", error, onError));
	}

	public async delete2FAMethodAsync(info: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/otp?info=" + info + "&" + this.configSvc.relatedQuery;
		await this.deleteAsync(path, data => this.configSvc.updateAccount(data, onNext), error => this.showError("Error occurred while deleting an 2FA method", error, onError));
	}

	public async getPrivilegesAsync(id: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/account/" + id + "?" + this.configSvc.relatedQuery;
		await this.readAsync(path, onNext, error => this.showError("Error occurred while reading privileges", error, onError));
	}

	public async updatePrivilegesAsync(id: string, privileges: Array<Privilege>, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/account/" + id + "?" + this.configSvc.relatedQuery;
		const body = {
			Privileges: AppCrypto.rsaEncrypt(JSON.stringify(privileges))
		};
		await this.updateAsync(path, body, onNext, error => this.showError("Error occurred while updating privileges", error, onError));
	}

}
