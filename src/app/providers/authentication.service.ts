import * as Collections from "typescript-collections";
import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import { List } from "linqts";
import { AppUtility } from "../components/app.utility";
import { PlatformUtility } from "../components/app.utility.platform";
import { AppCrypto } from "../components/app.crypto";
import { AppEvents } from "../components/app.events";
import { AppAPI } from "../components/app.api";
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
	isSystemAdministrator(account?: Account) {
		account = account || this.configSvc.getAccount();
		return this.isGotRole("SystemAdministrator", account.roles);
	}

	/** Checks to see the account is service administrator or not */
	isServiceAdministrator(account?: Account) {
		account = account || this.configSvc.getAccount();
		return this.isGotServiceRole(this.configSvc.appConfig.app.service, "Administrator", account.privileges) || this.isSystemAdministrator(account);
	}

	/** Checks to see the account is service moderator or not */
	isServiceModerator(account?: Account) {
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
	get canRegisterNewAccounts() {
		return this.configSvc.appConfig.accountRegistrations.registrable;
	}

	/** Checks to see the user can send invitations or not */
	get canSendInvitations() {
		return this.canDo(this.configSvc.appConfig.accountRegistrations.sendInvitationRole);
	}

	/** Checks to see the user can set privileges or not */
	get canSetPrivilegs() {
		return this.canDo(this.configSvc.appConfig.accountRegistrations.setPrivilegsRole);
	}

	logInAsync(email: string, password: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const body = {
			Email: AppCrypto.rsaEncrypt(email),
			Password: AppCrypto.rsaEncrypt(password)
		};
		return this.createAsync("users/session", body,
			data => {
				if (AppUtility.isFalse(data.Require2FA)) {
					AppEvents.broadcast("Session", { Type: "LogIn", Info: data });
					this.configSvc.patchSession();
					console.log(`[${this.Name}]: Log in successful`);
				}
				if (onNext !== undefined) {
					onNext(data);
				}
			}, error => {
				if (AppUtility.isObject(error, true) && "InvalidSessionException" === error.Type && AppUtility.indexOf(error.Message, "not issued by the system") > 0) {
					this.configSvc.deleteSessionAsync(() => {
						this.configSvc.initializeSessionAsync(() => {
							this.configSvc.registerSessionAsync(() => {
								console.log(`[${this.Name}]: The session is re-registered (anonymous)`);
							});
						});
					});
				}
				this.showError("Error occurred while logging in", error, onError);
			}
		);
	}

	logOutAsync(onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return this.deleteAsync("users/session",
			async (data) => {
				await this.configSvc.updateSessionAsync(data);
				AppEvents.broadcast("Session", { Type: "LogOut", Info: data });
				await this.configSvc.registerSessionAsync(() => {
					this.configSvc.patchSession();
					console.log(`[${this.Name}]: Log out successful`);
					if (onNext !== undefined) {
						onNext(data);
					}
				}, onError);
			},
			error => this.showError("Error occurred while logging out", error, onError)
		);
	}

	prepareOTPAsync(onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/otp"
			+ "?related-service=" + this.configSvc.appConfig.app.service
			+ "&language=" + AppUtility.getLanguage()
			+ "&host=" + PlatformUtility.getHost();
		return this.readAsync(path, onNext, error => this.showError("Error occurred while preparing OTP", error, onError));
	}

	validateOTPAsync(id: string, otp: string, info: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/session"
			+ "?related-service=" + this.configSvc.appConfig.app.service
			+ "&language=" + AppUtility.getLanguage()
			+ "&host=" + PlatformUtility.getHost();
		const body = {
			ID: AppCrypto.rsaEncrypt(id),
			OTP: AppCrypto.rsaEncrypt(otp),
			Info: AppCrypto.rsaEncrypt(info)
		};
		return this.updateAsync(path, body,
			data => {
				AppEvents.broadcast("Session", { Type: "LogIn", Info: data });
				console.log(`[${this.Name}]: Log in with OTP successful`);
				if (onNext !== undefined) {
					onNext(data);
				}
			},
			error => this.showError("Error occurred while validating OTP", error, onError)
		);
	}

	registerCaptchaAsync(onNext?: (data?: any) => void, onError?: (error?: any) => void) {
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
			error => this.showError("Error occurred while registering session captcha", error, onError)
		);
	}

	resetPasswordAsync(email: string, captcha: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = "users/account/reset"
			+ "?related-service=" + this.configSvc.appConfig.app.service
			+ "&language=" + AppUtility.getLanguage()
			+ "&host=" + PlatformUtility.getHost()
			+ "&uri=" + AppCrypto.urlEncode(PlatformUtility.getActivateURI());
		const body = {
			Email: AppCrypto.rsaEncrypt(email)
		};
		return this.updateAsync(path, body, onNext, error => this.showError("Error occurred while requesting new password", error, onError), AppAPI.getCaptchaHeaders(captcha));
	}

}
