import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormGroup } from "@angular/forms";
import * as Rx from "rxjs";
import { LoadingController, AlertController } from "@ionic/angular";
import { AppFormsService, AppFormsControl } from "../../components/forms.service";
import { AppUtility } from "../../components/app.utility";
import { ConfigurationService } from "../../providers/configuration.service";
import { AuthenticationService } from "../../providers/authentication.service";
import { TrackingUtility } from "../../components/app.utility.trackings";

@Component({
	selector: "page-login",
	templateUrl: "./login.page.html",
	styleUrls: ["./login.page.scss"]
})
export class LogInPage implements OnInit, OnDestroy {

	constructor (
		public loadingController: LoadingController,
		public alertController: AlertController,
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public authSvc: AuthenticationService
	) {
	}

	title = "Đăng nhập";
	mode = "log-in";
	login = {
		form: new FormGroup({}),
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>(),
		value: undefined as any,
		button: {
			label: "Đăng nhập",
			icon: undefined,
			color: "primary",
			fill: "solid"
		}
	};
	otp = {
		form: new FormGroup({}),
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>(),
		value: undefined as any,
		button: {
			label: "Xác thực",
			icon: undefined,
			color: "primary",
			fill: "solid"
		},
		id: undefined as string,
		providers: undefined as Array<any>
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
	private _loading = undefined;
	private _rxSubscriptions = new Array<Rx.Subscription>();

	public ngOnInit() {
		this._rxSubscriptions.push(this.login.form.valueChanges.subscribe(value => this.login.value = value));
		this._rxSubscriptions.push(this.otp.form.valueChanges.subscribe(value => this.otp.value = value));
		this._rxSubscriptions.push(this.reset.form.valueChanges.subscribe(value => this.reset.value = value));
		this.openLogin();
	}

	public ngOnDestroy() {
		this._rxSubscriptions.forEach(subscription => subscription.unsubscribe());
	}

	private async showLoadingAsync(message?: string) {
		this._loading = await this.loadingController.create({
			content: message || this.title
		});
		await this._loading.present();
	}

	private async hideLoadingAsync() {
		if (this._loading !== undefined) {
			await this._loading.dismiss();
			this._loading = undefined;
		}
	}

	private async showAlertAsync(message: string, header?: string, subHeader?: string, postProcess?: () => void) {
		const alert = await this.alertController.create({
			header: header || "Chú ý",
			subHeader: subHeader,
			backdropDismiss: false,
			message: message,
			buttons: [{
				text: "Đóng",
				handler: () => {
					if (postProcess !== undefined) {
						postProcess();
					}
				}
			}]
		});
		await alert.present();
	}

	private async showErrorAsync(error: any, subHeader?: string, postProcess?: () => void) {
		await this.hideLoadingAsync();
		const message = AppUtility.isGotWrongAccountOrPasswordException(error)
			? "Email hoặc mật khẩu không đúng!"
			: AppUtility.isGotCaptchaException(error) || AppUtility.isGotOTPException(error)
				? "Mã xác thực không đúng"
				: AppUtility.isNotEmpty(error.Message) ? error.Message : "Đã xảy ra lỗi!";
		await this.showAlertAsync(message, "Lỗi", subHeader, postProcess);
	}

	public openLogin() {
		this.login.config = [
			{
				Key: "Email",
				Required: true,
				Type: "TextBox",
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
				Type: "TextBox",
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

	public async loginAsync() {
		if (this.login.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.login.form);
			return;
		}

		await this.showLoadingAsync();
		await this.authSvc.logInAsync(this.login.value.Email, this.login.value.Password,
			async data => {
				await TrackingUtility.trackAsync("Log In", "/session/login");
				await this.hideLoadingAsync();
				if (data.Require2FA) {
					this.openValidateOTP(data);
				}
				else {
					this.configSvc.goBack();
				}
			},
			async error => {
				await this.showErrorAsync(error, "Không thể đăng nhập");
			}
		);
	}

	public openValidateOTP(data: any) {
		this.otp.config = [
			{
				Key: "OTP",
				Required: true,
				Options: {
					Type: "text",
					Label: `Mã xác thực lần hai`,
					Description: "SMS" === data.Providers[0].Type ? "Nhập mã OTP trong SMS được gửi tới số trên điện thoại đã đăng ký" : `Nhập mã OTP được sinh bởi ứng dụng ${data.Providers[0].Label} trên điện thoại`,
					DescriptionOptions: {
						Css: "--description-label-css"
					},
					MinLength: 6,
					MaxLength: 6,
					AutoFocus: true
				}
			}
		];
		this.otp.id = data.ID;
		this.otp.providers = data.Providers;
		this.mode = "otp";
		this.title = "Xác thực lần hai";
		this.configSvc.appTitle = this.title;
	}

	public async validateOTPAsync() {
		if (this.otp.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.otp.form);
			return;
		}

		await this.showLoadingAsync();
		await this.authSvc.validateOTPAsync(this.otp.id, this.otp.value.OTP, this.otp.providers[0].Info,
			async data => {
				await TrackingUtility.trackAsync("OTP Validation", "/session/otp");
				await this.hideLoadingAsync();
				this.configSvc.goBack();
			},
			async error => {
				await this.showErrorAsync(error, "Không thể xác thực lần hai");
			}
		);
	}

	public openResetPassword() {
		this.reset.config = [
			{
				Key: "Email",
				Required: true,
				Type: "TextBox",
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
					Type: "text",
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

	public onResetFormRendered($event) {
		this.reset.form.patchValue({ Email: this.login.form.value.Email });
		this.refreshCaptchaAsync();
	}

	public onRefreshCaptcha($event) {
		this.refreshCaptchaAsync($event as AppFormsControl);
	}

	public async refreshCaptchaAsync(control?: AppFormsControl) {
		control = control || this.reset.controls.filter(ctrl => ctrl.Type === "Captcha")[0];
		await this.authSvc.registerCaptchaAsync(() => {
			this.reset.form.controls[control.Key].setValue("");
			control.Extras["Uri"] = this.configSvc.appConfig.session.captcha.uri;
		});
	}

	public async resetPasswordAsync() {
		if (this.reset.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.reset.form);
			return;
		}

		await this.showLoadingAsync();
		await this.authSvc.resetPasswordAsync(this.reset.value.Email, this.reset.value.Captcha,
			async data => {
				await TrackingUtility.trackAsync("Reset Password", "/session/reset");
				await this.hideLoadingAsync();
				await this.showAlertAsync(`Vui lòng kiểm tra email (${this.reset.value.Email}) và làm theo hướng dẫn để lấy mật khẩu mới!`, "Mật khẩu mới", undefined, () => this.configSvc.goBack());
			},
			async error => {
				await Promise.all([
					this.refreshCaptchaAsync(),
					this.showErrorAsync(error)
				]);
			}
		);
	}

}
