import { Injectable } from "@angular/core";
import { DatePipe } from "@angular/common";
import { AppXHR, AppRTU, AppMessage } from "@components/app.apis";
import { AppEvents } from "@components/app.events";
import { AppCrypto } from "@components/app.crypto";
import { AppUtility } from "@components/app.utility";
import { AppCustomCompleter } from "@components/app.completer";
import { AppPagination } from "@components/app.pagination";
import { AppFormsControlConfig } from "@components/forms.service";
import { Account } from "@models/account";
import { UserProfile } from "@models/user";
import { Privilege } from "@models/privileges";
import { Base as BaseService } from "@services/base.service";
import { ConfigurationService } from "@services/configuration.service";
import { AuthenticationService } from "@services/authentication.service";

@Injectable()
export class UsersService extends BaseService {

	constructor(
		private configSvc: ConfigurationService,
		private authSvc: AuthenticationService,
		private datePipe: DatePipe
	) {
		super("Users");
		AppRTU.registerAsServiceScopeProcessor(this.name, async message => await this.processUpdateMessageAsync(message));
	}

	public get completerDataSource() {
		const convertToCompleterItem = (data: any) => {
			const profile = data === undefined
				? undefined
				: data instanceof UserProfile
					? data as UserProfile
					: UserProfile.deserialize(data);
			return profile === undefined
				? undefined
				: { title: profile.Name, description: profile.getEmail(!this.authSvc.isSystemAdministrator()), image: profile.avatarURI, originalObject: profile };
		};
		return new AppCustomCompleter(
			term => AppUtility.format(super.getSearchURI("profile", this.configSvc.relatedQuery), { request: AppUtility.toBase64Url(AppPagination.buildRequest({ Query: term })) }),
			data => (data.Objects as Array<any> || []).map(obj => UserProfile.contains(obj.ID) ? convertToCompleterItem(UserProfile.get(obj.ID)) : convertToCompleterItem(UserProfile.update(UserProfile.deserialize(obj)))),
			convertToCompleterItem
		);
	}

	public search(request: any, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return super.search(
			super.getSearchURI("profile", this.configSvc.relatedQuery),
			request,
			data => {
				if (data !== undefined && AppUtility.isArray(data.Objects, true)) {
					(data.Objects as Array<any>).forEach(obj => {
						if (!UserProfile.contains(obj.ID)) {
							UserProfile.update(obj);
						}
					});
				}
				if (onNext !== undefined) {
					onNext(data);
				}
			},
			error => {
				console.error(super.getErrorMessage("Error occurred while searching", error));
				if (onError !== undefined) {
					onError(error);
				}
			}
		);
	}

	public async searchAsync(request: any, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.searchAsync(
			super.getSearchURI("profile", this.configSvc.relatedQuery),
			request,
			data => {
				if (data !== undefined && AppUtility.isArray(data.Objects, true)) {
					(data.Objects as Array<any>).forEach(obj => {
						if (!UserProfile.contains(obj.ID)) {
							UserProfile.update(obj);
						}
					});
				}
				if (onNext !== undefined) {
					onNext(data);
				}
			},
			error => {
				console.error(super.getErrorMessage("Error occurred while searching", error));
				if (onError !== undefined) {
					onError(error);
				}
			}
		);
	}

	public async registerAsync(registerInfo: any, captcha: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.createAsync(
			super.getURI("account", undefined, `uri=${this.configSvc.activateURI}&${this.configSvc.relatedQuery}`),
			AppUtility.clone(registerInfo, ["ConfirmEmail", "ConfirmPassword", "Captcha"], undefined, body => {
				body.Email = AppCrypto.rsaEncrypt(body.Email);
				body.Password = AppCrypto.rsaEncrypt(body.Password);
				body["ReferID"] = this.configSvc.appConfig.refer.id;
				body["ReferSection"] = this.configSvc.appConfig.refer.section;
			}),
			onNext,
			onError,
			this.configSvc.appConfig.getCaptchaHeaders(captcha)
		);
	}

	public async sendInvitationAsync(name: string, email: string, privileges?: Array<Privilege>, relatedInfo?: { [key: string]: any }, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
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
		await super.createAsync(
			super.getURI("account", "invite", `uri=${this.configSvc.activateURI}&${this.configSvc.relatedQuery}`),
			body,
			onNext,
			error => {
				console.error(super.getErrorMessage("Error occurred while sending an invitation", error));
				if (onError !== undefined) {
					onError(error);
				}
			}
		);
	}

	public async activateAsync(mode: string, code: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		try {
			const uri = this.configSvc.appConfig.URIs.apis + super.getURI("activate", undefined, `mode=${mode}&code=${code}&${this.configSvc.relatedQuery}`);
			const data = await AppXHR.makeRequest("GET", uri).toPromise();
			await this.configSvc.updateSessionAsync(data, () => {
				console.log(super.getLogMessage("Activated..."), this.configSvc.isDebug ? this.configSvc.appConfig.session : "");
				if (onNext !== undefined) {
					onNext(data);
				}
			});
		}
		catch (error) {
			console.error(super.getErrorMessage(`Error occurred while activating (${mode})`, error));
			if (onError !== undefined) {
				onError(error);
			}
		}
	}

