import { Subscription } from "rxjs";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { AppCrypto } from "@components/app.crypto";
import { AppUtility } from "@components/app.utility";
import { TrackingUtility } from "@components/app.utility.trackings";
import { AppFormsControl, AppFormsControlConfig, AppFormsService } from "@components/forms.service";
import { ConfigurationService } from "@services/configuration.service";
import { AuthenticationService } from "@services/authentication.service";

@Component({
	selector: "page-users-login",
	templateUrl: "./login.page.html",
	styleUrls: ["./login.page.scss"]
})

export class UsersLogInPage implements OnInit, OnDestroy {

	constructor(
		private configSvc: ConfigurationService,
		private appFormsSvc: AppFormsService,
		private authSvc: AuthenticationService
	) {
	}

	title = "Login";
	mode = "";
	login = {
		form: new FormGroup({}),
		controls: new Array<AppFormsControl>(),
		config: undefined as Array<AppFormsControlConfig>,
		buttons: {
			login: {
				label: "Login",
				icon: undefined as string
			},
			register: {
				label: "Register",
				icon: undefined as string
			}
		}
	};
	otp = {
		providers: new Array<{ Info: string, Label: string, Time: Date, Type: string }>(),
		form: new FormGroup({}),
		controls: new Array<AppFormsControl>(),
		config: undefined as Array<AppFormsControlConfig>,
		value: undefined as any,
		button: {
			label: "Verify",
			icon: undefined as string
		},
		subscription: undefined as Subscription
	};
	reset = {
		form: new FormGroup({}),
		controls: new Array<AppFormsControl>(),
		config: undefined as Array<AppFormsControlConfig>,
		button: {
			label: "Forgot password",
			icon: "key"
		}
	};

	get color() {
		return this.configSvc.color;
	}

	get registrable() {
		return this.configSvc.appConfig.accountRegistrations.registrable;
	}

	get screenWidth() {
		return this.configSvc.screenWidth;
	}

	ngOnInit() {
		this.openLoginAsync();
	}

	ngOnDestroy() {
		if (this.otp.subscription !== undefined) {
			this.otp.subscription.unsubscribe();
		}
	}

	async openLoginAsync() {
		this.login.config = [
			{
				Name: "Email",
				Required: true,
				Options: {
					Type: "email",
					Label: await this.configSvc.getResourceAsync("users.login.login.controls.Email"),
					MinLength: 1,
					MaxLength: 150,
					AutoFocus: true
				}
			},
			{
				Name: "Password",
				Required: true,
				Options: {
					Type: "password",
					Label: await this.configSvc.getResourceAsync("users.login.login.controls.Password"),
					MinLength: 1,
					MaxLength: 150,
				}
			}
		];
		if (this.configSvc.appConfig.isWebApp) {
			this.login.config.push({
				Name: "Persistence",
				Required: true,
				Type: "YesNo",
				Options: {
					Type: "toggle",
					Label: await this.configSvc.getResourceAsync("users.login.login.controls.SaveLogins")
				}
			});
		}
		this.login.buttons.login.label = await this.configSvc.getResourceAsync("users.login.login.buttons.login");
		this.login.buttons.register.label = await this.configSvc.getResourceAsync("users.login.login.buttons.register");
		this.reset.button.label = await this.configSvc.getResourceAsync("users.login.login.buttons.forgot");
		this.mode = "login";
		this.configSvc.appTitle = this.title = await this.configSvc.getResourceAsync("users.login.login.title");
	}

	onLoginFormInitialized() {
		if (this.configSvc.appConfig.isWebApp) {
			this.login.form.patchValue({ Persistence: this.configSvc.appConfig.app.persistence });
		}
	}

	async logInAsync() {
		if (this.appFormsSvc.validate(this.login.form)) {
			if (this.configSvc.appConfig.isWebApp) {
				this.configSvc.appConfig.app.persistence = this.login.form.value.Persistence;
				if (!this.configSvc.appConfig.app.persistence) {
					await this.configSvc.deleteSessionAsync();
				}
			}
			await this.appFormsSvc.showLoadingAsync(this.title);
			await this.authSvc.logInAsync(
				this.login.form.value.Email,
				this.login.form.value.Password,
				async data => await Promise.all([
					TrackingUtility.trackAsync(this.title, this.configSvc.appConfig.url.users.login),
					this.appFormsSvc.hideLoadingAsync(async () => await (data.Require2FA ? this.openLoginOTPAsync(data) : this.closeAsync()))
				]),
				async error => await this.appFormsSvc.showErrorAsync(error, undefined, () => this.login.controls.find(c => AppUtility.isEquals(c.Name, "Email")).focus())
			);
		}
	}

