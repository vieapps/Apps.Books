import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormGroup } from "@angular/forms";
import * as Rx from "rxjs";
import { LoadingController, AlertController } from "@ionic/angular";
import { AppFormsService, AppFormsControl } from "../../components/forms.service";
import { AppUtility } from "../../components/app.utility";
import { TrackingUtility } from "../../components/app.utility.trackings";
import { ConfigurationService } from "../../providers/configuration.service";
import { AuthenticationService } from "../../providers/authentication.service";
import { UserService } from "./../../providers/user.service";
import { CompleterData, CompleterItem } from "ng2-completer";
import { AppCustomCompleter } from "../../components/app.completer";
import { AppPagination } from "../../components/app.pagination";
import { Profile } from "../../models/profile";

@Component({
	selector: "page-register",
	templateUrl: "./register.page.html",
	styleUrls: ["./register.page.scss"]
})
export class RegisterAccountPage implements OnInit, OnDestroy {

	constructor (
		public loadingController: LoadingController,
		public alertController: AlertController,
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public authSvc: AuthenticationService,
		public userSvc: UserService
	) {
	}

	title = "Đăng ký tài khoản";
	register = {
		form: new FormGroup({}, [AppFormsControl.confirmIsMatched("Email", "ConfirmEmail"), AppFormsControl.confirmIsMatched("Password", "ConfirmPassword")]),
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>(),
		value: undefined as any,
		button: {
			label: "Đăng ký tài khoản",
			icon: undefined,
			color: "primary",
			fill: "solid"
		}
	};
	private _loading = undefined;
	private _rxSubscriptions = new Array<Rx.Subscription>();

	public ngOnInit() {
		this._rxSubscriptions.push(this.register.form.valueChanges.subscribe(value => this.register.value = value));
		this.initialize();
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
		const message = AppUtility.isGotCaptchaException(error)
			? "Mã xác thực không đúng"
			: "InformationExistedException" === error.Type
				? `Địa chỉ email (${this.register.value.Email}) đã được sử dụng cho một tài khoản khác, có thể sử dụng chức năng quên mật khẩu để lấy mật khẩu mới cho địa chỉ email này.`
				: AppUtility.isNotEmpty(error.Message) ? error.Message : "Đã xảy ra lỗi!";
		await this.showAlertAsync(message, "Lỗi", subHeader, postProcess);
	}

	public initialize() {
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
				Validators: [AppFormsControl.isMatched("Email")],
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
				Validators: [AppFormsControl.isMatched("Password")],
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
					Label: "Họ Tên",
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
			/*
			{
				Key: "Refer",
				Type: "Completer",
				Options: {
					Type: "Account",
					Label: "Refer",
					MinLength: 3,
					CompleterOptions: {
						DataSource: new AppCustomCompleter(
							term => "users/profile/search?x-request=" + AppUtility.toBase64Url(AppPagination.buildRequest({ Query: term })) + "&" + this.configSvc.relatedQuery,
							data => (data.Objects as Array<any>).map(a => {
								return {
									title: a.Name,
									description: a.Email,
									image: a.Avatar,
									originalObject: Profile.deserialize(a)
								} as CompleterItem;
							})
						),
						Handlers: {
							Initialize: undefined,
							GetInitialValue: undefined,
							OnItemSelected: (control: AppFormsControl, formGroup: FormGroup, item: CompleterItem) => {
								console.log("Control", control);
								console.log("Form", formGroup);
								console.log("Item", item);
							}
						}
					}
				}
			},
			*/
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
		this.register.config.forEach(options => {
			if (excluded[options.Key]) {
				options.Excluded = true;
			}
		});

		this.configSvc.appTitle = this.title;
	}

	public async registerAsync() {
		if (this.register.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.register.form);
			return;
		}

		await this.showLoadingAsync();
		await this.userSvc.registerAsync(AppUtility.clone(this.register.value, ["ConfirmEmail", "ConfirmPassword", "Addresses", "Captcha"]), this.register.value.Captcha,
			async data => {
				await TrackingUtility.trackAsync("Register", "/register-account");
				await this.hideLoadingAsync();
				await this.showAlertAsync(`Vui lòng kiểm tra địa chỉ email (${this.register.value.Email}) để kích hoạt tài khoản trước khi đăng nhập`, "Đăng ký thành công", undefined, () => this.configSvc.goBack());
			},
			async error => {
				await Promise.all([
					this.refreshCaptchaAsync(),
					this.showErrorAsync(error)
				]);
			}
		);
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
			control.Extras["Uri"] = this.configSvc.appConfig.session.captcha.uri;
		});
	}

}
