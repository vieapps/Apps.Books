import * as Rx from "rxjs";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { TrackingUtility } from "../../components/app.utility.trackings";
import { AppFormsControl, AppFormsService } from "../../components/forms.service";
import { ConfigurationService } from "../../providers/configuration.service";
import { AuthenticationService } from "../../providers/authentication.service";

@Component({
	selector: "page-user-login",
	templateUrl: "./login.page.html",
	styleUrls: ["./login.page.scss"]
})
export class LogInPage implements OnInit, OnDestroy {

	constructor (
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public authSvc: AuthenticationService
	) {
	}

	title = "Login";
	mode = "";
	rxSubscriptions = new Array<Rx.Subscription>();
	login = {
		form: new FormGroup({}),
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>(),
		value: undefined as any,
		button: {
			label: "Login",
			icon: undefined as string,
			color: "primary",
			fill: "solid"
		}
	};
	otp = {
		providers: new Array<{ Info: string, Label: string, Time: Date, Type: string }>(),
		form: new FormGroup({}),
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>(),
		value: undefined as any,
		button: {
			label: "Verify",
			icon: undefined as string,
			color: "primary",
			fill: "solid"
		}
	};
	reset = {
		form: new FormGroup({}),
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>(),
		value: undefined as any,
		button: {
			label: "Forgot password",
			icon: "key",
			color: "primary",
			fill: "clear"
		}
	};

	ngOnInit() {
		this.rxSubscriptions.push(this.login.form.valueChanges.subscribe(value => this.login.value = value));
		this.rxSubscriptions.push(this.otp.form.valueChanges.subscribe(value => this.otp.value = value));
		this.rxSubscriptions.push(this.reset.form.valueChanges.subscribe(value => this.reset.value = value));
		this.openLoginAsync();
	}

	ngOnDestroy() {
		this.rxSubscriptions.forEach(subscription => subscription.unsubscribe());
	}

	private setTitle() {
		this.configSvc.appTitle = this.title;
	}

	async openLoginAsync() {
		this.login.config = [
			{
				Key: "Email",
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
				Key: "Password",
				Required: true,
				Options: {
					Type: "password",
					Label: await this.configSvc.getResourceAsync("users.login.login.controls.Password"),
					MinLength: 1,
					MaxLength: 150,
				}
			}
		];
		this.login.button.label = await this.configSvc.getResourceAsync("users.login.login.buttons.login");
		this.reset.button.label = await this.configSvc.getResourceAsync("users.login.login.buttons.forgot");
		this.title = await this.configSvc.getResourceAsync("users.login.login.title");
		this.mode = "log-in";
		this.setTitle();
	}

	async logInAsync() {
		if (this.login.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.login.form);
			return;
		}

		await this.appFormsSvc.showLoadingAsync(this.title);
		await this.authSvc.logInAsync(
			this.login.value.Email,
			this.login.value.Password,
			async data => await Promise.all([
				TrackingUtility.trackAsync(this.title, "/users/login"),
				this.appFormsSvc.hideLoadingAsync(() => {
					if (data.Require2FA) {
						this.openLoginOTPAsync(data);
					}
					else {
						this.close();
					}
				})
			]),
			async error => await this.appFormsSvc.showErrorAsync(error, undefined, () => this.login.controls.find(c => c.Key === "Email").focus())
		);
	}

	async openLoginOTPAsync(data: any) {
		this.otp.providers = data.Providers;
		this.otp.config = [
			{
				Key: "ID",
				Hidden: true
			},
			{
				Key: "Provider",
				Type: "Select",
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
				Key: "OTP",
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
		if (this.otp.providers.length < 2) {
			this.otp.config.find(c => c.Key === "Provider")["Excluded"] = true;
		}

		this.otp.value = {
			ID: data.ID,
			Provider: this.otp.providers[0].Info,
			OTP: ""
		};
		this.rxSubscriptions.push(this.otp.form.valueChanges.subscribe(async value => {
			const provider = this.otp.providers.find(p => p.Info === value.Provider) || this.otp.providers[0];
			this.otp.controls.find(c => c.Key === "OTP").Options.Description = "SMS" === provider.Type
				? await this.configSvc.getResourceAsync("users.login.otp.controls.OTP.description.sms")
				: await this.configSvc.getResourceAsync("users.login.otp.controls.OTP.description.app", { label: provider.Label });
		}));
		this.otp.button.label = await this.configSvc.getResourceAsync("users.login.otp.button");
		this.title = await this.configSvc.getResourceAsync("users.login.otp.title");
		this.mode = "otp";
		this.setTitle();
	}

	async logInOTPAsync() {
		if (this.otp.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.otp.form);
		}
		else {
			await this.appFormsSvc.showLoadingAsync(this.title);
			await this.authSvc.logInOTPAsync(
				this.otp.value.ID,
				this.otp.value.OTP,
				this.otp.value.Provider,
				async () => await Promise.all([
					TrackingUtility.trackAsync(this.title, "/users/otp"),
					this.appFormsSvc.hideLoadingAsync(() => this.close())
				]),
				async error => await this.appFormsSvc.showErrorAsync(error, undefined, () => {
					const control = this.otp.controls.find(c => c.Key === "OTP");
					control.value = "";
					control.focus();
				})
			);
		}
	}

	async openResetPasswordAsync() {
		this.reset.config = [
			{
				Key: "Email",
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
				Key: "Captcha",
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
			icon: undefined,
			color: "primary",
			fill: "solid"
		};
		this.title = await this.configSvc.getResourceAsync("users.login.reset.title");
		this.mode = "reset";
		this.setTitle();
	}

	async resetPasswordAsync() {
		if (this.reset.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.reset.form);
			return;
		}

		await this.appFormsSvc.showLoadingAsync(this.title);
		await this.authSvc.resetPasswordAsync(
			this.reset.value.Email,
			this.reset.value.Captcha,
			async () => await Promise.all([
				TrackingUtility.trackAsync(this.title, "/users/reset"),
				this.appFormsSvc.showAlertAsync(
					await this.configSvc.getResourceAsync("users.login.reset.title"),
					undefined,
					await this.configSvc.getResourceAsync("users.login.reset.message", { email: this.reset.value.Email }),
					() => this.close()
				)
			]),
			async error => await Promise.all([
				this.refreshCaptchaAsync(),
				this.appFormsSvc.showErrorAsync(error, undefined, () => this.reset.controls.find(c => c.Key === "Captcha").focus())
			])
		);
	}

	async refreshCaptchaAsync(control?: AppFormsControl) {
		await this.authSvc.registerCaptchaAsync(() => (control || this.reset.controls.find(c => c.Key === "Captcha")).captchaURI = this.configSvc.appConfig.session.captcha.uri);
	}

	onResetPasswordFormInitialized($event) {
		this.refreshCaptchaAsync();
		this.reset.form.patchValue({
			Email: this.login.form.value.Email
		});
	}

	onRefreshCaptcha($event) {
		this.refreshCaptchaAsync($event as AppFormsControl);
	}

	close() {
		if (this.configSvc.previousUrl.startsWith("/users")) {
			this.configSvc.navigateHome();
		}
		else {
			this.configSvc.navigateBack();
		}
	}

}
