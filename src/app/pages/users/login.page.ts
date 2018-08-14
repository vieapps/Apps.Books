import { Component, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { FormGroup } from "@angular/forms";
import { first } from "rxjs/operators";
import { LoadingController, AlertController } from "@ionic/angular";
import { AppFormsService } from "../../components/forms.service";
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
			console.log("Changed value", value);
		});

		this.loginForm.config = [
			{
				Key: "Email",
				Value: "",
				Type: "TextBox",
				Control: {
					Type: "email",
					Label: "Email",
					LabelSettings: {
						Position: "floating",
						Color: "primary",
						Css: ""
					},
					MinLength: 1,
					MaxLength: 150,
					AutoFocus: true
				},
				Required: true
			},
			{
				Key: "Password",
				Value: "",
				Type: "TextBox",
				Control: {
					Type: "password",
					Label: "Mật khẩu",
					LabelSettings: {
						Position: "floating",
						Color: "primary",
						Css: ""
					},
					MinLength: 1,
					MaxLength: 150,
				},
				Required: true
			}, /**/
			{
				Key: "OTP",
				Control: {
					Label: "One time password",
					LabelSettings: {
						Color: undefined,
						Css: ""
					},
				},
				Children: {
					AsArray: true,
					Controls: [
						{
							Key: "Value1",
							Value: "",
							Type: "TextBox",
							Control: {
								Type: "text",
								Label: "Mật khẩu OTP 1",
								LabelSettings: {
									Position: "floating",
									Color: "primary",
									Css: ""
								},
								PlaceHolder: "Nhập mã OTP trong ứng dụng vào đây",
								MinLength: 4,
								MaxLength: 10,
							},
							Required: true
						},
						{
							Key: "Value2",
							Value: "",
							Type: "TextBox",
							Control: {
								Type: "text",
								Label: "Mật khẩu OTP 2",
								LabelSettings: {
									Position: "floating",
									Color: "primary",
									Css: ""
								},
								PlaceHolder: "Nhập mã OTP trong ứng dụng vào đây",
								MinLength: 4,
								MaxLength: 10,
							},
							Required: true
						}
					]
				}
			}/**/
		];

		this.activatedRoute.params.pipe(first()).subscribe(params => {
			// console.log("Params =>", params);
		});
	}

	async showErrorAsync(error: any, handler?: () => void) {
		if (this.info.state.mode === "renew") {
			this.renewCaptchaAsync();
		}

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

	async renewCaptchaAsync () {
		await this.authSvc.registerCaptchaAsync(() => {
			this.info.captcha = {
				code: "",
				uri: this.configSvc.appConfig.session.captcha.uri
			};
		});
	}

	async openResetPasswordAsync() {
		this.info.state.mode = "renew";
		this.info.state.title = "Lấy mật khẩu mới";
		await this.renewCaptchaAsync();
	}

	async resetPasswordAsync() {
	}

}
