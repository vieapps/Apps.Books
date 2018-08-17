import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { FormGroup } from "@angular/forms";
import { first } from "rxjs/operators";
import { LoadingController, AlertController, NavController } from "@ionic/angular";
import { AppFormsService, AppFormsControl } from "../../components/forms.service";
import { AppUtility } from "../../components/app.utility";
import { ConfigurationService } from "../../providers/configuration.service";
import { AuthenticationService } from "../../providers/authentication.service";

@Component({
	selector: "page-login",
	templateUrl: "./login.page.html",
	styleUrls: ["./login.page.scss"],
})
export class LogInPage implements OnInit {

	constructor (
		public activatedRoute: ActivatedRoute,
		public navController: NavController,
		public loadingController: LoadingController,
		public alertController: AlertController,
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public authSvc: AuthenticationService
	) {
	}

	// state info
	info = {
		state: {
			title: "Đăng nhập",
			mode: "log-in"
		},
		buttons: {
			login: {
				label: "Đăng nhập",
				icon: undefined,
				color: "primary",
				fill: "solid"
			},
			otp: {
				label: "Xác thực",
				icon: undefined,
				color: "primary"
			},
			reset: {
				label: "Quên mật khẩu",
				icon: "key",
				color: "primary",
				fill: "clear"
			}
		}
	};

	// forms
	login = {
		form: new FormGroup({}),
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>()
	};
	otp = {
		form: new FormGroup({}),
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>()
	};
	reset = {
		form: new FormGroup({}),
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>()
	};

	ngOnInit() {
		// this.activatedRoute.params.pipe(first()).subscribe(params => {
		// });
		// this.router.events.su
		this.openLogin();
	}

	async showAlertAsync(message: any, header?: string, postProcess?: () => void) {
		const alert = await this.alertController.create({
			header: header || "Chú ý",
			message: message,
			enableBackdropDismiss: false,
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

	async showErrorAsync(error: any, postProcess?: () => void) {
		const message = AppUtility.isGotWrongAccountOrPasswordException(error)
			? "Email hoặc mật khẩu không đúng!"
			: AppUtility.isGotCaptchaException(error)
				? "Mã xác thực không đúng"
				: AppUtility.isNotEmpty(error.Message)
					? error.Message
					: "Đã xảy ra lỗi!";
		await this.showAlertAsync(message, "Lỗi", postProcess);
	}

	openLogin() {
		this.login.config = [
			{
				Key: "Email",
				Value: "",
				Required: true,
				Type: "TextBox",
				Control: {
					Type: "email",
					Label: "Email",
					MinLength: 1,
					MaxLength: 150,
					AutoFocus: true
				}
			},
			{
				Key: "Password",
				Value: "",
				Required: true,
				Type: "TextBox",
				Control: {
					Type: "password",
					Label: "Mật khẩu",
					MinLength: 1,
					MaxLength: 150,
				}
			}
		];

		this.info.state.mode = "log-in";
		this.info.state.title = "Đăng nhập";
		this.configSvc.appTitle = this.info.state.title;
	}

	async loginAsync() {
		if (this.login.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.login.form);
			return;
		}

		const loading = await this.loadingController.create({ content: this.info.state.title });
		await loading.present();

		const form = this.login.form.value;
		await this.authSvc.logInAsync(form.Email, form.Password,
			async data => {
				await loading.dismiss();
				if (data.Require2FA) {
					this.openValidateOTP();
				}
				else {
					this.navController.goBack(this.configSvc.previousUrl);
				}
			},
			async error => {
				await loading.dismiss();
				await this.showErrorAsync(error);
			}
		);
	}

	openValidateOTP() {
	}

	async validateOTPAsync() {
		if (this.otp.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.otp.form);
			return;
		}
	}

	openResetPassword() {
		this.reset.config = [
			{
				Key: "Email",
				Value: this.login.form.value.Email,
				Required: true,
				Type: "TextBox",
				Control: {
					Type: "email",
					Label: "Email",
					MinLength: 1,
					MaxLength: 150,
					AutoFocus: true
				}
			},
			{
				Key: "CaptchaCode",
				Value: "",
				Required: true,
				Type: "Captcha",
				Control: {
					Type: "text",
					Label: "Mã xác thực",
					MinLength: 4,
					MaxLength: 4
				}
			}
		];
		this.info.state.mode = "reset";
		this.info.state.title = "Lấy mật khẩu mới";
		this.info.buttons.reset = {
			label: "Lấy mật khẩu",
			icon: undefined,
			color: "primary",
			fill: "solid"
		};
		this.configSvc.appTitle = this.info.state.title;
	}

	onResetFormReady($event) {
		this.renewCaptchaAsync();
	}

	onRefreshCaptcha($event) {
		this.renewCaptchaAsync($event as AppFormsControl);
	}

	async renewCaptchaAsync(control?: AppFormsControl) {
		control = control || this.reset.controls.filter(ctrl => ctrl.Type === "Captcha")[0];
		await this.authSvc.registerCaptchaAsync(() => {
			control.Extra["Uri"] = this.configSvc.appConfig.session.captcha.uri;
		});
	}

	async resetPasswordAsync() {
		if (this.reset.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.reset.form);
			return;
		}
	}

}
