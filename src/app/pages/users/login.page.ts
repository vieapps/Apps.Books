import * as Rx from "rxjs";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { registerLocaleData } from "@angular/common";
import { FormGroup } from "@angular/forms";
import { TrackingUtility } from "../../components/app.utility.trackings";
import { AppFormsControl, AppFormsService } from "../../components/forms.service";
import { ConfigurationService } from "../../providers/configuration.service";
import { AuthenticationService } from "../../providers/authentication.service";

@Component({
	selector: "page-login",
	templateUrl: "./login.page.html",
	styleUrls: ["./login.page.scss"]
})
export class LogInPage implements OnInit, OnDestroy {

	constructor (
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public authSvc: AuthenticationService
	) {
		registerLocaleData(this.configSvc.locale);
	}

	title = "Đăng nhập";
	mode = "log-in";
	rxSubscriptions = new Array<Rx.Subscription>();
	login = {
		form: new FormGroup({}),
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>(),
		value: undefined as any,
		button: {
			label: "Đăng nhập",
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
			label: "Xác thực",
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
			label: "Quên mật khẩu",
			icon: "key",
			color: "primary",
			fill: "clear"
		}
	};

	ngOnInit() {
		this.rxSubscriptions.push(this.login.form.valueChanges.subscribe(value => this.login.value = value));
		this.rxSubscriptions.push(this.otp.form.valueChanges.subscribe(value => this.otp.value = value));
		this.rxSubscriptions.push(this.reset.form.valueChanges.subscribe(value => this.reset.value = value));
		this.openLogin();
	}

	ngOnDestroy() {
		this.rxSubscriptions.forEach(subscription => subscription.unsubscribe());
	}

	openLogin() {
		this.login.config = [
			{
				Key: "Email",
				Required: true,
				Options: {
					Type: "email",
					Label: "Email",
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
					Label: "Mật khẩu",
					MinLength: 1,
					MaxLength: 150,
				}
			}
		];
		this.mode = "log-in";
		this.title = "Đăng nhập";
		this.configSvc.appTitle = this.title;
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
						this.openLoginOTP(data);
					}
					else {
						this.configSvc.navigateBack();
					}
				})
			]),
			async error => await this.appFormsSvc.showErrorAsync(error, "Không thể đăng nhập", () => this.login.controls.find(c => c.Key === "Email").focus())
		);
	}

	openLoginOTP(data: any) {
		this.otp.providers = data.Providers;
		this.otp.config = [
			{
				Key: "ID",
				Excluded: true
			},
			{
				Key: "Provider",
				Type: "Select",
				Options: {
					Label: "Kiểu xác thực lần hai",
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
					Label: `Mã xác thực lần hai`,
					Description: "",
					DescriptionOptions: {
						Css: "--description-label-css"
					},
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
		this.rxSubscriptions.push(this.otp.form.valueChanges.subscribe(value => {
			const provider = this.otp.providers.find(p => p.Info === value.Provider) || this.otp.providers[0];
			this.otp.controls.find(c => c.Key === "OTP").Options.Description = "SMS" === provider.Type
				? "Nhập mã OTP trong SMS được gửi tới số trên điện thoại đã đăng ký"
				: `Nhập mã OTP được sinh bởi ứng dụng ${provider.Label} trên điện thoại`;
		}));

		this.mode = "otp";
		this.title = "Xác thực lần hai";
		this.configSvc.appTitle = this.title;
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
					this.appFormsSvc.hideLoadingAsync(() => this.configSvc.navigateBack())
				]),
				async error => await this.appFormsSvc.showErrorAsync(error, undefined, () => {
					const control = this.otp.controls.find(c => c.Key === "OTP");
					control.value = "";
					control.focus();
				})
			);
		}
	}

	openResetPassword() {
		this.reset.config = [
			{
				Key: "Email",
				Required: true,
				Options: {
					Type: "email",
					Label: "Email",
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
					Label: "Mã xác thực",
					Description: "Nhập mã xác thực trong ảnh ở dưới",
					DescriptionOptions: {
						Css: "--description-label-css"
					},
					MinLength: 4,
					MaxLength: 4
				}
			}
		];
		this.mode = "reset";
		this.title = "Lấy mật khẩu mới";
		this.reset.button = {
			label: "Lấy mật khẩu",
			icon: undefined,
			color: "primary",
			fill: "solid"
		};
		this.configSvc.appTitle = this.title;
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
				this.appFormsSvc.showAlertAsync("Mật khẩu mới", undefined, `Vui lòng kiểm tra email (${this.reset.value.Email}) và làm theo hướng dẫn để lấy mật khẩu mới!`, () => this.configSvc.navigateBack())
			]),
			async error => await Promise.all([
				this.refreshCaptchaAsync(),
				this.appFormsSvc.showErrorAsync(error, undefined, () => this.reset.controls.find(c => c.Key === "Captcha").focus())
			])
		);
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

	async refreshCaptchaAsync(control?: AppFormsControl) {
		await this.authSvc.registerCaptchaAsync(() => (control || this.reset.controls.find(c => c.Key === "Captcha")).captchaURI = this.configSvc.appConfig.session.captcha.uri);
	}

}
