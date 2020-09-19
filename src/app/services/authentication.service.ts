import { Injectable } from "@angular/core";
import { AppRTU } from "@components/app.apis";
import { AppCrypto } from "@components/app.crypto";
import { AppEvents } from "@components/app.events";
import { AppUtility } from "@components/app.utility";
import { Account } from "@models/account";
import { Privileges } from "@models/privileges";
import { Base as BaseService } from "@services/base.service";
import { ConfigurationService } from "@services/configuration.service";

@Injectable()
export class AuthenticationService extends BaseService {

	constructor(
		private configSvc: ConfigurationService
	) {
		super("Authentication");
	}

	/**
	 * Determines the account is system administrator or not
	 * @param account The account to check (default is current logged in account)
	*/
	public isSystemAdministrator(account?: Account) {
		return (account || this.configSvc.getAccount()).isInRole("SystemAdministrator");
	}

	/**
	 * Determines the account is service administrator or not (can manage or not)
	 * @param serviceName The service's name need to check with this accounts' privileges
	 * @param objectName The service object's name need to check with this accounts' privileges
	 * @param privileges The role privileges to check with this accounts' privileges
	 * @param account The account to check (default is current logged in account)
	 */
	public isServiceAdministrator(serviceName?: string, privileges?: Privileges, account?: Account) {
		return this.isAdministrator(serviceName, "", privileges, account);
	}

	/**
	 * Determines the account is service moderator or not (can manage or not)
	 * @param serviceName The service's name need to check with this accounts' privileges
	 * @param objectName The service object's name need to check with this accounts' privileges
	 * @param privileges The role privileges to check with this accounts' privileges
	 * @param account The account to check (default is current logged in account)
	 */
	public isServiceModerator(serviceName?: string, privileges?: Privileges, account?: Account) {
		return this.isModerator(serviceName, "", privileges, account);
	}

	/**
	 * Determines the account is administrator or not (can manage or not)
	 * @param serviceName The service's name need to check with this accounts' privileges
	 * @param objectName The service object's name need to check with this accounts' privileges
	 * @param privileges The role privileges to check with this accounts' privileges
	 * @param account The account to check (default is current logged in account)
	 */
	public isAdministrator(serviceName?: string, objectName?: string, privileges?: Privileges, account?: Account) {
		account = account || this.configSvc.getAccount();
		return this.isSystemAdministrator(account) || account.isAdministrator(serviceName || this.configSvc.appConfig.services.active, objectName, privileges);
	}

	/**
	 * Determines the account is moderator or not (can moderate or not)
	 * @param serviceName The service's name need to check with this accounts' privileges
	 * @param objectName The service object's name need to check with this accounts' privileges
	 * @param privileges The role privileges to check with this accounts' privileges
	 * @param account The account to check (default is current logged in account)
	 */
	public isModerator(serviceName?: string, objectName?: string, privileges?: Privileges, account?: Account) {
		account = account || this.configSvc.getAccount();
		return this.isSystemAdministrator(account) || account.isModerator(serviceName || this.configSvc.appConfig.services.active, objectName, privileges);
	}

	/**
	 * Determines the account is editor or not (can edit or not)
	 * @param serviceName The service's name need to check with this accounts' privileges
	 * @param objectName The service object's name need to check with this accounts' privileges
	 * @param privileges The role privileges to check with this accounts' privileges
	 * @param account The account to check (default is current logged in account)
	 */
	public isEditor(serviceName?: string, objectName?: string, privileges?: Privileges, account?: Account) {
		account = account || this.configSvc.getAccount();
		return this.isSystemAdministrator(account) || account.isEditor(serviceName || this.configSvc.appConfig.services.active, objectName, privileges);
	}

	/**
	 * Determines this account is contributor or not (can contribute or not)
	 * @param serviceName The service's name need to check with this accounts' privileges
	 * @param objectName The service object's name need to check with this accounts' privileges
	 * @param privileges The role privileges to check with this accounts' privileges
	 * @param account The account to check (default is current logged in account)
	 */
	public isContributor(serviceName?: string, objectName?: string, privileges?: Privileges, account?: Account) {
		account = account || this.configSvc.getAccount();
		return this.isSystemAdministrator(account) || account.isContributor(serviceName || this.configSvc.appConfig.services.active, objectName, privileges);
	}

	/**
	 * Determines this account is viewer or not (can view or not)
	 * @param serviceName The service's name need to check with this accounts' privileges
	 * @param objectName The service object's name need to check with this accounts' privileges
	 * @param privileges The role privileges to check with this accounts' privileges
	 * @param account The account to check (default is current logged in account)
	 */
	public isViewer(serviceName?: string, objectName?: string, privileges?: Privileges, account?: Account) {
		account = account || this.configSvc.getAccount();
		return this.isSystemAdministrator(account) || account.isViewer(serviceName || this.configSvc.appConfig.services.active, objectName, privileges);
	}

	/**
	 * Determines this account is downloader or not (can download or not)
	 * @param serviceName The service's name need to check with this accounts' privileges
	 * @param objectName The service object's name need to check with this accounts' privileges
	 * @param privileges The role privileges to check with this accounts' privileges
	 * @param account The account to check (default is current logged in account)
	 */
	public isDownloader(serviceName?: string, objectName?: string, privileges?: Privileges, account?: Account) {
		account = account || this.configSvc.getAccount();
		return this.isSystemAdministrator(account) || account.isDownloader(serviceName || this.configSvc.appConfig.services.active, objectName, privileges);
	}

	private canDo(role: string, serviceName?: string, account?: Account) {
		return AppUtility.isEquals("SystemAdministrator", role)
			? this.isSystemAdministrator(account)
			: AppUtility.isEquals("ServiceAdministrator", role)
				? this.isServiceAdministrator(serviceName, undefined, account)
				: AppUtility.isEquals("ServiceModerator", role)
					? this.isServiceModerator(serviceName, undefined, account)
					: AppUtility.isEquals("Authenticated", role)
						? this.configSvc.isAuthenticated
						: AppUtility.isEquals("All", role);
	}

	/** Checks to see the visitor can register new account or not */
	public get canRegisterNewAccounts() {
		return this.configSvc.appConfig.accountRegistrations.registrable;
	}

	/** Checks to see the user can send invitations or not */
	public get canSendInvitations() {
		return this.canDo(this.configSvc.appConfig.accountRegistrations.sendInvitationRole);
	}

	/** Checks to see the user can set privileges of current service or not */
	public get canSetServicePrivileges() {
		return this.configSvc.appConfig.accountRegistrations.setServicePrivilegs && this.canDo(this.configSvc.appConfig.accountRegistrations.setServicePrivilegsRole);
	}

	public async logInAsync(email: string, password: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.createAsync(
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

	public async logInOTPAsync(userID: string, otpProvider: string, otpCode: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.updateAsync(
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

	public async logOutAsync(onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.deleteAsync(
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

	public async resetPasswordAsync(email: string, captcha: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.updateAsync(
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

	public async registerCaptchaAsync(onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.readAsync(
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

	private async updateSessionAsync(data: any, onNext: (data?: any) => void) {
		AppEvents.broadcast("Session", { Type: "LogIn" });
		AppEvents.sendToElectron("Users", { Type: "LogIn", Data: data });
		await this.configSvc.updateSessionAsync(data, () => AppRTU.start(() => {
			if (onNext !== undefined) {
				onNext(data);
			}
		}));
	}

}
