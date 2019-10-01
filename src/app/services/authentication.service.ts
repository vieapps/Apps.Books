import { Set } from "typescript-collections";
import { Injectable } from "@angular/core";
import { AppRTU } from "../components/app.apis";
import { AppCrypto } from "../components/app.crypto";
import { AppEvents } from "../components/app.events";
import { AppUtility } from "../components/app.utility";
import { Account } from "../models/account";
import { Privilege } from "../models/privileges";
import { Base as BaseService } from "./base.service";
import { ConfigurationService } from "./configuration.service";

@Injectable()
export class AuthenticationService extends BaseService {

	constructor(private configSvc: ConfigurationService) {
		super("Authentication");
	}

	private isGotRole(role: string, roles: any) {
		return !AppUtility.isNotEmpty(role)
			? false
			: AppUtility.isArray(roles, true)
				? (roles as Array<string>).find(r => r === role) !== undefined
				: roles instanceof Set
					? (roles as Set<string>).contains(role)
					: false;
	}

	private isGotServiceRole(serviceName: string, role: string, privileges: Array<Privilege>) {
		return !AppUtility.isNotEmpty(serviceName) || !AppUtility.isNotEmpty(role) || privileges === undefined
			? false
			: privileges.find(p => p.ServiceName === serviceName && p.Role === role) !== undefined;
	}

	/** Checks to see the account is system administrator or not */
	public isSystemAdministrator(account?: Account) {
		account = account || this.configSvc.getAccount();
		return this.isGotRole("SystemAdministrator", account.roles);
	}

	/** Checks to see the account is service administrator or not */
	public isServiceAdministrator(service?: string, account?: Account) {
		service = (service || this.configSvc.appConfig.services.active).toLowerCase();
		account = account || this.configSvc.getAccount();
		return this.isGotServiceRole(service, "Administrator", account.privileges) || this.isSystemAdministrator(account);
	}

	/** Checks to see the account is service moderator or not */
	public isServiceModerator(service?: string, account?: Account) {
		service = (service || this.configSvc.appConfig.services.active).toLowerCase();
		account = account || this.configSvc.getAccount();
		return this.isGotServiceRole(service, "Moderator", account.privileges) || this.isServiceAdministrator(service, account);
	}

	private canDo(role: string, service?: string, account?: Account) {
		service = (service || this.configSvc.appConfig.services.active).toLowerCase();
		account = account || this.configSvc.getAccount();
		return role === "SystemAdministrator"
			? this.isSystemAdministrator(account)
			: role === "ServiceAdministrator"
				? this.isServiceAdministrator(service, account)
				: role === "ServiceModerator"
					? this.isServiceModerator(service, account)
					: role === "Authenticated"
						? this.configSvc.isAuthenticated
						: role === "All";
	}

	/** Checks to see the user can send invitations or not */
	public canDoSendInvitations(service?: string, account?: Account) {
		return this.canDo(this.configSvc.appConfig.accountRegistrations.sendInvitationRole, service, account);
	}

	/** Checks to see the user can set privileges or not */
	public canDoSetPrivileges(service?: string, account?: Account) {
		return this.canDo(this.configSvc.appConfig.accountRegistrations.setPrivilegsRole, service, account);
	}

	/** Checks to see the visitor can register new account or not */
	public get canRegisterNewAccounts() {
		return this.configSvc.appConfig.accountRegistrations.registrable;
	}

	/** Checks to see the user can send invitations or not */
	public get canSendInvitations() {
		return this.canDoSendInvitations();
	}

	/** Checks to see the user can set privileges or not */
	public get canSetPrivileges() {
		return this.canDoSetPrivileges();
	}

	public logInAsync(email: string, password: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return super.createAsync(
			"users/session",
			{
				Email: AppCrypto.rsaEncrypt(email),
				Password: AppCrypto.rsaEncrypt(password)
			},
			async data => {
				if (AppUtility.isTrue(data.Require2FA)) {
					console.warn(super.getLogMessage("Log in with static password successful, but need to verify with 2FA"), this.configSvc.isDebug ? data : "");
					if (onNext !== undefined) {
						onNext(data);
					}
				}
				else {
					console.log(super.getLogMessage("Log in successful"), this.configSvc.isDebug ? data : "");
					await this.updateSessionAsync(data, onNext);
				}
			},
			async error => {
				if (AppUtility.isGotSecurityException(error)) {
					await this.configSvc.resetSessionAsync(async () =>
						await this.configSvc.initializeSessionAsync(async () =>
							await this.configSvc.registerSessionAsync(() => console.log(super.getLogMessage("The session is re-registered (anonymous)")))
						)
					);
				}
				if (onError !== undefined) {
					onError(error);
				}
				else {
					super.showError("Error occurred while logging in", error);
				}
			},
			undefined,
			true
		);
	}

	public logInOTPAsync(userID: string, otpProvider: string, otpCode: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return super.updateAsync(
			"users/session",
			{
				ID: AppCrypto.rsaEncrypt(userID),
				Info: AppCrypto.rsaEncrypt(otpProvider),
				OTP: AppCrypto.rsaEncrypt(otpCode)
			},
			async data => {
				console.log(super.getLogMessage("Log in with OTP successful"));
				await this.updateSessionAsync(data, onNext);
			},
			error => {
				if (onError !== undefined) {
					onError(error);
				}
				else {
					super.showError("Error occurred while logging in with OTP", error);
				}
			},
			undefined,
			true
		);
	}

	public logOutAsync(onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return super.deleteAsync(
			"users/session",
			async data => {
				AppEvents.broadcast("Session", { Type: "LogOut" });
				AppEvents.sendToElectron("Users", { Type: "LogOut" });
				await this.configSvc.updateSessionAsync(data, async () => await this.configSvc.registerSessionAsync(() => {
					console.log(super.getLogMessage("Log out successful"), this.configSvc.isDebug ? data : "");
					AppEvents.broadcast("Account", { Type: "Updated" });
					AppEvents.broadcast("Profile", { Type: "Updated" });
					if (onNext !== undefined) {
						onNext(data);
					}
				}, onError), true);
			},
			error => {
				if (onError !== undefined) {
					onError(error);
				}
				else {
					super.showError("Error occurred while logging out", error);
				}
			},
			undefined,
			true
		);
	}

	public resetPasswordAsync(email: string, captcha: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return super.updateAsync(
			`users/account/reset?uri=${this.configSvc.activateURI}&${this.configSvc.relatedQuery}`,
			{
				Email: AppCrypto.rsaEncrypt(email)
			},
			onNext,
			error => {
				if (onError !== undefined) {
					onError(error);
				}
				else {
					super.showError("Error occurred while requesting new password", error);
				}
			},
			this.configSvc.appConfig.getCaptchaHeaders(captcha)
		);
	}

	public registerCaptchaAsync(onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return super.readAsync(
			`users/captcha?register=${this.configSvc.appConfig.session.id}`,
			data => {
				this.configSvc.appConfig.session.captcha = {
					code: data.Code,
					uri: data.Uri
				};
				if (onNext !== undefined) {
					onNext(data);
				}
			},
			error => {
				if (onError !== undefined) {
					onError(error);
				}
				else {
					super.showError("Error occurred while registering session captcha", error);
				}
			}
		);
	}

	private updateSessionAsync(data: any, onNext: (data?: any) => void) {
		AppEvents.broadcast("Session", { Type: "LogIn" });
		AppEvents.sendToElectron("Users", { Type: "LogIn", Data: data });
		return this.configSvc.updateSessionAsync(data, () => AppRTU.start(() => {
			if (onNext !== undefined) {
				onNext(data);
			}
		}));
	}

}
