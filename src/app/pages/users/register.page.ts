import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormGroup } from "@angular/forms";
import * as Rx from "rxjs";
import { AppFormsService, AppFormsControl } from "../../components/forms.service";
import { AppUtility } from "../../components/app.utility";
import { TrackingUtility } from "../../components/app.utility.trackings";
import { ConfigurationService } from "../../providers/configuration.service";
import { AuthenticationService } from "../../providers/authentication.service";
import { UserService } from "./../../providers/user.service";

@Component({
	selector: "page-register",
	templateUrl: "./register.page.html",
	styleUrls: ["./register.page.scss"]
})
export class RegisterAccountPage implements OnInit, OnDestroy {

	constructor (
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public authSvc: AuthenticationService,
		public userSvc: UserService
	) {
	}

	title = "Đăng ký tài khoản";
	register = {
		form: new FormGroup({}, [this.appFormsSvc.confirmIsMatched("Email", "ConfirmEmail"), this.appFormsSvc.confirmIsMatched("Password", "ConfirmPassword")]),
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>(),
		value: undefined as any,
		button: {
			label: "Đăng ký",
			icon: undefined,
			color: "primary",
			fill: "solid"
		}
	};
	private _rxSubscriptions = new Array<Rx.Subscription>();

	public ngOnInit() {
		if (!this.authSvc.canRegisterNewAccounts) {
			this.appFormsSvc.showToastAsync("Hmmmmm...");
			this.configSvc.goBack();
		}
		else {
			this._rxSubscriptions.push(this.register.form.valueChanges.subscribe(value => this.register.value = value));
			this.initializeForm();
		}
	}

	public ngOnDestroy() {
		this._rxSubscriptions.forEach(subscription => subscription.unsubscribe());
	}

	public initializeForm() {
		this.register.config = [
			{
				Key: "Email",
				Type: "TextBox",
				Required: true,
				Options: {
					Type: "email",
					Label: "Email",
					MinLength: 1,
					MaxLength: 250
				}
			},
			{
				Key: "ConfirmEmail",
				Type: "TextBox",
				Required: true,
				Validators: [this.appFormsSvc.isMatched("Email")],
				Options: {
					Type: "email",
					Label: "Nhập lại email",
					MinLength: 1,
					MaxLength: 250
				}
			},
			{
				Key: "Password",
				Type: "TextBox",
				Required: true,
				Options: {
					Type: "password",
					Label: "Mật khẩu",
					MinLength: 1,
					MaxLength: 150
				}
			},
			{
				Key: "ConfirmPassword",
				Type: "TextBox",
				Required: true,
				Validators: [this.appFormsSvc.isMatched("Password")],
				Options: {
					Type: "password",
					Label: "Nhập lại mật khẩu",
					MinLength: 1,
					MaxLength: 150
				}
			},
			{
				Key: "Name",
				Type: "TextBox",
				Required: true,
				Options: {
					Type: "text",
					Label: "Tên",
					Description: "Sử dụng để hiển thị trong hệ thống",
					DescriptionOptions: {
						Css: "--description-label-css"
					},
					MinLength: 1,
					MaxLength: 250
				}
			},
			{
				Key: "Gender",
				Type: "Select",
				Required: true,
				Options: {
					Type: "text",
					Label: "Giới tính",
					SelectOptions: {
						Values: [
							{
								Value: "NotProvided",
								Label: "Không cung cấp"
							},
							{
								Value: "Male",
								Label: "Nam"
							},
							{
								Value: "Female",
								Label: "Nữ"
							}
						],
						AsBoxes: false,
						Multiple: false,
						Interface: "alert"
					},
				}
			},
			{
				Key: "BirthDay",
				Type: "Date",
				Required: true,
				Options: {
					Type: "date",
					Label: "Ngày sinh",
					Min: new Date().getFullYear() - 100,
					Max: (new Date().getFullYear() - 16) + "-12-31",
				}
			},
			{
				Key: "Address",
				Type: "TextBox",
				Required: true,
				Options: {
					Type: "text",
					Label: "Địa chỉ",
					MinLength: 1,
					MaxLength: 250,
				}
			},
			{
				Key: "Addresses",
				Type: "Completer",
				Required: true,
				Options: {
					Type: "Address",
					PlaceHolder: "Quận/Huyện, Thành phố/Tỉnh",
					MinLength: 2
				}
			},
			{
				Key: "Mobile",
				Type: "TextBox",
				Required: true,
				Options: {
					Type: "tel",
					Label: "Mobile",
					MinLength: 10,
					MaxLength: 15,
				}
			},
			{
				Key: "Captcha",
				Type: "Captcha",
				Required: true,
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

		const excluded = AppUtility.toSet(this.configSvc.appConfig.accountRegistrations.excluded);
		const required = AppUtility.toSet(this.configSvc.appConfig.accountRegistrations.required);
		this.register.config.forEach(options => {
			if (excluded[options.Key]) {
				options.Excluded = true;
			}
			if (required[options.Key] && !options.Excluded) {
				options.Required = true;
			}
		});

		this.configSvc.appTitle = this.title;
	}

	public onFormRendered($event) {
		this.refreshCaptchaAsync();
		this.register.form.patchValue({ Gender: "NotProvided" });
	}

	public onRefreshCaptcha($event) {
		this.refreshCaptchaAsync($event as AppFormsControl);
	}

	public async refreshCaptchaAsync(control?: AppFormsControl) {
		control = control || this.register.controls.filter(ctrl => ctrl.Type === "Captcha")[0];
		await this.authSvc.registerCaptchaAsync(() => {
			this.register.form.controls[control.Key].setValue("");
			control.captchaUri = this.configSvc.appConfig.session.captcha.uri;
		});
	}

	public async registerAsync() {
		if (this.register.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.register.form);
			return;
		}

		await this.appFormsSvc.showLoadingAsync(this.title);
		await this.userSvc.registerAsync(AppUtility.clone(this.register.value, ["ConfirmEmail", "ConfirmPassword", "Addresses", "Captcha"]), this.register.value.Captcha,
			async data => {
				await TrackingUtility.trackAsync(this.title, "/user/register");
				await this.appFormsSvc.showAlertAsync("Đăng ký thành công", undefined, `Vui lòng kiểm tra địa chỉ email (${this.register.value.Email}) để kích hoạt tài khoản trước khi đăng nhập`, () => this.configSvc.goBack());
			},
			async error => await Promise.all([
				this.refreshCaptchaAsync(),
				this.appFormsSvc.showErrorAsync(error)
			])
		);
	}

}
