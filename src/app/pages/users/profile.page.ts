import * as Rx from "rxjs";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { AppEvents } from "../../components/app.events";
import { AppUtility } from "../../components/app.utility";
import { AppCrypto } from "../../components/app.crypto";
import { TrackingUtility } from "../../components/app.utility.trackings";
import { AppFormsControl, AppFormsService } from "../../components/forms.service";
import { ConfigurationService } from "../../providers/configuration.service";
import { AuthenticationService } from "../../providers/authentication.service";
import { UserService } from "../../providers/user.service";
import { UserProfile } from "../../models/user";
import { Privilege } from "./../../models/privileges";
import { AccountAvatarPage } from "./avatar.page";

@Component({
	selector: "page-account-profile",
	templateUrl: "./profile.page.html",
	styleUrls: ["./profile.page.scss"]
})
export class AccountProfilePage implements OnInit, OnDestroy {

	constructor (
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public authSvc: AuthenticationService,
		public userSvc: UserService
	) {
	}

	title = "Thông tin tài khoản";
	mode = "profile";
	profile: UserProfile;
	buttons: {
		ok: {
			text: string,
			icon: string,
			handler: () => void
		},
		cancel: {
			text: string,
			icon: string,
			handler: () => void
		},
		invite: {
			text: string,
			icon: string,
			handler: () => void
		}
	} = {
		ok: undefined,
		cancel: undefined,
		invite: undefined
	};
	actions: Array<{
		text: string,
		role: string,
		icon: string,
		handler: () => void
	}>;
	update = {
		form: new FormGroup({}),
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>(),
		value: undefined as any,
		hash: undefined as string
	};
	password = {
		form: new FormGroup({}, [this.appFormsSvc.areEquals("Password", "ConfirmPassword")]),
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>(),
		value: undefined as any
	};
	email = {
		form: new FormGroup({}, [this.appFormsSvc.areEquals("Email", "ConfirmEmail")]),
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>(),
		value: undefined as any
	};
	otp = {
		required: false,
		uri: "",
		value: "",
		provisioning: "",
		providers: new Array<{ Type: string, Label: string, Time: Date, Info: string }>()
	};
	privileges = {
		form: new FormGroup({}),
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>(),
		value: undefined as any,
		hash: undefined as string
	};
	invitation = {
		form: new FormGroup({}),
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>(),
		value: undefined as any
	};
	private _id: string;
	private _rxSubscriptions = new Array<Rx.Subscription>();
	private _rxSubject = new Rx.Subject<{ mode: string, title: string }>();

	public ngOnInit() {
		if (!this.configSvc.isAuthenticated) {
			this.appFormsSvc.showToastAsync("Hmmmmm...");
			this.configSvc.goHome();
			return;
		}

		this._rxSubscriptions.push(this.update.form.valueChanges.subscribe(value => this.update.value = value));
		this._rxSubscriptions.push(this.password.form.valueChanges.subscribe(value => this.password.value = value));
		this._rxSubscriptions.push(this.email.form.valueChanges.subscribe(value => this.email.value = value));
		this._rxSubscriptions.push(this.privileges.form.valueChanges.subscribe(value => this.privileges.value = value));
		this._rxSubscriptions.push(this.invitation.form.valueChanges.subscribe(value => this.invitation.value = value));
		this._rxSubscriptions.push(this._rxSubject.subscribe(({ mode, title }) => {
			this.mode = mode;
			this.title = title;
			this.configSvc.appTitle = this.title;
			this.prepareButtons();
			this.prepareActions();
		}));

		AppEvents.on("Session", async info => {
			if (this.mode === "profile" && "Updated" === info.args.Type) {
				const id = this.configSvc.getAccount().id;
				if (this.profile.ID === id) {
					this.profile = UserProfile.get(id);
				}
			}
		}, "UserProfilePage");

		this.openProfileAsync();
	}

	public ngOnDestroy() {
		this._rxSubscriptions.forEach(subscription => subscription.unsubscribe());
		AppEvents.off("Session", "UserProfilePage");
	}

	private setMode(mode: string = "profile", title: string = "Thông tin tài khoản") {
		this._rxSubject.next({ mode: mode, title: title});
	}

