import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { FormGroup } from "@angular/forms";
import * as Rx from "rxjs";
import { map } from "rxjs/operators";
import { ImageCropperComponent, CropperSettings } from "ng2-img-cropper";
import { AppFormsService, AppFormsControl } from "../../components/forms.service";
import { AppEvents } from "../../components/app.events";
import { AppAPI } from "../../components/app.api";
import { AppUtility } from "../../components/app.utility";
import { TrackingUtility } from "../../components/app.utility.trackings";
import { PlatformUtility } from "../../components/app.utility.platform";
import { ConfigurationService } from "../../providers/configuration.service";
import { AuthenticationService } from "../../providers/authentication.service";
import { UserService } from "../../providers/user.service";
import { UserProfile } from "../../models/user";

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
	id: string;
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
		avatar: {
			mode: "Avatar",
			current: "",
			uploaded: ""
		},
		cropper: {
			settings: new CropperSettings(),
			data: {
				image: "",
				original: undefined
			}
		}
	};
	password = {
		form: new FormGroup({}),
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>(),
		value: undefined as any
	};
	email = {
		form: new FormGroup({}),
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>(),
		value: undefined as any
	};
	privileges = {
		form: new FormGroup({}),
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>(),
		value: undefined as any
	};
	invitation = {
		form: new FormGroup({}),
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>(),
		value: undefined as any
	};
	@ViewChild("avatarcropper") cropperCtrl: ImageCropperComponent;
	private _rxSubscriptions = new Array<Rx.Subscription>();
	private _rxSubject = new Rx.Subject<{ mode: string, title: string }>();

	public ngOnInit() {
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
					this.profile = UserProfile.instances.getValue(id) as UserProfile;
				}
			}
		}, "UserProfilePage");

		this.update.cropper.settings.width = 100;
		this.update.cropper.settings.height = 100;
		this.update.cropper.settings.croppedWidth = 300;
		this.update.cropper.settings.croppedHeight = 300;
		this.update.cropper.settings.canvasWidth = 272;
		this.update.cropper.settings.canvasHeight = 272;
		this.update.cropper.settings.noFileInput = true;

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
			this.buttons.ok.text = "Xong";
			this.buttons.ok.handler = async () => await this.updateOTPAsync();
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
			? { text: "Mời bạn bè", icon: "people", handler: () => this.openInvitation() }
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
					this.appFormsSvc.getActionSheetButton("Cập nhật", "create", () => this.updateProfile()),
					this.appFormsSvc.getActionSheetButton("Đổi mật khẩu", "key", () => this.updatePassword()),
					this.appFormsSvc.getActionSheetButton("Đổi email đăng nhập", "mail", () => this.updateEmail()),
					this.appFormsSvc.getActionSheetButton("Thiết đặt bảo mật", "unlock", () => this.updateOTP())
				].forEach(action => this.actions.push(action));
			}

			if (this.profile.ID !== this.configSvc.appConfig.session.account.id && this.authSvc.canSetPrivilegs) {
				this.actions.push(this.appFormsSvc.getActionSheetButton("Đặt quyền truy cập", "settings", () => this.updatePrivileges()));
			}

			if (this.id === undefined || this.id === this.configSvc.appConfig.session.account.id) {
				this.actions.push(this.appFormsSvc.getActionSheetButton("Đăng xuất", "log-out", async () => await this.logoutAsync()));
			}

			if (this.actions.length < 1) {
				this.actions = undefined;
			}
			else {
				this.actions.push(this.appFormsSvc.getActionSheetButton("Huỷ", "close", () => this.appFormsSvc.hideActionSheetAsync(), "cancel"));
			}
		}
	}

	public async showActionsAsync() {
		await this.appFormsSvc.showActionSheetAsync(this.actions, true);
	}

	private async openProfileAsync() {
		this.id = this.configSvc.requestParams["ID"];
		if (this.profile === undefined && this.id !== undefined && !UserProfile.instances.containsKey(this.id)) {
			await this.appFormsSvc.showLoadingAsync(this.title);
		}
		await this.userSvc.getProfileAsync(this.id || this.configSvc.getAccount().id,
			async data => {
				if (this.profile === undefined) {
					await TrackingUtility.trackAsync(this.title, "/user/profile");
				}
				this.profile = UserProfile.instances.getValue(this.id || this.configSvc.getAccount().id) as UserProfile;
				this.setMode("profile", "Thông tin tài khoản");
				await this.appFormsSvc.hideLoadingAsync();
			},
			async error => await this.appFormsSvc.showErrorAsync(error)
		);
	}

	private updateProfile() {
		this.setMode("update", "Cập nhật thông tin tài khoản");
		this.update.config = [
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
				Key: "Email",
				Type: "TextBox",
				Required: true,
				Options: {
					Type: "email",
					Label: "Email",
					ReadOnly: true
				}
			},
			{
				Key: "ID",
				Excluded: true
			},
			{
				Key: "Avatar",
				Excluded: true
			}
		];

		const required = AppUtility.toSet(this.configSvc.appConfig.accountRegistrations.required);
		this.update.config.forEach(options => {
			if (required[options.Key] && !options.Excluded) {
				options.Required = true;
			}
		});
	}

	public onUpdateFormRendered($event) {
		this.update.form.patchValue(this.profile);
		this.update.cropper.data.image = this.update.avatar.current = this.profile.Avatar;
		this.update.avatar.mode = this.update.avatar.current === this.profile.Gravatar
			? "Gravatar"
			: "Avatar";
	}

	public prepareAvatarImage($event) {
		const image = new Image();
		const fileReader = new FileReader();
		fileReader.onloadend = (loadEvent: any) => {
			image.src = loadEvent.target.result;
			this.cropperCtrl.setImage(image);
		};
		fileReader.readAsDataURL($event.target.files[0]);
	}

	private uploadAvatarImage(onCompleted?: () => void) {
		if (this.update.avatar.mode === "Avatar" && this.update.cropper.data.image !== "" && this.update.cropper.data.image !== this.update.avatar.current) {
			this._rxSubscriptions.push(AppAPI.send("POST", this.configSvc.appConfig.URIs.files + "avatars", { "x-as-base64": "yes" }, JSON.stringify({ Data: this.update.cropper.data.image }))
				.pipe(map(response => response.json()))
				.subscribe(
					data => {
						this.update.avatar.uploaded = data.Uri;
						this.update.cropper.data = {
							image: data.Uri,
							original: undefined
						};
						if (onCompleted !== undefined) {
							onCompleted();
						}
					},
					error => {
						PlatformUtility.showError("Error occurred while uploading avatar image", error);
						if (onCompleted !== undefined) {
							onCompleted();
						}
					}
				)
			);
		}
		else {
			this.update.avatar.uploaded = "";
			if (onCompleted !== undefined) {
				onCompleted();
			}
		}
	}

	private async updateProfileAsync() {
		if (this.update.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.update.form);
			return;
		}

		await this.appFormsSvc.showLoadingAsync(this.title);
		this.uploadAvatarImage(async () => {
			this.update.value.Avatar = this.update.avatar.mode === "Avatar"
				? this.update.avatar.uploaded !== ""
					? this.update.avatar.uploaded
					: this.profile.Avatar
				: "";
			await this.userSvc.updateProfileAsync(this.update.value,
				async data => {
					this.configSvc.appConfig.session.account.profile = UserProfile.instances.getValue(this.profile.ID) as UserProfile;
					await this.configSvc.storeSessionAsync(async () => {
						await TrackingUtility.trackAsync(this.title, "account/update");
						await this.appFormsSvc.hideLoadingAsync();
						await this.openProfileAsync();
					});
				},
				async error => await this.appFormsSvc.showErrorAsync(error)
			);
		});
	}

	private updatePassword() {
		this.setMode("password", "Đổi mật khẩu");
	}

	private async updatePasswordAsync() {
	}

	private updateEmail() {
		this.setMode("email", "Đổi email đăng nhập");
	}

	private async updateEmailAsync() {
	}

	private updateOTP() {
		this.setMode("otp", "Thiết lập xác thực lần hai");
	}

	private async updateOTPAsync() {
	}

	private updatePrivileges() {
		this.setMode("privileges", "Đặt quyền truy cập");
	}

	private async updatePrivilegesAsync() {
	}

	private openInvitation() {
		this.setMode("invitation", "Mời bạn bè");
	}

	private async sendInvitationAsync() {
	}

	private async logoutAsync() {
		await this.appFormsSvc.showAlertAsync(
			"Đăng xuất",
			undefined,
			"Đăng xuất khỏi hệ thống?",
			async () => await this.authSvc.logOutAsync(
				async data => {
					await TrackingUtility.trackAsync("Đăng xuất", "session/log-out");
					if (AppUtility.pos(this.configSvc.previousUrl, "/log-in") > -1 || AppUtility.pos(this.configSvc.previousUrl, "/account-profile") > -1) {
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
