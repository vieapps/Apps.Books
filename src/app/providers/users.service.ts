import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import { AppRTU } from "../components/app.rtu";
import { AppEvents } from "../components/app.events";
import { AppCrypto } from "../components/app.crypto";
import { AppUtility } from "../components/app.utility";
import { AppCustomCompleter } from "../components/app.completer";
import { AppPagination } from "../components/app.pagination";
import { Account } from "../models/account";
import { UserProfile } from "../models/user";
import { Privilege } from "../models/privileges";
import { Base as BaseService } from "./base.service";
import { ConfigurationService } from "./configuration.service";

@Injectable()
export class UsersService extends BaseService {

	constructor (
		public http: Http,
		public configSvc: ConfigurationService
	) {
		super(http, "Users");
		AppRTU.registerAsServiceScopeProcessor(this.Name, message => this.processUpdateMessageAsync(message));
		if (this.configSvc.isDebug) {
			AppRTU.registerAsObjectScopeProcessor(this.Name, "Session", () => {});
			AppRTU.registerAsObjectScopeProcessor(this.Name, "Account", () => {});
			AppRTU.registerAsObjectScopeProcessor(this.Name, "Profile", () => {});
			AppRTU.registerAsObjectScopeProcessor(this.Name, "Status", () => {});
		}
	}

	public get searchURI() {
		return `users/profile/search?${this.configSvc.relatedQuery}&x-request=`;
	}

	public get completerDataSource() {
		return new AppCustomCompleter(
			term => this.searchURI + AppUtility.toBase64Url(AppPagination.buildRequest({ Query: term })),
			data => (data.Objects as Array<any> || []).map(o => {
				const profile = UserProfile.deserialize(o);
				return {
					title: profile.Name,
					description: profile.Email.substr(0, profile.Email.indexOf("@") + 1) + "...",
					image: profile.avatarURI,
					originalObject: profile
				};
			})
		);
	}

	public async searchAsync(request: any, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.searchAsync(
			this.searchURI,
			request,
			AppUtility.isNotNull(onNext)
				? data => {
					if (data !== undefined) {
						(data.Objects as Array<any> || []).forEach(o => UserProfile.update(o));
					}
					onNext(data);
				}
				: undefined,
			error => {
				console.error(this.getErrorMessage("Error occurred while searching", error));
				if (onError !== undefined) {
					onError(error);
				}
			}
		);
	}

	public async registerAsync(body: any, captcha: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		body["Email"] = AppCrypto.rsaEncrypt(body["Email"]);
		body["Password"] = AppCrypto.rsaEncrypt(body["Password"]);
		body["ReferID"] = this.configSvc.appConfig.refer.id;
		body["ReferSection"] = this.configSvc.appConfig.refer.section;
		await super.createAsync(
			`users/account?${this.configSvc.relatedQuery}&uri=${this.configSvc.activateURI}`,
			body,
			onNext,
			onError,
			this.configSvc.appConfig.getCaptchaHeaders(captcha)
		);
	}

	public async sendInvitationAsync(name: string, email: string, privileges?: Array<Privilege>, relatedInfo?: any, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const body = {
			Name: name,
			Email: AppCrypto.rsaEncrypt(email),
			Campaign: "InApp-Invitation",
			Medium: this.configSvc.appConfig.app.id
		};
		if (privileges !== undefined) {
			body["Privileges"] = AppCrypto.rsaEncrypt(JSON.stringify(privileges));
		}
		if (relatedInfo !== undefined) {
			body["RelatedInfo"] = AppCrypto.rsaEncrypt(JSON.stringify(relatedInfo));
		}
		await super.createAsync(
			`users/account/invite?${this.configSvc.relatedQuery}&uri=${this.configSvc.activateURI}`,
			body,
			onNext,
			error => {
				console.error(this.getErrorMessage("Error occurred while sending an invitation", error));
				if (onError !== undefined) {
					onError(error);
				}
			}
		);
	}

	public async activateAsync(mode: string, code: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.readAsync(
			`users/activate?mode=${mode}&code=${code}&${this.configSvc.relatedQuery}`,
			async data => {
				await this.configSvc.updateSessionAsync(data, () => {
					console.log(this.getLogMessage("Activated..."), this.configSvc.isDebug ? this.configSvc.appConfig.session : "");
					if (onNext !== undefined) {
						onNext(data);
					}
				});
			},
			error => {
				console.error(this.getErrorMessage(`Error occurred while activating (${mode})`, error));
				if (onError !== undefined) {
					onError(error);
				}
			}
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
			await super.readAsync(
				`users/profile/${id}?${this.configSvc.relatedQuery}`,
				data => {
					UserProfile.update(data);
					if (onNext !== undefined) {
						onNext(data);
					}
				},
				error => {
					console.error(this.getErrorMessage("Error occurred while reading profile", error));
					if (onError !== undefined) {
						onError(error);
					}
				}
			);
		}
	}