	async openLoginOTPAsync(data: any) {
		this.otp.providers = data.Providers;
		this.otp.value = {
			ID: data.ID,
			Provider: this.otp.providers[0].Info
		};
		this.otp.config = [
			{
				Name: "ID",
				Hidden: true
			},
			{
				Name: "Provider",
				Type: "Select",
				Hidden: this.otp.providers.length < 2,
				Options: {
					Label: await this.configSvc.getResourceAsync("users.login.otp.controls.Provider"),
					SelectOptions: {
						Values: this.otp.providers.map(provider => {
							return {
								Value: provider.Info,
								Label: provider.Label
							};
						})
					},
				}
			},
			{
				Name: "OTP",
				Required: true,
				Options: {
					Label: await this.configSvc.getResourceAsync("users.login.otp.controls.OTP.label"),
					Description: "",
					MinLength: 5,
					MaxLength: 10,
					AutoFocus: true
				}
			}
		];
		this.otp.subscription = this.otp.form.valueChanges.subscribe(async value => {
			const provider = this.otp.providers.find(p => AppUtility.isEquals(p.Info, value.Provider)) || this.otp.providers[0];
			this.otp.controls.find(c => AppUtility.isEquals(c.Name, "OTP")).Options.Description = AppUtility.isEquals("SMS", provider.Type)
				? await this.configSvc.getResourceAsync("users.login.otp.controls.OTP.description.sms")
				: await this.configSvc.getResourceAsync("users.login.otp.controls.OTP.description.app", { label: provider.Label });
		});
		this.otp.button.label = await this.configSvc.getResourceAsync("users.login.otp.button");
		this.mode = "otp";
		this.configSvc.appTitle = this.title = await this.configSvc.getResourceAsync("users.login.otp.title");
	}

	async logInOTPAsync() {
		if (this.appFormsSvc.validate(this.otp.form)) {
			await this.appFormsSvc.showLoadingAsync(this.title);
			await this.authSvc.logInOTPAsync(
				this.otp.form.value.ID,
				this.otp.form.value.Provider,
				this.otp.form.value.OTP,
				async () => await Promise.all([
					TrackingUtility.trackAsync(this.title, this.configSvc.appConfig.url.users.otp),
					this.appFormsSvc.hideLoadingAsync(async () => await this.closeAsync())
				]),
				async error => await this.appFormsSvc.showErrorAsync(error, undefined, () => this.otp.controls.find(c => AppUtility.isEquals(c.Name, "OTP")).controlRef.deleteValue())
			);
		}
	}

	async openResetPasswordAsync() {
		this.reset.config = [
			{
				Name: "Email",
				Required: true,
				Options: {
					Type: "email",
					Label: await this.configSvc.getResourceAsync("users.login.login.controls.Email"),
					MinLength: 1,
					MaxLength: 150,
					AutoFocus: true
				}
			},
			{
				Name: "Captcha",
				Required: true,
				Type: "Captcha",
				Options: {
					Label: await this.configSvc.getResourceAsync("users.login.reset.controls.Captcha.label"),
					Description: await this.configSvc.getResourceAsync("users.login.reset.controls.Captcha.description"),
					MinLength: 4,
					MaxLength: 4
				}
			}
		];
		this.reset.button = {
			label: await this.configSvc.getResourceAsync("users.login.reset.button"),
			icon: undefined
		};
		this.mode = "reset";
		this.configSvc.appTitle = this.title = await this.configSvc.getResourceAsync("users.login.reset.title");
	}

	async resetPasswordAsync() {
		if (this.appFormsSvc.validate(this.reset.form)) {
			await this.appFormsSvc.showLoadingAsync(this.title);
			await this.authSvc.resetPasswordAsync(
				this.reset.form.value.Email,
				this.reset.form.value.Captcha,
				async () => await Promise.all([
					TrackingUtility.trackAsync(this.title, `${this.configSvc.appConfig.url.users.root}/reset`),
					this.appFormsSvc.showAlertAsync(
						await this.configSvc.getResourceAsync("users.login.reset.title"),
						undefined,
						await this.configSvc.getResourceAsync("users.login.reset.message", { email: this.reset.form.value.Email }),
						async () => await this.closeAsync()
					)
				]),
				async error => await Promise.all([
					this.refreshCaptchaAsync(),
					this.appFormsSvc.showErrorAsync(error, undefined, () => this.reset.controls.find(c => AppUtility.isEquals(c.Name, "Captcha")).controlRef.deleteValue())
				])
			);
		}
	}

	onResetPasswordFormInitialized() {
		this.refreshCaptchaAsync();
		this.reset.form.patchValue({ Email: this.login.form.value.Email });
	}

	refreshCaptchaAsync() {
		return this.authSvc.registerCaptchaAsync(() => this.reset.controls.find(c => AppUtility.isEquals(c.Name, "Captcha")).captchaURI = this.configSvc.appConfig.session.captcha.uri);
	}

	onRefreshCaptcha() {
		this.refreshCaptchaAsync();
	}

	closeAsync() {
		if (AppUtility.isNotEmpty(this.configSvc.queryParams["next"])) {
			try {
				return this.configSvc.navigateHomeAsync(AppCrypto.urlDecode(this.configSvc.queryParams["next"]));
			}
			catch (error) {
				console.error("<Login>: Error occurred while redirecting", error);
				return this.configSvc.navigateHomeAsync();
			}
		}
		else {
			return this.configSvc.previousUrl.startsWith(this.configSvc.appConfig.url.users.root)
				? this.configSvc.navigateHomeAsync()
				: this.configSvc.navigateBackAsync();
		}
	}

	registerAsync() {
		return this.configSvc.navigateForwardAsync(this.configSvc.appConfig.url.users.register);
	}

}
