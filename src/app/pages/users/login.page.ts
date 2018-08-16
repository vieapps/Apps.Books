import { Component, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { FormGroup } from "@angular/forms";
import { first } from "rxjs/operators";
import { LoadingController, AlertController } from "@ionic/angular";
import { AppFormsService, AppFormsControl } from "../../components/forms.service";
import { AppUtility } from "../../components/app.utility";
import { ConfigurationService } from "../../providers/configuration.service";
import { AuthenticationService } from "../../providers/authentication.service";

@Component({
	selector: "page-login",
	templateUrl: "login.page.html",
	styleUrls: ["login.page.scss"],
})
export class LogInPage implements OnInit {

	// data
	info = {
		state: {
			title: "Đăng nhập",
			mode: "log-in",
			processing: true,
			valid: false
		},
		captcha: {
			code: "",
			uri: ""
		},
	};

	// forms
	loginForm = {
		form: new FormGroup({}),
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>(),
		invalid: {}
	};

	constructor (
		public router: Router,
		public activatedRoute: ActivatedRoute,
		public loadingCtrl: LoadingController,
		public alertCtrl: AlertController,
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public authSvc: AuthenticationService
	) {
	}

	ngOnInit() {
		this.initialize();
	}

	initialize() {
		this.loginForm.form.valueChanges.subscribe(value => {
			// console.log("Form", this.loginForm.form);
		});

		this.loginForm.config = [
			{
				Key: "Email",
				Value: "email@company.c",
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
				Value: "thePasswORd",
				Required: true,
				Type: "TextBox",
				Control: {
					Type: "password",
					Label: "Mật khẩu",
					MinLength: 1,
					MaxLength: 150,
				}
			},
			{
				Key: "CaptchaCode",
				Value: "",
				Required: true,
				Type: "Captcha",
				Control: {
					Type: "text",
					Label: "Captcha",
					MinLength: 4,
					MaxLength: 4
				}
			}
		];

		this.activatedRoute.params.pipe(first()).subscribe(params => {
			// console.log("Params =>", params);
		});
	}

	async showErrorAsync(error: any, handler?: () => void) {
		// if (this.info.state.mode === "renew") {
		// 	this.renewCaptchaAsync(undefined);
		// }

		const message = AppUtility.isGotWrongAccountOrPasswordException(error)
			? "Email hoặc mật khẩu không đúng!"
			: AppUtility.isGotCaptchaException(error)
				? "Mã xác thực không đúng"
				: AppUtility.isNotEmpty(error.Message)
					? error.Message
					: "Đã xảy ra lỗi!";
		const alert = await this.alertCtrl.create({
			header: "Lỗi",
			message: message,
			enableBackdropDismiss: false,
			buttons: [{
				text: "Đóng",
				handler: () => {
					this.info.state.processing = false;
					if (handler !== undefined) {
						handler();
					}
					else {
						const password = this.loginForm.form.controls["password"];
						if (password !== undefined) {
							password.setValue("");
						}
					}
				}
			}]
		});
		await alert.present();
	}

	async loginAsync() {
		if (this.loginForm.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.loginForm.form);
		}
		const formValue = this.loginForm.form.value;
		console.log("Form value", typeof formValue, formValue);
		return;

		const loading = await this.loadingCtrl.create({ content: this.info.state.title });
		await loading.present();
		await this.authSvc.logInAsync(formValue.Email, formValue.Password, async (data) => {
			await loading.dismiss();
		}, async (error) => {
			await loading.dismiss();
			await this.showErrorAsync(error, () => {

			});
		});
	}

	onLoginFormReady($event) {
		this.renewCaptchaAsync();
	}

	onRefreshCaptcha($event) {
		this.renewCaptchaAsync($event as AppFormsControl);
	}

	async renewCaptchaAsync(control?: AppFormsControl) {
		control = control || this.loginForm.controls.filter(ctrl => ctrl.Type === "Captcha")[0];
		await this.authSvc.registerCaptchaAsync(() => {
			control.Extra["Uri"] = this.configSvc.appConfig.session.captcha.uri;
		});
	}

	async openResetPasswordAsync() {
		this.info.state.mode = "renew";
		this.info.state.title = "Lấy mật khẩu mới";
		// await this.renewCaptchaAsync(undefined);
	}

	async resetPasswordAsync() {
	}

}