	public async updateProfileAsync(body: any, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.updateAsync(
			`users/profile/${body.ID || this.configSvc.getAccount().id}?${this.configSvc.relatedQuery}`,
			body,
			data => {
				UserProfile.update(data);
				if (onNext !== undefined) {
					onNext(data);
				}
			},
			error => {
				console.error(this.getErrorMessage("Error occurred while updating profile", error));
				if (onError !== undefined) {
					onError(error);
				}
			}
		);
	}

	public async updatePasswordAsync(password: string, newPassword: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.updateAsync(
			`users/account/password?${this.configSvc.relatedQuery}`,
			{
				OldPassword: AppCrypto.rsaEncrypt(password),
				Password: AppCrypto.rsaEncrypt(newPassword)
			},
			onNext,
			error => {
				console.error(this.getErrorMessage("Error occurred while updating password", error));
				if (onError !== undefined) {
					onError(error);
				}
			}
		);
	}

	public async updateEmailAsync(password: string, newEmail: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.updateAsync(
			`users/account/email?${this.configSvc.relatedQuery}`,
			{
				OldPassword: AppCrypto.rsaEncrypt(password),
				Email: AppCrypto.rsaEncrypt(newEmail)
			},
			onNext,
			error => {
				console.error(this.getErrorMessage("Error occurred while updating email", error));
				if (onError !== undefined) {
					onError(error);
				}
			}
		);
	}

	public async prepare2FAMethodAsync(onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.readAsync(
			`users/otp?${this.configSvc.relatedQuery}`,
			onNext,
			error => {
				console.error(this.getErrorMessage("Error occurred while preparing an 2FA method", error));
				if (onError !== undefined) {
					onError(error);
				}
			}
		);
	}

	public async add2FAMethodAsync(password: string, provisioning: string, otp: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.updateAsync(
			`users/otp?${this.configSvc.relatedQuery}`,
			{
				Provisioning: provisioning,
				OTP: otp
			},
			data => this.configSvc.updateAccount(data, onNext),
			error => {
				console.error(this.getErrorMessage("Error occurred while adding an 2FA method", error));
				if (onError !== undefined) {
					onError(error);
				}
			},
			{
				"x-password": AppCrypto.rsaEncrypt(password),
			}
		);
	}

	public async delete2FAMethodAsync(password: string, info: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.deleteAsync(
			`users/otp?info=${info}&${this.configSvc.relatedQuery}`,
			data => this.configSvc.updateAccount(data, onNext),
			error => {
				console.error(this.getErrorMessage("Error occurred while deleting an 2FA method", error));
				if (onError !== undefined) {
					onError(error);
				}
			},
			{
				"x-password": AppCrypto.rsaEncrypt(password),
			}
		);
	}

	public async getPrivilegesAsync(id: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		if (Account.instances.containsKey(id)) {
			if (onNext !== undefined) {
				onNext();
			}
		}
		else {
			await super.readAsync(
				`users/account/${id}?${this.configSvc.relatedQuery}`,
				data => this.configSvc.updateAccount(data, onNext, true),
				error => {
					console.error(this.getErrorMessage("Error occurred while reading privileges", error));
					if (onError !== undefined) {
						onError(error);
					}
				}
			);
		}
	}

	public async updatePrivilegesAsync(id: string, privileges: Array<Privilege>, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.updateAsync(
			`users/account/${id}?${this.configSvc.relatedQuery}`,
			{
				Privileges: AppCrypto.rsaEncrypt(JSON.stringify(privileges))
			},
			data => this.configSvc.updateAccount(data, onNext, true),
			error => {
				console.error(this.getErrorMessage("Error occurred while updating privileges", error));
				if (onError !== undefined) {
					onError(error);
				}
			}
		);
	}

	private async processUpdateMessageAsync(message: { Type: { Service: string, Object: string, Event: string }, Data: any }) {
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
				this.configSvc.updateAccount(message.Data);
				break;

			case "Profile":
				UserProfile.update(message.Data);
				if (this.configSvc.isAuthenticated && this.configSvc.getAccount().id === message.Data.ID) {
					this.configSvc.getAccount().profile = UserProfile.get(message.Data.ID);
					this.configSvc.appConfig.options.i18n = this.configSvc.getAccount().profile.Language;
					await Promise.all([
						this.configSvc.storeOptionsAsync(),
						this.configSvc.storeProfileAsync(() => {
							if (this.configSvc.isDebug) {
								console.log(this.getLogMessage("User profile is updated"), this.configSvc.getAccount().profile);
							}
							if (this.configSvc.appConfig.facebook.token !== undefined && this.configSvc.appConfig.facebook.id !== undefined) {
								this.configSvc.getFacebookProfile();
							}
						})
					]);
				}
				break;

			default:
				console.warn(this.getLogMessage("Got an update"), message);
				break;
		}
	}

}
