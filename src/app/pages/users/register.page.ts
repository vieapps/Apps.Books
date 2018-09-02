import * as Rx from "rxjs";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { AppFormsService, AppFormsControl } from "../../components/forms.service";
import { AppUtility } from "../../components/app.utility";
import { TrackingUtility } from "../../components/app.utility.trackings";
import { ConfigurationService } from "../../providers/configuration.service";
import { AuthenticationService } from "../../providers/authentication.service";
import { UsersService } from "../../providers/users.service";

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
		public usersSvc: UsersService
	) {
	}

	title = "Đăng ký tài khoản";
	rxSubscriptions = new Array<Rx.Subscription>();
	register = {
		form: new FormGroup({}, [this.appFormsSvc.areEquals("Email", "ConfirmEmail"), this.appFormsSvc.areEquals("Password", "ConfirmPassword")]),
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>(),
		value: undefined as any,
		button: {
			label: "Đăng ký",
			icon: undefined as string,
			color: "primary",
			fill: "solid"
		}
	};

	ngOnInit() {
		this.rxSubscriptions.push(this.register.form.valueChanges.subscribe(value => this.register.value = value));
		this.initializeForm();
	}

	ngOnDestroy() {
		this.rxSubscriptions.forEach(subscription => subscription.unsubscribe());
	}

	initializeForm() {
		this.register.config = [
			{
				Key: "Email",
				Required: true,
				Options: {
					Type: "email",
					Label: "Email",
					MinLength: 1,
					MaxLength: 250,
					AutoFocus: true
				}
			},
			{
				Key: "ConfirmEmail",
				Required: true,
				Validators: [this.appFormsSvc.isEquals("Email")],
				Options: {
					Type: "email",
					Label: "Nhập lại email",
					MinLength: 1,
					MaxLength: 250
				}
			},
			{
				Key: "Password",
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
				Required: true,
				Validators: [this.appFormsSvc.isEquals("Password")],
				Options: {
					Type: "password",
					Label: "Nhập lại mật khẩu",
					MinLength: 1,
					MaxLength: 150
				}
			},
			{
				Key: "Name",
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
						]
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
				Required: true,
				Options: {
					Type: "text",
					Label: "Địa chỉ",
					MinLength: 1,
					MaxLength: 250
				}
			},
			{
				Key: "Addresses",
				Type: "Completer",
				Required: true,
				Options: {
					Type: "Address",
					PlaceHolder: "Quận/Huyện, Thành phố/Tỉnh",
					MinLength: 2,
					MaxLength: 250
				}
			},
			{
				Key: "Mobile",
				Required: true,
				Options: {
					Type: "tel",
					Label: "Mobile",
					MinLength: 10,
					MaxLength: 15
				}
			},
			{
				Key: "Captcha",
				Type: "Captcha",
				Required: true,
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

	onFormInitialized($event) {
		this.refreshCaptchaAsync();
		this.register.form.patchValue({ Gender: "NotProvided" });
	}

	onRefreshCaptcha($event) {
		this.refreshCaptchaAsync($event as AppFormsControl);
	}

	async refreshCaptchaAsync(control?: AppFormsControl) {
		await this.authSvc.registerCaptchaAsync(() => {
			(control || this.register.controls.find(c => c.Key === "Captcha")).captchaUri = this.configSvc.appConfig.session.captcha.uri;
		});
	}

	async registerAsync() {
		if (this.register.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.register.form);
			return;
		}

		await this.appFormsSvc.showLoadingAsync(this.title);
		await this.usersSvc.registerAsync(AppUtility.clone(this.register.value, ["ConfirmEmail", "ConfirmPassword", "Addresses", "Captcha"]), this.register.value.Captcha,
			async () => {
				await TrackingUtility.trackAsync(this.title, "/user/register");
				await this.appFormsSvc.showAlertAsync("Đăng ký thành công", undefined, `Vui lòng kiểm tra địa chỉ email (${this.register.value.Email}) để kích hoạt tài khoản trước khi đăng nhập`, () => this.configSvc.navigateBack());
			},
			async error => await Promise.all([
				this.refreshCaptchaAsync(),
				this.appFormsSvc.showErrorAsync(error)
			])
		);
	}

}