	public async getProfileAsync(id?: string, onNext?: (data?: any) => void, onError?: (error?: any) => void, useXHR: boolean = false) {
		id = id || this.configSvc.getAccount().id;
		if (UserProfile.contains(id)) {
			if (onNext !== undefined) {
				onNext();
			}
		}
		else {
			await super.readAsync(
				super.getURI("profile", id, this.configSvc.relatedQuery),
				data => {
					UserProfile.update(data);
					if (onNext !== undefined) {
						onNext(data);
					}
				},
				error => {
					console.error(super.getErrorMessage("Error occurred while reading profile", error));
					if (onError !== undefined) {
						onError(error);
					}
				},
				undefined,
				useXHR
			);
		}
	}

	public async updateProfileAsync(body: any, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.updateAsync(
			super.getURI("profile", body.ID || this.configSvc.getAccount().id, this.configSvc.relatedQuery),
			body,
			data => {
				UserProfile.update(data);
				if (onNext !== undefined) {
					onNext(data);
				}
			},
			error => {
				console.error(super.getErrorMessage("Error occurred while updating profile", error));
				if (onError !== undefined) {
					onError(error);
				}
			}
		);
	}

	public async updatePasswordAsync(password: string, newPassword: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.updateAsync(
			super.getURI("account", "password", this.configSvc.relatedQuery),
			{
				OldPassword: AppCrypto.rsaEncrypt(password),
				Password: AppCrypto.rsaEncrypt(newPassword)
			},
			onNext,
			error => {
				console.error(super.getErrorMessage("Error occurred while updating password", error));
				if (onError !== undefined) {
					onError(error);
				}
			}
		);
	}

	public async updateEmailAsync(password: string, newEmail: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.updateAsync(
			super.getURI("account", "email", this.configSvc.relatedQuery),
			{
				OldPassword: AppCrypto.rsaEncrypt(password),
				Email: AppCrypto.rsaEncrypt(newEmail)
			},
			onNext,
			error => {
				console.error(super.getErrorMessage("Error occurred while updating email", error));
				if (onError !== undefined) {
					onError(error);
				}
			}
		);
	}

	public async prepare2FAMethodAsync(onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.readAsync(
			super.getURI("otp", undefined, this.configSvc.relatedQuery),
			onNext,
			error => {
				console.error(super.getErrorMessage("Error occurred while preparing an 2FA method", error));
				if (onError !== undefined) {
					onError(error);
				}
			}
		);
	}

