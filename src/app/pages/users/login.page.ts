import { Component, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { FormGroup } from "@angular/forms";
import { first } from "rxjs/operators";
import { LoadingController, AlertController } from "@ionic/angular";
import { AppFormsService, AppFormsControl } from "../../components/forms.service";
import { AppUtility } from "../../components/app.utility";
import { ConfigurationService } from "../../providers/configuration.service";
import { AuthenticationService } from "../../providers/authentication.service";
import { TrackingUtility } from "../../components/app.utility.trackings";

@Component({
	selector: "page-login",
	templateUrl: "./login.page.html",
	styleUrls: ["./login.page.scss"],
})
export class LogInPage implements OnInit, OnDestroy {

	constructor (
		public activatedRoute: ActivatedRoute,
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
		button: {
			label: "Quên mật khẩu",
			icon: "key",
			color: "primary",
			fill: "clear"
		}
	};
	loading = undefined;

	public ngOnInit() {
		// this.activatedRoute.params.pipe(first()).subscribe(params => {
		// });
		// this.router.events.su
		this.openLogin();
	}

	public ngOnDestroy() {
	}

	private async showLoadingAsync(message?: string) {
		this.loading = await this.loadingController.create({
			content: message || this.title
		});
		await this.loading.present();
	}

	private async hideLoadingAsync() {
		if (this.loading !== undefined) {
			await this.loading.dismiss();
			this.loading = undefined;
		}
	}

	private async showAlertAsync(message: any, header?: string, subHeader?: string, postProcess?: () => void) {
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
			: AppUtility.isGotCaptchaException(error)
				? "Mã xác thực không đúng"
				: AppUtility.isNotEmpty(error.Message) ? error.Message : "Đã xảy ra lỗi!";
		await this.showAlertAsync(message, "Lỗi", subHeader, postProcess);
	}

	public openLogin() {
		this.login.config = [
			{
				Key: "ID",
				Excluded: true
			},
			{
				Key: "Email",
				Required: true,
				Type: "TextBox",
				Options: {
					Type: "email",
					Label: "Email",
					LabelOptions: {
						Position: "floating",
					},
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
			},
			{
				Key: "OTP",
				Options: {
					Label: "OTP"
				},
				SubControls: {
					AsArray: false,
					Controls: [
						{
							Key: "SMS",
							Required: true,
							Type: "TextBox",
							Options: {
								Label: "SMS"
							}
						},
						{
							Key: "Authenticator",
							Required: true,
							Type: "TextBox",
							Options: {
								Label: "Authenticator"
							}
						}
					]
				}
			},
			{
				Key: "Platforms",
				Options: {
					Label: "Platforms"
				},
				SubControls: {
					AsArray: true,
					Controls: [
						{
							Key: "Platform",
							Options: {
								Label: "Platform"
							}
						}
					]
				}
			},
			/**/
			{
				Key: "SocialNetworks",
				Options: {
					Label: "Social Networks"
				},
				SubControls: {
					AsArray: true,
					Controls: [
						{
							Key: "SocialNetwork",
							Type: "TextBox",
							Options: {
								Label: "Network"
							},
							SubControls: {
								AsArray: false,
								Controls: [
									{
										Key: "Network",
										Type: "TextBox",
										Options: {
											Label: "Network Name"
										}
									},
									{
										Key: "Name",
										Type: "TextBox",
										Options: {
											Label: "Name"
										}
									},
									{
										Key: "Alias",
										Type: "TextBox",
										Options: {
											Label: "Alias"
										}
									},
									{
										Key: "Groups",
										Options: {
											Label: "Groups"
										},
										SubControls: {
											AsArray: true,
											Controls: [
												{
													Key: "Group",
													Type: "TextBox",
													Options: {
														Label: "Group"
													}
												}
											]
										}
									}
								]
							}
						},
					]
				}
			},
			/**/
			{
				Key: "DevStacks",
				Options: {
					Label: "App Development Stacks"
				},
				SubControls: {
					AsArray: true,
					Controls: [
						{
							Key: "Stack",
							Type: "TextBox",
							Options: {
								Label: "Stack"
							},
							SubControls: {
								AsArray: false,
								Controls: [
									{
										Key: "Area",
										Type: "TextBox",
										Options: {
											Label: "Dev Area"
										}
									},
									{
										Key: "Technologies",
										Type: "TextBox",
										Options: {
											Label: "Technologies"
										},
										SubControls: {
											AsArray: true,
											Controls: [
												{
													Key: "Name",
													Type: "TextBox",
													Options: {
														Label: "Tech Name"
													}
												}
											]
										}
									}
								]
							}
						},
					]
				}
			}
			/**/
		];

		this.login.value = {
			Email: "email@company.com",
			Password: "thepASSworD",
			OTP: {
				SMS: "S-12345",
				Authenticator: "A-654321"
			},
			Platforms: ["Microsoft Windows", "Apple macOS", "Ubuntu Linux", "iOS", "Android", "BlackBerry10"],
			SocialNetworks: [
				{
					Network: "Facebook",
					Name: "FB Name",
					Alias: "fb.alias",
					Groups: ["fb.group.1", "fb.group.2"]
				},
				{
					Network: "Twitter",
					Name: "TName",
					Alias: "talias",
					Groups: []
				}
			],
			DevStacks: [
				{
					Area: "Front-end",
					Technologies: ["HTML5", "CSS", "WebSocket", "Angular", "Apache Cordova", "Telerik NativeScript", "React Native", "Ionic", "Web Components"]
				},
				{
					Area: "Back-end",
					Technologies: ["C#", ".NET Core", "HAProxy", "Microservices"]
				}
			]
		};

		// this.appFormsSvc.getControls(this.login.config, this.login.controls);
		// this.appFormsSvc.updateControls(this.login.controls, this.login.value);
		// this.appFormsSvc.buildForm(this.login.form, this.login.controls);
		// this.login.form.patchValue(this.login.value);

		// console.log("Config", this.login.config);
		// console.log("Controls", this.login.controls);
		// console.log("Form", this.login.form);
		// console.log("Raw Value", this.login.value);
		// console.log("From Value", this.login.form.value);

		this.mode = "log-in";
		this.title = "Đăng nhập";
		this.configSvc.appTitle = this.title;
	}

	public onLoginFormRendered($event) {
		this.appFormsSvc.setValue(this.login.form, this.login.controls, this.login.value);
		console.log("Config", this.login.config);
		console.log("Controls", this.login.controls);
		console.log("Form", this.login.form);
		console.log("Raw Value", this.login.value);
		console.log("Form Value", this.login.form.value);
	}

	public async loginAsync() {
		console.log("Form Value", this.login.form.value);
		return;

		if (this.login.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.login.form);
			return;
		}

		await this.showLoadingAsync();
		await this.authSvc.logInAsync(this.login.form.value.Email, this.login.form.value.Password,
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
				Value: "",
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
		await this.authSvc.validateOTPAsync(this.otp.id, this.otp.form.value.OTP, this.otp.providers[0].Info,
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
				Value: this.login.form.value.Email || "",
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
				Value: "",
				Required: true,
				Type: "Captcha",
				Options: {
					Type: "text",
					Label: "Mã xác thực",
					// PlaceHolder: "Nhập mã xác thực trong ảnh ở dưới",
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
		this.renewCaptchaAsync();
	}

	public onRefreshCaptcha($event) {
		this.renewCaptchaAsync($event as AppFormsControl);
	}

	public async renewCaptchaAsync(control?: AppFormsControl) {
		control = control || this.reset.controls.filter(ctrl => ctrl.Type === "Captcha")[0];
		await this.authSvc.registerCaptchaAsync(() => {
			control.Extras["Uri"] = this.configSvc.appConfig.session.captcha.uri;
		});
	}

	public async resetPasswordAsync() {
		if (this.reset.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.reset.form);
			return;
		}

		await this.showLoadingAsync();
		await this.authSvc.resetPasswordAsync(this.reset.form.value.Email, this.reset.form.value.Captcha,
			async data => {
				await TrackingUtility.trackAsync("Reset Password", "/session/reset");
				await this.hideLoadingAsync();
				await this.showAlertAsync("Vui lòng kiểm tra email và làm theo hướng dẫn để lấy mật khẩu mới!", "Mật khẩu mới");
				this.configSvc.goBack();
			},
			async error => {
				await Promise.all([
					this.renewCaptchaAsync(),
					this.showErrorAsync(error)
				]);
			}
		);
	}

}