	private prepareButtons() {
		this.buttons.cancel = { text: "Huỷ", icon: undefined, handler: async () => await this.openProfileAsync() };
		this.buttons.ok = { text: "Cập nhật", icon: undefined, handler: undefined };

		if (this.mode === "update") {
			this.buttons.cancel.handler = async () => await this.appFormsSvc.showAlertAsync(
				"Huỷ cập nhật",
				undefined,
				"Chắc chắn muốn huỷ bỏ quá trình cập nhật?",
				async () => await this.openProfileAsync(),
				"Đồng ý",
				"Không"
			);
			this.buttons.ok.handler = async () => await this.updateProfileAsync();
		}
		else if (this.mode === "password") {
			this.buttons.ok.text = "Đổi mật khẩu";
			this.buttons.ok.handler = async () => await this.updatePasswordAsync();
		}
		else if (this.mode === "email") {
			this.buttons.ok.text = "Đổi email";
			this.buttons.ok.handler = async () => await this.updateEmailAsync();
		}
		else if (this.mode === "otp") {
			this.buttons.cancel = undefined;
			this.buttons.ok.text = "Hoàn thành";
			this.buttons.ok.handler = async () => await this.openProfileAsync();
		}
		else if (this.mode === "privileges") {
			this.buttons.ok.handler = async () => await this.updatePrivilegesAsync();
		}
		else if (this.mode === "invitation") {
			this.buttons.ok.text = "Gửi lời mời";
			this.buttons.ok.handler = async () => await this.sendInvitationAsync();
		}
		else {
			this.buttons.cancel = undefined;
			this.buttons.ok = undefined;
		}

		this.buttons.invite = this.mode === "profile" && this.authSvc.canSendInvitations
			? { text: "Mời tham gia", icon: "people", handler: () => this.sendInvitation() }
			: undefined;
	}

	private prepareActions() {
		if (this.mode !== "profile") {
			this.actions = undefined;
		}
		else {
			this.actions = [];

			if (this.profile.ID === this.configSvc.appConfig.session.account.id) {
				[
					this.appFormsSvc.getActionSheetButton("Cập nhật ảnh đại diện", "camera", async () => await this.appFormsSvc.showModalAsync(AccountAvatarPage)),
					this.appFormsSvc.getActionSheetButton("Cập nhật hồ sơ", "create", () => this.updateProfile()),
					this.appFormsSvc.getActionSheetButton("Đổi mật khẩu", "key", () => this.updatePassword()),
					this.appFormsSvc.getActionSheetButton("Đổi email đăng nhập", "mail", () => this.updateEmail()),
					this.appFormsSvc.getActionSheetButton("Thiết đặt bảo mật", "unlock", () => this.updateOTP())
				].forEach(action => this.actions.push(action));
			}

			if (this.profile.ID !== this.configSvc.appConfig.session.account.id && this.authSvc.canSetPrivilegs) {
				this.actions.push(this.appFormsSvc.getActionSheetButton("Đặt quyền truy cập", "settings", () => this.updatePrivileges()));
			}

			if (this._id === undefined || this._id === this.configSvc.appConfig.session.account.id) {
				this.actions.push(this.appFormsSvc.getActionSheetButton("Đăng xuất", "log-out", async () => await this.logoutAsync()));
			}

			if (this.actions.length < 1) {
				this.actions = undefined;
			}
			else {
				this.actions.push(this.appFormsSvc.getActionSheetButton("Huỷ", "close", async () => await this.appFormsSvc.hideActionSheetAsync(), "cancel"));
			}
		}
	}

	public async showActionsAsync() {
		await this.appFormsSvc.showActionSheetAsync(this.actions, true);
	}

	public onFormInitialized($event) {
		if (this.update.config === $event.config) {
			this.update.form.patchValue(this.profile);
			this.update.hash = AppCrypto.md5(JSON.stringify(this.update.value || {}));
		}
		else {
			Object.keys($event.form.controls).forEach(key => $event.form.controls[key].setValue(""));
		}
	}

	private async openProfileAsync(onNext?: () => void) {
		this._id = this.configSvc.requestParams["ID"];
		if (this.profile === undefined && this._id !== undefined && !UserProfile.instances.containsKey(this._id)) {
			await this.appFormsSvc.showLoadingAsync(this.title);
		}
		const id = this._id || this.configSvc.getAccount().id;
		await this.userSvc.getProfileAsync(id,
			async () => {
				if (this.profile === undefined) {
					await TrackingUtility.trackAsync(this.title, "/user/profile");
				}
				this.profile = UserProfile.get(id);
				this.setMode("profile", "Thông tin tài khoản");
				await this.appFormsSvc.hideLoadingAsync(onNext);
			},
			async error => await this.appFormsSvc.showErrorAsync(error)
		);
	}