	public async add2FAMethodAsync(password: string, provisioning: string, otp: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.updateAsync(
			super.getURI("otp", undefined, this.configSvc.relatedQuery),
			{
				Provisioning: provisioning,
				OTP: otp
			},
			data => this.configSvc.updateAccount(data, onNext),
			error => {
				console.error(super.getErrorMessage("Error occurred while adding an 2FA method", error));
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
			super.getURI("otp", undefined, `info=${info}&${this.configSvc.relatedQuery}`),
			data => this.configSvc.updateAccount(data, onNext),
			error => {
				console.error(super.getErrorMessage("Error occurred while deleting an 2FA method", error));
				if (onError !== undefined) {
					onError(error);
				}
			},
			{
				"x-password": AppCrypto.rsaEncrypt(password),
			}
		);
	}

	public async getServicePrivilegesAsync(id: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		if (Account.contains(id)) {
			if (onNext !== undefined) {
				onNext();
			}
		}
		else {
			await super.readAsync(
				super.getURI("account", id, this.configSvc.relatedQuery),
				data => this.configSvc.updateAccount(data, onNext, true),
				error => {
					console.error(super.getErrorMessage("Error occurred while reading privileges", error));
					if (onError !== undefined) {
						onError(error);
					}
				}
			);
		}
	}

	public async updateServicePrivilegesAsync(id: string, privileges: { [key: string]: Array<Privilege> }, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.updateAsync(
			super.getURI("account", id, this.configSvc.relatedQuery),
			{
				Privileges: AppCrypto.aesEncrypt(JSON.stringify(privileges))
			},
			data => this.configSvc.updateAccount(data, onNext, true),
			error => {
				console.error(super.getErrorMessage("Error occurred while updating privileges", error));
				if (onError !== undefined) {
					onError(error);
				}
			}
		);
	}

	private async processUpdateMessageAsync(message: AppMessage) {
		const account = this.configSvc.getAccount();
		switch (message.Type.Object) {
			case "Session":
				switch (message.Type.Event) {
					case "Update":
						await this.configSvc.updateSessionAsync(message.Data, () => {
							console.warn(super.getLogMessage("The session was updated with new access token"), this.configSvc.appConfig.session);
							AppEvents.sendToElectron(this.name, { Type: "Session", Data: this.configSvc.appConfig.session });
						});
						break;

					case "Revoke":
						if (AppUtility.isGotSecurityException(message.Data)) {
							console.warn(super.getLogMessage("Revoke the session and register new when got a security issue"), this.configSvc.isDebug ? this.configSvc.appConfig.session : "");
							await this.configSvc.resetSessionAsync(async () => await this.configSvc.initializeSessionAsync(async () =>
								await this.configSvc.registerSessionAsync(() => {
									AppRTU.restart("Restart when got a security issue");
								})
							), false);
						}
						else {
							await this.configSvc.updateSessionAsync(message.Data, async () => await this.configSvc.registerSessionAsync(() => {
								console.warn(super.getLogMessage("The session was revoked by the APIs"), this.configSvc.isDebug ? this.configSvc.appConfig.session : "");
								AppRTU.restart("Restart when the session was revoked by the APIs");
							}));
						}
						AppEvents.broadcast("Account", { Type: "Updated" });
						AppEvents.broadcast("Profile", { Type: "Updated" });
						AppEvents.sendToElectron(this.name, { Type: "LogOut" });
						break;

					case "State":
						const userProfile = UserProfile.get(message.Data.UserID);
						if (userProfile !== undefined) {
							userProfile.IsOnline = message.Data.IsOnline ? true : this.configSvc.isAuthenticated && account.id === userProfile.ID ? true : false;
							userProfile.LastAccess = new Date();
							AppEvents.sendToElectron(this.name, message);
						}
						break;

					default:
						console.warn(super.getLogMessage("Got an update of a session"), message);
						break;
				}
				break;

			case "Account":
				this.configSvc.updateAccount(message.Data);
				if (this.configSvc.isAuthenticated && account.id === message.Data.ID) {
					AppEvents.broadcast("Account", { Type: "Updated" });
					AppEvents.sendToElectron(this.name, message);
				}
				break;

			case "Profile":
				UserProfile.update(message.Data);
				if (this.configSvc.isAuthenticated && account.id === message.Data.ID) {
					account.profile = UserProfile.get(message.Data.ID);
					account.profile.IsOnline = true;
					account.profile.LastAccess = new Date();
					if (this.configSvc.appConfig.options.i18n !== account.profile.Language) {
						await this.configSvc.changeLanguageAsync(account.profile.Language);
					}
					else {
						await this.configSvc.storeOptionsAsync();
					}
					AppEvents.broadcast("Profile", { Type: "Updated" });
					AppEvents.sendToElectron(this.name, message);
					if (this.configSvc.isDebug) {
						console.log(super.getLogMessage("User profile is updated"), account.profile);
					}
					if (this.configSvc.appConfig.facebook.token !== undefined && this.configSvc.appConfig.facebook.id !== undefined) {
						this.configSvc.getFacebookProfile();
					}
					if (this.configSvc.appConfig.app.persistence) {
						await this.configSvc.storeSessionAsync();
					}
				}
				break;

			default:
				console.warn(super.getLogMessage("Got an update of an user"), message);
				break;
		}
	}

	public getAuditFormControl(created: Date, createdID: string, lastModified: Date, lastModifiedID: string, segment?: string, onCompleted?: (controlConfig: AppFormsControlConfig) => void) {
		const controlConfig: AppFormsControlConfig = {
			Name: "Audits",
			Type: "Text",
			Segment: segment,
			Options: {
				Label: "{{common.audits.label}}",
				Type: "label",
				OnAfterViewInit: async formControl => formControl.control.Extras["Text"] = await this.getAuditInfoAsync(created, createdID, lastModified, lastModifiedID)
			}
		};
		if (onCompleted !== undefined) {
			onCompleted(controlConfig);
		}
		return controlConfig;
	}

	public async getAuditInfoAsync(created: Date, createdID: string, lastModified: Date, lastModifiedID: string) {
		let creator = UserProfile.get(createdID);
		if (creator === undefined) {
			await this.getProfileAsync(createdID, _ => creator = UserProfile.get(createdID) || new UserProfile("Unknown"), undefined, true);
		}
		let modifier = UserProfile.get(lastModifiedID);
		if (modifier === undefined) {
			await this.getProfileAsync(lastModifiedID, _ => modifier = UserProfile.get(lastModifiedID) || new UserProfile("Unknown"), undefined, true);
		}
		const params = {
			creator: creator.Name,
			creatorProfileURI: creator.routerURI,
			created: this.datePipe.transform(created, "h:mm a @ d/M/y"),
			modifier: modifier.Name,
			modifierProfileURI: modifier.routerURI,
			modified: this.datePipe.transform(lastModified, "h:mm a @ d/M/y")
		};
		return AppUtility.format(await this.configSvc.getResourceAsync("common.audits.info"), params);
	}

}
