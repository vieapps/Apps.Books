import { Injectable } from "@angular/core";
import { AppRTU, AppMessage } from "../components/app.apis";
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

	constructor(public configSvc: ConfigurationService) {
		super("Users");
		AppRTU.registerAsServiceScopeProcessor(this.name, message => this.processUpdateMessageAsync(message));
		if (this.configSvc.isDebug) {
			AppRTU.registerAsObjectScopeProcessor(this.name, "Session", () => {});
			AppRTU.registerAsObjectScopeProcessor(this.name, "Account", () => {});
			AppRTU.registerAsObjectScopeProcessor(this.name, "Profile", () => {});
			AppRTU.registerAsObjectScopeProcessor(this.name, "Status", () => {});
		}
	}

	public get completerDataSource() {
		return new AppCustomCompleter(
			term => AppUtility.format(super.getSearchURI("profile", this.configSvc.relatedQuery), { request: AppUtility.toBase64Url(AppPagination.buildRequest({ Query: term })) }),
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

	public search(request: any, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return super.search(
			super.getSearchURI("profile", this.configSvc.relatedQuery),
			request,
			data => {
				if (data !== undefined && AppUtility.isArray(data.Objects, true)) {
					(data.Objects as Array<any>).forEach(o => UserProfile.update(o));
				}
				if (onNext !== undefined) {
					onNext(data);
				}
			},
			error => {
				console.error(this.getErrorMessage("Error occurred while searching", error));
				if (onError !== undefined) {
					onError(error);
				}
			}
		);
	}

	public searchAsync(request: any, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return super.searchAsync(
			super.getSearchURI("profile", this.configSvc.relatedQuery),
			request,
			data => {
				if (data !== undefined && AppUtility.isArray(data.Objects, true)) {
					(data.Objects as Array<any>).forEach(o => UserProfile.update(o));
				}
				if (onNext !== undefined) {
					onNext(data);
				}
			},
			error => {
				console.error(this.getErrorMessage("Error occurred while searching", error));
				if (onError !== undefined) {
					onError(error);
				}
			}
		);
	}

	public registerAsync(body: any, captcha: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		body["Email"] = AppCrypto.rsaEncrypt(body["Email"]);
		body["Password"] = AppCrypto.rsaEncrypt(body["Password"]);
		body["ReferID"] = this.configSvc.appConfig.refer.id;
		body["ReferSection"] = this.configSvc.appConfig.refer.section;
		return super.createAsync(
			super.getURI("account", undefined, `uri=${this.configSvc.activateURI}&${this.configSvc.relatedQuery}`),
			body,
			onNext,
			onError,
			this.configSvc.appConfig.getCaptchaHeaders(captcha),
			true
		);
	}

	public sendInvitationAsync(name: string, email: string, privileges?: Array<Privilege>, relatedInfo?: { [key: string]: any }, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const body = {
			Name: name,
			Email: AppCrypto.rsaEncrypt(email),
			Campaign: "InApp-Invitation",
			Medium: this.configSvc.appConfig.app.id
		};
		if (privileges !== undefined) {
			body["Privileges"] = AppCrypto.aesEncrypt(JSON.stringify(privileges));
		}
		if (relatedInfo !== undefined) {
			body["RelatedInfo"] = AppCrypto.aesEncrypt(JSON.stringify(relatedInfo));
		}
		return super.createAsync(
			super.getURI("account", "invite", `uri=${this.configSvc.activateURI}&${this.configSvc.relatedQuery}`),
			body,
			onNext,
			error => {
				console.error(this.getErrorMessage("Error occurred while sending an invitation", error));
				if (onError !== undefined) {
					onError(error);
				}
			},
			undefined,
			true
		);
	}

	public activateAsync(mode: string, code: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return super.readAsync(
			super.getURI("activate", undefined, `mode=${mode}&code=${code}&${this.configSvc.relatedQuery}`),
			async data => await this.configSvc.updateSessionAsync(data, () => {
				console.log(this.getLogMessage("Activated..."), this.configSvc.isDebug ? this.configSvc.appConfig.session : "");
				if (onNext !== undefined) {
					onNext(data);
				}
			}),
			error => {
				console.error(this.getErrorMessage(`Error occurred while activating (${mode})`, error));
				if (onError !== undefined) {
					onError(error);
				}
			},
			undefined,
			true
		);
	}

	public async getProfileAsync(id?: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		id = id || this.configSvc.getAccount().id;
		return UserProfile.instances.containsKey(id)
			? new Promise<void>(onNext !== undefined ? () => onNext() : () => {})
			: super.readAsync(
					super.getURI("profile", id, this.configSvc.relatedQuery),
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

	public updateProfileAsync(body: any, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return super.updateAsync(
			super.getURI("profile", body.ID || this.configSvc.getAccount().id, this.configSvc.relatedQuery),
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

	public updatePasswordAsync(password: string, newPassword: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return super.updateAsync(
			super.getURI("account", "password", this.configSvc.relatedQuery),
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
			},
			undefined,
			true
		);
	}

	public updateEmailAsync(password: string, newEmail: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return super.updateAsync(
			super.getURI("account", "email", this.configSvc.relatedQuery),
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
			},
			undefined,
			true
		);
	}

	public prepare2FAMethodAsync(onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return super.readAsync(
			super.getURI("otp", undefined, this.configSvc.relatedQuery),
			onNext,
			error => {
				console.error(this.getErrorMessage("Error occurred while preparing an 2FA method", error));
				if (onError !== undefined) {
					onError(error);
				}
			}
		);
	}

	public add2FAMethodAsync(password: string, provisioning: string, otp: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return super.updateAsync(
			super.getURI("otp", undefined, this.configSvc.relatedQuery),
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

	public delete2FAMethodAsync(password: string, info: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return super.deleteAsync(
			super.getURI("otp", undefined, `info=${info}&${this.configSvc.relatedQuery}`),
			data => this.configSvc.updateAccount(data, onNext),
			error => {
				console.error(this.getErrorMessage("Error occurred while deleting an 2FA method", error));
				if (onError !== undefined) {
					onError(error);
				}
			},
			{
				"x-password": AppCrypto.rsaEncrypt(password),
			},
			true
		);
	}

	public async getPrivilegesAsync(id: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return Account.instances.containsKey(id)
			? new Promise<void>(onNext !== undefined ? () => onNext() : () => {})
			: super.readAsync(
					super.getURI("account", id, this.configSvc.relatedQuery),
					data => this.configSvc.updateAccount(data, onNext, true),
					error => {
						console.error(this.getErrorMessage("Error occurred while reading privileges", error));
						if (onError !== undefined) {
							onError(error);
						}
					}
				);
	}

	public updatePrivilegesAsync(id: string, privileges: { [key: string]: Array<Privilege> }, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return super.updateAsync(
			super.getURI("account", id, this.configSvc.relatedQuery),
			{
				Privileges: AppCrypto.aesEncrypt(JSON.stringify(privileges))
			},
			data => this.configSvc.updateAccount(data, onNext, true),
			error => {
				console.error(this.getErrorMessage("Error occurred while updating privileges", error));
				if (onError !== undefined) {
					onError(error);
				}
			},
			undefined,
			true
		);
	}

	private async processUpdateMessageAsync(message: AppMessage) {
		const account = this.configSvc.getAccount();
		switch (message.Type.Object) {
			case "Session":
				const isCurrentSession = this.configSvc.appConfig.session.id === message.Data.ID && this.configSvc.isAuthenticated && account.id === message.Data.UserID;
				switch (message.Type.Event) {
					case "Update":
						if (isCurrentSession) {
							await this.configSvc.updateSessionAsync(message.Data, () => {
								console.warn(this.getLogMessage("The session is updated with new token"), this.configSvc.appConfig.session);
								this.configSvc.patchSession(() => this.configSvc.patchAccount());
								AppEvents.sendToElectron(this.name, { Type: "Session", Data: this.configSvc.appConfig.session });
							});
						}
						break;

					case "Revoke":
						if (isCurrentSession) {
							await this.configSvc.resetSessionAsync(async () => {
								await this.configSvc.initializeSessionAsync(async () => {
									await this.configSvc.registerSessionAsync(() => {
										console.warn(this.getLogMessage("The session is revoked by the APIs"), this.configSvc.isDebug ? this.configSvc.appConfig.session : "");
										this.configSvc.patchSession(() => AppEvents.broadcast("Navigate", { Direction: "Home" } ));
										AppEvents.sendToElectron(this.name, { Type: "LogOut", Data: this.configSvc.appConfig.session });
									});
								});
							});
						}
						break;

					case "Status":
						const userProfile = UserProfile.get(message.Data.UserID);
						if (userProfile !== undefined) {
							userProfile.IsOnline = this.configSvc.isAuthenticated && account.id === userProfile.ID ? true : message.Data.IsOnline;
							userProfile.LastAccess = new Date();
							AppEvents.sendToElectron(this.name, message);
						}
						break;

					default:
						console.warn(this.getLogMessage("Got an update of session"), message);
						break;
				}
				break;

			case "Status":
				const accountProfile = UserProfile.get(message.Data.UserID);
				if (accountProfile !== undefined) {
					accountProfile.IsOnline = this.configSvc.isAuthenticated && account.id === accountProfile.ID ? true : message.Data.IsOnline;
					accountProfile.LastAccess = new Date();
					AppEvents.sendToElectron(this.name, message);
				}
				break;

			case "Account":
				this.configSvc.updateAccount(message.Data);
				if (this.configSvc.isAuthenticated && account.id === message.Data.ID) {
					AppEvents.sendToElectron(this.name, message);
				}
				break;

			case "Profile":
				UserProfile.update(message.Data);
				if (this.configSvc.isAuthenticated && account.id === message.Data.ID) {
					account.profile = UserProfile.get(message.Data.ID);
					account.profile.IsOnline = true;
					account.profile.LastAccess = new Date();
					await this.configSvc.storeProfileAsync(async () => {
						if (this.configSvc.appConfig.options.i18n !== account.profile.Language) {
							await this.configSvc.changeLanguageAsync(account.profile.Language);
						}
						else {
							await this.configSvc.storeOptionsAsync();
						}
						if (this.configSvc.appConfig.facebook.token !== undefined && this.configSvc.appConfig.facebook.id !== undefined) {
							this.configSvc.getFacebookProfile();
						}
						AppEvents.sendToElectron(this.name, message);
						if (this.configSvc.isDebug) {
							console.log(this.getLogMessage("User profile is updated"), account.profile);
						}
					});
				}
				break;

			default:
				console.warn(this.getLogMessage("Got an update"), message);
				break;
		}
	}

}