	private updateProfile() {
		this.update.config = [
			{
				Key: "Name",
				Required: true,
				Options: {
					Label: "Tên",
					Description: "Sử dụng để hiển thị trong hệ thống",
					DescriptionOptions: {
						Css: "--description-label-css"
					},
					MinLength: 1,
					MaxLength: 250,
					AutoFocus: true
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
				Options: {
					Label: "Địa chỉ",
					MinLength: 1,
					MaxLength: 250,
				}
			},
			{
				Key: "Addresses",
				Type: "Completer",
				Options: {
					Type: "Address",
					PlaceHolder: "Quận/Huyện, Thành phố/Tỉnh",
					MinLength: 2
				}
			},
			{
				Key: "Mobile",
				Required: true,
				Options: {
					Type: "tel",
					Label: "Mobile",
					MinLength: 10,
					MaxLength: 15,
				}
			},
			{
				Key: "Email",
				Required: true,
				Options: {
					Type: "email",
					Label: "Email",
					ReadOnly: true
				}
			},
			/**
			{
				Key: "Refer",
				Type: "Completer",
				Options: {
					Type: "Account",
					Label: "Refer",
					MinLength: 3,
					CompleterOptions: {
						DataSource: this.userSvc.completerDataSource,
						Handlers: {
							OnItemSelected: (formControl, selectedItem) => {
								console.log("Control", formControl);
								console.log("Item", selectedItem);
							}
						}
					}
				}
			},
			/**/
			{
				Key: "ID",
				Excluded: true
			}
		];
		const required = AppUtility.toSet(this.configSvc.appConfig.accountRegistrations.required);
		this.update.config.forEach(options => {
			if (required[options.Key] && !options.Excluded) {
				options.Required = true;
			}
		});
		this.setMode("update", "Cập nhật hồ sơ");
	}

	private async updateProfileAsync() {
		if (this.update.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.update.form);
		}
		else if (this.update.hash === AppCrypto.md5(JSON.stringify(this.update.value || {}))) {
			await this.openProfileAsync();
		}
		else {
			await this.appFormsSvc.showLoadingAsync(this.title);
			await this.userSvc.updateProfileAsync(this.update.value,
				async data => {
					if (this.profile.ID === data.ID) {
						this.configSvc.appConfig.session.account.profile = UserProfile.get(this.profile.ID);
						await this.configSvc.storeSessionAsync();
					}
					await TrackingUtility.trackAsync(this.title, "account/update");
					await this.openProfileAsync();
				},
				async error => await this.appFormsSvc.showErrorAsync(error)
			);
		}
	}

	private updatePassword() {
		this.password.config = [
			{
				Key: "OldPassword",
				Required: true,
				Options: {
					Type: "password",
					Label: "Mật khẩu hiện tại",
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
					Label: "Mật khẩu mới",
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
					Label: "Nhập lại mật khẩu mới",
					MinLength: 1,
					MaxLength: 150
				}
			},
		];
		this.setMode("password", "Đổi mật khẩu đăng nhập");
	}

