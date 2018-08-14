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
		controls: undefined as Array<AppFormsControl>
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
			// console.log("Changed value", value);
		});

		this.loginForm.config = [
			{
				Key: "Email",
				Value: "email@company.com",
				Required: true,
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
					LabelSettings: {
						Position: "floating",
						Color: "primary",
						Css: ""
					},
					MinLength: 1,
					MaxLength: 150,
				}
			},
			{
				Key: "OTP",
				Control: {
					Label: "One time password",
					LabelSettings: {
						Color: undefined,
						Css: ""
					},
				},
				SubControls: {
					AsArray: false,
					Controls: [
						{
							Key: "SMS",
							Value: "qwert",
							Required: true,
							Type: "TextBox",
							Control: {
								Type: "text",
								Label: "Mật khẩu SMS OTP",
								LabelSettings: {
									Position: "floating",
									Color: "primary",
									Css: ""
								},
								PlaceHolder: "Nhập mã OTP trong SMS vào đây",
								MinLength: 4,
								MaxLength: 10,
							}
						},
						{
							Key: "App",
							Value: "123456",
							Required: true,
							Type: "TextBox",
							Control: {
								Type: "text",
								Label: "Mật khẩu App OTP",
								LabelSettings: {
									Position: "floating",
									Color: "primary",
									Css: ""
								},
								PlaceHolder: "Nhập mã OTP trong ứng dụng vào đây",
								MinLength: 4,
								MaxLength: 10,
							}
						}
					]
				}
			},
			{
				Key: "Technologies",
				Control: {
					Label: "Technologies",
					LabelSettings: {
						Color: undefined,
						Css: ""
					},
				},
				SubControls: {
					AsArray: true,
					Controls: [
						{
							Key: "",
							Value: "",
							Type: "TextBox",
							Control: {
								Label: "Tech name"
							}
						},
						{
							Key: "",
							Value: "",
							Type: "TextBox",
							Control: {
								Label: "Tech name"
							}
						}
					]
				}
			}, /**/
			{
				Key: "SocialNetworks",
				Control: {
					Label: "Mạng xã hội",
					LabelSettings: {
						Color: undefined,
						Css: ""
					},
				},
				SubControls: {
					AsArray: true,
					Controls: [
						{
							Key: "Facebook",
							Value: "",
							Type: "TextBox",
							Control: {
								Type: "text",
								Label: "Facebook"
							},
							SubControls: {
								Controls: [
									{
										Key: "DisplayName",
										Value: "",
										Type: "TextBox",
										Control: {
											Type: "text",
											Label: "Display name"
										}
									},
									{
										Key: "Alias",
										Value: "",
										Type: "TextBox",
										Control: {
											Type: "text",
											Label: "Alias"
										}
									}
								]
							}
						},
						{
							Key: "Twitter",
							Value: "",
							Type: "TextBox",
							Control: {
								Type: "text",
								Label: "Twitter"
							},
							SubControls: {
								Controls: [
									{
										Key: "DisplayName",
										Value: "",
										Type: "TextBox",
										Control: {
											Type: "text",
											Label: "Display name"
										}
									},
									{
										Key: "Alias",
										Value: "",
										Type: "TextBox",
										Control: {
											Type: "text",
											Label: "Alias"
										}
									}
								]
							}
						}
					]
				}
			} /**/
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
