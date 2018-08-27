import * as Collections from "typescript-collections";
import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import { List } from "linqts";
import { AppRTU } from "./../components/app.rtu";
import { AppCrypto } from "../components/app.crypto";
import { AppEvents } from "../components/app.events";
import { AppAPI } from "../components/app.api";
import { AppUtility } from "../components/app.utility";
import { PlatformUtility } from "../components/app.utility.platform";
import { Account } from "../models/account";
import { Privilege } from "../models/privileges";
import { Base as BaseService } from "./base.service";
import { ConfigurationService } from "./configuration.service";

@Injectable()
export class AuthenticationService extends BaseService {

	constructor(
		public http: Http,
		public configSvc: ConfigurationService
	) {
		super(http, "Authentication");
	}

	private isGotRole(role: string, roles: any) {
		return !AppUtility.isNotEmpty(role) || roles === undefined || roles === null
			? false
			: AppUtility.isArray(roles, true)
				? new List<string>(roles).FirstOrDefault(r => r === role) !== undefined
				: roles instanceof Collections.Set
					? (roles as Collections.Set<string>).contains(role)
					: false;
	}

	private isGotServiceRole(serviceName: string, role: string, privileges: Array<Privilege>) {
		return !AppUtility.isNotEmpty(serviceName) || !AppUtility.isNotEmpty(role) || privileges === undefined || privileges === null
			? false
			: new List(privileges).FirstOrDefault(p => p.ServiceName === serviceName && p.Role === role) !== undefined;
	}

	/** Checks to see the account is system administrator or not */
	public isSystemAdministrator(account?: Account) {
		account = account || this.configSvc.getAccount();
		return this.isGotRole("SystemAdministrator", account.roles);
	}

	/** Checks to see the account is service administrator or not */
	public isServiceAdministrator(account?: Account) {
		account = account || this.configSvc.getAccount();
		return this.isGotServiceRole(this.configSvc.appConfig.app.service, "Administrator", account.privileges) || this.isSystemAdministrator(account);
	}

	/** Checks to see the account is service moderator or not */
	public isServiceModerator(account?: Account) {
		account = account || this.configSvc.getAccount();
		return this.isGotServiceRole(this.configSvc.appConfig.app.service, "Moderator", account.privileges) || this.isServiceAdministrator(account);
	}

	private canDo(role: string) {
		return role === "SystemAdministrator"
			? this.isSystemAdministrator()
			: role === "ServiceAdministrator"
				? this.isServiceAdministrator()
				: role === "ServiceModerator"
					? this.isServiceModerator()
					: role === "Authenticated"
						? this.configSvc.isAuthenticated
						: role === "All";
	}

	/** Checks to see the visitor can register new account or not */
	public get canRegisterNewAccounts() {
		return this.configSvc.appConfig.accountRegistrations.registrable;
	}

	/** Checks to see the user can send invitations or not */
	public get canSendInvitations() {
		return this.canDo(this.configSvc.appConfig.accountRegistrations.sendInvitationRole);
	}

	/** Checks to see the user can set privileges or not */
	public get canSetPrivilegs() {
		return this.canDo(this.configSvc.appConfig.accountRegistrations.setPrivilegsRole);
	}

	public logInAsync(email: string, password: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const body = {
			Email: AppCrypto.rsaEncrypt(email),
			Password: AppCrypto.rsaEncrypt(password)
		};
		return this.createAsync("users/session", body,
			async data => {
				if (AppUtility.isTrue(data.Require2FA)) {
					this.log("Log in with static password successful, need to verify with 2FA", this.configSvc.isDebug ? data : "");
					if (onNext !== undefined) {
						onNext(data);
					}
				}
				else {
					this.log("Log in successful", this.configSvc.isDebug ? data : "");
					await this.updateSessionAsync(data, onNext);
				}
			},
			async error => {
				if (AppUtility.isGotSecurityException(error)) {
					await this.configSvc.deleteSessionAsync(async () => {
						await this.configSvc.initializeSessionAsync(async () => {
							await this.configSvc.registerSessionAsync(() => {
								this.log("The session is re-registered (anonymous)");
							});
						});
					});
				}
				this.error("Error occurred while logging in", error, onError);
			}
		);
	}

	public logOutAsync(onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return this.deleteAsync("users/session",
			async data => {
				AppEvents.broadcast("Session", { Type: "LogOut", Info: data });
				await this.configSvc.updateSessionAsync(data, async () => {
					await this.configSvc.registerSessionAsync(session => {
						this.configSvc.patchSession(() => {
							this.log("Log out successful", this.configSvc.isDebug ? data : "");
							if (onNext !== undefined) {
								onNext(session);
							}
						});
					}, onError);
				}, true);
			},
			error => this.error("Error occurred while logging out", error, onError)
		);
	}

	public prepareOTPAsync(onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/otp?" + this.configSvc.relatedQuery;
		return this.readAsync(path, onNext, error => this.error("Error occurred while preparing OTP", error, onError));
	}

	public validateOTPAsync(id: string, otp: string, info: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/session?" + this.configSvc.relatedQuery;
		const body = {
			ID: AppCrypto.rsaEncrypt(id),
			OTP: AppCrypto.rsaEncrypt(otp),
			Info: AppCrypto.rsaEncrypt(info)
		};
		return this.updateAsync(path, body,
			async data => {
				this.log("Validate OTP successful");
				await this.updateSessionAsync(data, onNext);
			},
			error => this.error("Error occurred while validating OTP", error, onError)
		);
	}

	public registerCaptchaAsync(onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return this.readAsync("users/captcha?register=" + this.configSvc.appConfig.session.id,
			data => {
				this.configSvc.appConfig.session.captcha = {
					code: data.Code,
					uri: data.Uri
				};
				if (onNext !== undefined) {
					onNext(data);
				}
			},
			error => this.error("Error occurred while registering session captcha", error, onError)
		);
	}

	public resetPasswordAsync(email: string, captcha: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/account/reset?" + this.configSvc.relatedQuery + "&uri=" + AppCrypto.urlEncode(PlatformUtility.activateURI);
		const body = {
			Email: AppCrypto.rsaEncrypt(email)
		};
		return this.updateAsync(path, body, onNext, error => this.error("Error occurred while requesting new password", error, onError), AppAPI.getCaptchaHeaders(captcha));
	}

	public updateSessionAsync(data: any, onNext: (data?: any) => void) {
		AppEvents.broadcast("Session", { Type: "LogIn", Info: data });
		return this.configSvc.updateSessionAsync(data, () => {
			AppRTU.start(() => {
				this.configSvc.patchSession(() => {
					this.configSvc.patchAccount(() => {
						this.configSvc.getProfile(() => {
							if (onNext !== undefined) {
								onNext(data);
							}
						});
					});
				});
			});
		});
	}

}