	private async updatePasswordAsync() {
		if (this.password.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.password.form);
		}
		else {
			await this.appFormsSvc.showLoadingAsync(this.title);
			await this.userSvc.updatePasswordAsync(this.password.value.OldPassword, this.password.value.Password,
				async () => {
					await TrackingUtility.trackAsync(this.title, "account/password");
					await this.openProfileAsync(async () => this.appFormsSvc.showToastAsync("Mật khẩu đăng nhập đã được thay đổi thành công..."));
				},
				async error => await this.appFormsSvc.showErrorAsync(error)
			);
		}
	}

	private updateEmail() {
		this.email.config = [
			{
				Key: "OldPassword",
				Required: true,
				Options: {
					Type: "password",
					Label: "Mật khẩu hiện tại",
					MinLength: 1,
					MaxLength: 150,
					AutoFocus: true
				}
			},
			{
				Key: "Email",
				Required: true,
				Options: {
					Type: "email",
					Label: "Email đăng nhập mới",
					MinLength: 1,
					MaxLength: 150
				}
			},
			{
				Key: "ConfirmEmail",
				Required: true,
				Validators: [this.appFormsSvc.isEquals("Email")],
				Options: {
					Type: "email",
					Label: "Nhập lại email đăng nhập mới",
					MinLength: 1,
					MaxLength: 150
				}
			},
		];
		this.setMode("email", "Đổi email đăng nhập");
	}

	private async updateEmailAsync() {
		if (this.email.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.email.form);
		}
		else {
			await this.appFormsSvc.showLoadingAsync(this.title);
			await this.userSvc.updateEmailAsync(this.email.value.OldPassword, this.email.value.Email,
				async () => {
					await TrackingUtility.trackAsync(this.title, "account/email");
					await this.openProfileAsync(async () => this.appFormsSvc.showToastAsync("Email đăng nhập đã được thay đổi thành công..."));
				},
				async error => await this.appFormsSvc.showErrorAsync(error)
			);
		}
	}

	private updateOTP() {
		const account = this.configSvc.getAccount();
		this.otp.required = account.twoFactors.required;
		this.otp.providers = account.twoFactors.providers;
		this.otp.provisioning = "";
		this.otp.uri = "";
		this.otp.value = "";
		this.setMode("otp", "Thiết lập xác thực lần hai");
	}

	public async prepareOTPAsync() {
		this.appFormsSvc.showLoadingAsync(this.title);
		await this.userSvc.prepare2FAMethodAsync(
			async data => {
				this.otp.provisioning = data.Provisioning;
				this.otp.uri = data.Uri;
				await this.appFormsSvc.hideLoadingAsync();
			},
			async error => await this.appFormsSvc.showErrorAsync(error)
		);
	}

	public async addOTPAsync() {
		this.appFormsSvc.showLoadingAsync(this.title);
		await this.userSvc.add2FAMethodAsync(this.otp.provisioning, this.otp.value,
			async () => {
				this.updateOTP();
				await this.appFormsSvc.hideLoadingAsync();
			},
			async error => await this.appFormsSvc.showErrorAsync(error, undefined, () => this.otp.value = "")
		);
	}

	public async deleteOTPAsync(provider: { Type: string, Label: string, Time: Date, Info: string }) {
		await this.appFormsSvc.showAlertAsync(
			"Xoá",
			undefined,
			`Chắc chắn muốn xoá bỏ phương thức xác thực lần hai [${provider.Label}] này?`,
			async () => await this.userSvc.delete2FAMethodAsync(provider.Info,
				async () => {
					await TrackingUtility.trackAsync(this.title, "session/otp");
					this.updateOTP();
				},
				error => this.appFormsSvc.showErrorAsync(error)
			),
			"Đồng ý xoá",
			"Không"
		);
	}

	private updatePrivileges() {
		this.setMode("privileges", "Đặt quyền truy cập");
	}

	private async updatePrivilegesAsync() {
	}

	private sendInvitation() {
		this.invitation.config = [
			{
				Key: "Name",
				Required: true,
				Options: {
					Label: "Tên",
					MinLength: 1,
					MaxLength: 150,
					AutoFocus: true
				}
			},
			{
				Key: "Email",
				Required: true,
				Options: {
					Type: "email",
					Label: "Email",
					MinLength: 1,
					MaxLength: 150
				}
			}
		];
		this.setMode("invitation", "Gửi lời mời tham gia hệ thống");
	}

	private async sendInvitationAsync() {
		if (this.invitation.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.invitation.form);
		}
		else {
			await this.appFormsSvc.showLoadingAsync(this.title);
			const privileges: Array<Privilege> = undefined;
			const relatedInfo: any = undefined;
			await this.userSvc.sendInvitationAsync(this.invitation.value.Name, this.invitation.value.Email, privileges, relatedInfo,
				async () => {
					await TrackingUtility.trackAsync(this.title, "account/invitation");
					await this.openProfileAsync(async () => this.appFormsSvc.showToastAsync("Lời mời tham gia hệ thống đã được gửi..."));
				},
				async error => await this.appFormsSvc.showErrorAsync(error)
			);
		}
	}

	private async logoutAsync() {
		await this.appFormsSvc.showAlertAsync(
			"Đăng xuất",
			undefined,
			"Đăng xuất khỏi hệ thống?",
			async () => await this.authSvc.logOutAsync(
				async () => {
					await TrackingUtility.trackAsync("Đăng xuất", "session/log-out");
					if (this.configSvc.previousUrl.startsWith("/log-in") || this.configSvc.previousUrl.startsWith("/account-profile")) {
						this.configSvc.goHome();
					}
					else {
						this.configSvc.goBack();
					}
				},
				error => this.appFormsSvc.showErrorAsync(error)
			),
			"Đăng xuất",
			"Huỷ bỏ"
		);
	}

}
