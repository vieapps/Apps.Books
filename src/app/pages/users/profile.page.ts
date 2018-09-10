import * as Rx from "rxjs";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { AppUtility } from "../../components/app.utility";
import { AppCrypto } from "../../components/app.crypto";
import { AppEvents } from "../../components/app.events";
import { TrackingUtility } from "../../components/app.utility.trackings";
import { AppFormsControl, AppFormsService } from "../../components/forms.service";
import { ConfigurationService } from "../../providers/configuration.service";
import { AuthenticationService } from "../../providers/authentication.service";
import { UsersService } from "../../providers/users.service";
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
		public usersSvc: UsersService
	) {
	}

	title = "Profile";
	mode = "profile";
	id: string;
	profile: UserProfile;
	rxSubscriptions = new Array<Rx.Subscription>();
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
	labels = {
		header: "",
		lastAccess: ""
	};
	update = {
		form: new FormGroup({}),
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>(),
		value: undefined as any,
		hash: undefined as string,
		language: this.configSvc.appConfig.language
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
		providers: new Array<{ Type: string, Label: string, Time: Date, Info: string }>(),
		resources: {
			status: {
				label: "status",
				value: "off"
			},
			providers: "providers",
			buttons: {
				on: "Power on",
				delete: "Delete",
				verify: "Verify"
			},
			qrcode: {
				image: "QR code",
				control: "QR code"
			},
			instruction: {
				main: "Open authenticator app",
				app: "Google Authenticator/Microsoft Authenticator"
			}
		}
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

	ngOnInit() {
		this.rxSubscriptions.push(this.update.form.valueChanges.subscribe(value => this.update.value = value));
		this.rxSubscriptions.push(this.password.form.valueChanges.subscribe(value => this.password.value = value));
		this.rxSubscriptions.push(this.email.form.valueChanges.subscribe(value => this.email.value = value));
		this.rxSubscriptions.push(this.privileges.form.valueChanges.subscribe(value => this.privileges.value = value));
		this.rxSubscriptions.push(this.invitation.form.valueChanges.subscribe(value => this.invitation.value = value));
		this.openProfileAsync();
	}

	ngOnDestroy() {
		this.rxSubscriptions.forEach(subscription => subscription.unsubscribe());
	}

	onFormInitialized($event) {
		if (this.update.config === $event.config) {
			this.update.form.patchValue(this.profile);
			this.update.hash = AppCrypto.md5(JSON.stringify(this.update.value || {}));
		}
		else {
			Object.keys(($event.form as FormGroup).controls).forEach(key => ($event.form as FormGroup).controls[key].setValue(""));
		}
	}

	async setModeAsync(mode: string, title: string) {
		this.mode = mode;
		this.configSvc.appTitle = this.title = title;
		await Promise.all([
			this.prepareButtonsAsync(),
			this.prepareActionsAsync()
		]);
	}

	async prepareButtonsAsync() {
		this.buttons.cancel = { text: await this.configSvc.getResourceAsync("common.buttons.cancel"), icon: undefined, handler: async () => await this.openProfileAsync() };
		this.buttons.ok = { text: await this.configSvc.getResourceAsync("common.buttons.update"), icon: undefined, handler: undefined };

		if (this.mode === "update") {
			this.buttons.cancel.handler = async () => await this.appFormsSvc.showAlertAsync(
				await this.configSvc.getResourceAsync("users.profile.update.messages.alert"),
				undefined,
				await this.configSvc.getResourceAsync("users.profile.update.messages.confirm"),
				async () => await this.openProfileAsync(),
				await this.configSvc.getResourceAsync("common.buttons.ok"),
				await this.configSvc.getResourceAsync("common.buttons.cancel")
			);
			this.buttons.ok.handler = async () => await this.updateProfileAsync();
		}
		else if (this.mode === "password") {
			this.buttons.ok.text = await this.configSvc.getResourceAsync("users.profile.buttons.password");
			this.buttons.ok.handler = async () => await this.updatePasswordAsync();
		}
		else if (this.mode === "email") {
			this.buttons.ok.text = await this.configSvc.getResourceAsync("users.profile.buttons.email");
			this.buttons.ok.handler = async () => await this.updateEmailAsync();
		}
		else if (this.mode === "otp") {
			this.buttons.cancel = undefined;
			this.buttons.ok.text = await this.configSvc.getResourceAsync("common.buttons.done");
			this.buttons.ok.handler = async () => await this.openProfileAsync();
		}
		else if (this.mode === "privileges") {
			this.buttons.ok.handler = async () => await this.updatePrivilegesAsync();
		}
		else if (this.mode === "invitation") {
			this.buttons.ok.text = await this.configSvc.getResourceAsync("users.profile.buttons.invite");
			this.buttons.ok.handler = async () => await this.sendInvitationAsync();
		}
		else {
			this.buttons.cancel = undefined;
			this.buttons.ok = undefined;
		}

		this.buttons.invite = this.mode === "profile" && this.authSvc.canSendInvitations
			? { text: await this.configSvc.getResourceAsync("users.profile.buttons.invitation"), icon: "people", handler: async () => await this.openSendInvitationAsync() }
			: undefined;
	}

	async prepareActionsAsync() {
		if (this.mode !== "profile") {
			this.actions = undefined;
		}
		else {
			this.actions = [];

			if (this.profile.ID === this.configSvc.getAccount().id) {
				[
					this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("users.profile.actions.avatar"), "camera", async () => await this.appFormsSvc.showModalAsync(AccountAvatarPage)),
					this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("users.profile.actions.profile"), "create", async () => await this.openUpdateProfileAsync()),
					this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("users.profile.actions.password"), "key", async () => await this.openUpdatePasswordAsync()),
					this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("users.profile.actions.email"), "mail", async () => await this.openUpdateEmailAsync()),
					this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("users.profile.actions.otp"), "unlock", async () => await this.openUpdateOTPAsync())
				].forEach(action => this.actions.push(action));
			}

			else if (this.authSvc.canSetPrivileges) {
				this.actions.push(this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("users.profile.actions.privilegs"), "settings", async () => await this.openUpdatePrivilegesAsync()));
			}

			if (this.id === undefined || this.id === this.configSvc.getAccount().id) {
				this.actions.push(this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("users.profile.actions.logout"), "log-out", async () => await this.logoutAsync()));
			}

			if (this.actions.length < 1) {
				this.actions = undefined;
			}
		}
	}

	async showActionsAsync() {
		await this.appFormsSvc.showActionSheetAsync(this.actions);
	}

	async openProfileAsync(onNext?: () => void) {
		this.id = this.configSvc.requestParams["ID"];
		if (this.profile === undefined && this.id !== undefined && !UserProfile.instances.containsKey(this.id)) {
			await this.appFormsSvc.showLoadingAsync();
		}
		const id = this.id || this.configSvc.getAccount().id;
		await this.usersSvc.getProfileAsync(id,
			async () => {
				if (this.profile === undefined) {
					await TrackingUtility.trackAsync(await this.configSvc.getResourceAsync("users.profile.title"), "/users/profile");
				}
				this.profile = UserProfile.get(id);
				this.labels.header = await this.configSvc.getResourceAsync("users.profile.labels.header");
				this.labels.lastAccess = await this.configSvc.getResourceAsync("users.profile.labels.lastAccess");
				await this.setModeAsync("profile", await this.configSvc.getResourceAsync("users.profile.title"));
				await this.appFormsSvc.hideLoadingAsync(onNext);
			},
			async error => await this.appFormsSvc.showErrorAsync(error)
		);
	}

	async openUpdateProfileAsync() {
		this.update.config = [
			{
				Key: "Name",
				Required: true,
				Options: {
					Label: await this.configSvc.getResourceAsync("users.register.controls.Name.label"),
					Description: await this.configSvc.getResourceAsync("users.register.controls.Name.description"),
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
					Label: await this.configSvc.getResourceAsync("users.register.controls.Gender.label"),
					SelectOptions: {
						Values: [
							{
								Value: "NotProvided",
								Label: await this.configSvc.getResourceAsync("users.register.controls.Gender.options.NotProvided")
							},
							{
								Value: "Male",
								Label: await this.configSvc.getResourceAsync("users.register.controls.Gender.options.Male")
							},
							{
								Value: "Female",
								Label: await this.configSvc.getResourceAsync("users.register.controls.Gender.options.Female")
							}
						]
					},
				}
			},
			{
				Key: "BirthDay",
				Type: "DatePicker",
				Required: true,
				Options: {
					Type: "date",
					Label: await this.configSvc.getResourceAsync("users.register.controls.BirthDay"),
					Min: (new Date().getFullYear() - 100) + "-01-01",
					Max: (new Date().getFullYear() - 16) + "-12-31",
					DatePickerOptions: {
						AllowTimes: false
					}
				}
			},
			{
				Key: "Address",
				Options: {
					Label: await this.configSvc.getResourceAsync("users.register.controls.Address.label"),
					MinLength: 1,
					MaxLength: 250
				}
			},
			{
				Key: "Addresses",
				Type: "Completer",
				Options: {
					Type: "Address",
					PlaceHolder: await this.configSvc.getResourceAsync("users.register.controls.Address.placeholder"),
					MinLength: 2,
					CompleterOptions: {
						SearchingText: await this.configSvc.getResourceAsync("common.messages.completer.searching"),
						NoResultsText: await this.configSvc.getResourceAsync("common.messages.completer.noresults")
					}
				}
			},
			{
				Key: "Mobile",
				Required: true,
				Options: {
					Type: "tel",
					Label: await this.configSvc.getResourceAsync("users.register.controls.Mobile"),
					MinLength: 10,
					MaxLength: 15,
				}
			},
			{
				Key: "Email",
				Required: true,
				Options: {
					Type: "email",
					Label: await this.configSvc.getResourceAsync("users.register.controls.Email"),
					ReadOnly: true
				}
			},
			{
				Key: "Language",
				Type: "Select",
				Required: true,
				Options: {
					Label: await this.configSvc.getResourceAsync("users.register.controls.Language.label"),
					Description: await this.configSvc.getResourceAsync("users.register.controls.Language.description"),
					DescriptionOptions: {
						Css: "--description-label-css"
					},
					SelectOptions: {
						Values: this.configSvc.languages
					},
				}
			},
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
		this.update.language = this.profile.Language;
		await this.setModeAsync("update", await this.configSvc.getResourceAsync("users.profile.update.title"));
	}

	async updateProfileAsync() {
		if (this.update.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.update.form);
		}
		else if (this.update.hash === AppCrypto.md5(JSON.stringify(this.update.value || {}))) {
			await this.openProfileAsync();
		}
		else {
			await this.appFormsSvc.showLoadingAsync(this.title);
			await this.usersSvc.updateProfileAsync(
				this.update.value,
				async data => {
					if (this.profile.ID === this.configSvc.getAccount().id) {
						this.configSvc.getAccount().profile = UserProfile.get(this.profile.ID);
						await this.configSvc.storeSessionAsync();
						if (this.update.language !== this.update.value.Language) {
							this.configSvc.appConfig.options.i18n = this.update.value.Language;
							await Promise.all([
								this.configSvc.storeOptionsAsync(),
								this.configSvc.setResourceLanguageAsync(this.configSvc.appConfig.options.i18n)
							]);
							AppEvents.broadcast("App", { Type: "LanguageChanged", Data: this.configSvc.appConfig.options });
						}
					}
					await Promise.all([
						TrackingUtility.trackAsync(this.title, "users/update/profile"),
						this.openProfileAsync(async () => await this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("users.profile.update.messages.success")))
					]);
				},
				async error => await this.appFormsSvc.showErrorAsync(error)
			);
		}
	}

	async openUpdatePasswordAsync() {
		this.password.config = [
			{
				Key: "OldPassword",
				Required: true,
				Options: {
					Type: "password",
					Label: await this.configSvc.getResourceAsync("users.profile.password.controls.OldPassword"),
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
					Label: await this.configSvc.getResourceAsync("users.profile.password.controls.Password"),
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
					Label: await this.configSvc.getResourceAsync("users.profile.password.controls.ConfirmPassword"),
					MinLength: 1,
					MaxLength: 150
				}
			},
		];
		await this.setModeAsync("password", await this.configSvc.getResourceAsync("users.profile.password.title"));
	}

	async updatePasswordAsync() {
		if (this.password.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.password.form);
		}
		else {
			await this.appFormsSvc.showLoadingAsync(this.title);
			await this.usersSvc.updatePasswordAsync(
				this.password.value.OldPassword,
				this.password.value.Password,
				async () => await Promise.all([
					TrackingUtility.trackAsync(this.title, "users/update/password"),
					this.openProfileAsync(async () => await this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("users.profile.password.message")))
				]),
				async error => await this.appFormsSvc.showErrorAsync(error)
			);
		}
	}

	async openUpdateEmailAsync() {
		this.email.config = [
			{
				Key: "OldPassword",
				Required: true,
				Options: {
					Type: "password",
					Label: await this.configSvc.getResourceAsync("users.profile.password.controls.OldPassword"),
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
					Label: await this.configSvc.getResourceAsync("users.profile.email.controls.Email"),
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
					Label: await this.configSvc.getResourceAsync("users.profile.email.controls.ConfirmEmail"),
					MinLength: 1,
					MaxLength: 150
				}
			},
		];
		await this.setModeAsync("email", await this.configSvc.getResourceAsync("users.profile.email.title"));
	}

	async updateEmailAsync() {
		if (this.email.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.email.form);
		}
		else {
			await this.appFormsSvc.showLoadingAsync(this.title);
			await this.usersSvc.updateEmailAsync(
				this.email.value.OldPassword,
				this.email.value.Email,
				async () => await Promise.all([
					TrackingUtility.trackAsync(this.title, "users/update/email"),
					this.openProfileAsync(async () => this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("users.profile.email.message")))
				]),
				async error => await this.appFormsSvc.showErrorAsync(error)
			);
		}
	}

	async openUpdateOTPAsync(onNext?: () => void) {
		const account = this.configSvc.getAccount();
		this.otp.required = account.twoFactors.required;
		this.otp.providers = account.twoFactors.providers;
		this.otp.provisioning = "";
		this.otp.uri = "";
		this.otp.value = "";
		this.otp.resources = {
			status: {
				label: await this.configSvc.getResourceAsync("users.profile.otp.status.label"),
				value: this.otp.required
					? await this.configSvc.getResourceAsync("users.profile.otp.status.on")
					: this.otp.uri === ""
						? await this.configSvc.getResourceAsync("users.profile.otp.status.off")
						: await this.configSvc.getResourceAsync("users.profile.otp.status.provisioning")
			},
			providers: await this.configSvc.getResourceAsync("users.profile.otp.labels.providers"),
			buttons: {
				on: await this.configSvc.getResourceAsync("users.profile.otp.buttons.on"),
				delete: await this.configSvc.getResourceAsync("users.profile.otp.buttons.delete"),
				verify: await this.configSvc.getResourceAsync("users.profile.otp.buttons.verify")
			},
			qrcode: {
				image: await this.configSvc.getResourceAsync("users.profile.otp.labels.qrcode.image"),
				control: await this.configSvc.getResourceAsync("users.profile.otp.labels.qrcode.control")
			},
			instruction: {
				main: await this.configSvc.getResourceAsync("users.profile.otp.instruction.main"),
				app: await this.configSvc.getResourceAsync("users.profile.otp.instruction.app")
			}
		};
		await this.setModeAsync("otp", await this.configSvc.getResourceAsync("users.profile.otp.title"));
		if (onNext !== undefined) {
			onNext();
		}
	}

	async prepareOTPAsync() {
		this.appFormsSvc.showLoadingAsync(this.title);
		await this.usersSvc.prepare2FAMethodAsync(
			async data => {
				this.otp.provisioning = data.Provisioning;
				this.otp.uri = data.Uri;
				await this.appFormsSvc.hideLoadingAsync(() => this.otp.value = "");
			},
			async error => await this.appFormsSvc.showErrorAsync(error)
		);
	}

	async addOTPAsync() {
		this.appFormsSvc.showLoadingAsync(this.title);
		await this.usersSvc.add2FAMethodAsync(
			this.otp.provisioning,
			this.otp.value,
			() => this.openUpdateOTPAsync(async () => await Promise.all([
				TrackingUtility.trackAsync(this.title, "users/update/otp"),
				this.appFormsSvc.hideLoadingAsync()
			])),
			async error => await this.appFormsSvc.showErrorAsync(error, undefined, () => this.otp.value = "")
		);
	}

	async deleteOTPAsync(provider: { Type: string, Label: string, Time: Date, Info: string }) {
		await this.appFormsSvc.showAlertAsync(
			await this.configSvc.getResourceAsync("users.profile.otp.buttons.delete"),
			undefined,
			await this.configSvc.getResourceAsync("users.profile.otp.messages.confirm", { label: provider.Label }),
			async () => await this.usersSvc.delete2FAMethodAsync(
				provider.Info,
				() => this.openUpdateOTPAsync(async () => await Promise.all([
					TrackingUtility.trackAsync(this.title, "users/update/otp"),
					this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("users.profile.otp.messages.success", { label: provider.Label }))
				])),
				error => this.appFormsSvc.showErrorAsync(error)
			),
			await this.configSvc.getResourceAsync("common.buttons.yes"),
			await this.configSvc.getResourceAsync("common.buttons.no")
		);
	}

	async openUpdatePrivilegesAsync() {
		await this.setModeAsync("privileges", await this.configSvc.getResourceAsync("users.profile.privileges.title"));
	}

	async updatePrivilegesAsync() {
	}

	async openSendInvitationAsync() {
		this.invitation.config = [
			{
				Key: "Name",
				Required: true,
				Options: {
					Label: await this.configSvc.getResourceAsync("users.register.controls.Name.label"),
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
					Label: await this.configSvc.getResourceAsync("users.register.controls.Email"),
					MinLength: 1,
					MaxLength: 150
				}
			}
		];
		await this.setModeAsync("invitation", await this.configSvc.getResourceAsync("users.profile.invitation.title"));
	}

	async sendInvitationAsync() {
		if (this.invitation.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.invitation.form);
		}
		else {
			await this.appFormsSvc.showLoadingAsync(this.title);
			const privileges: Array<Privilege> = undefined;
			const relatedInfo: any = undefined;
			await this.usersSvc.sendInvitationAsync(
				this.invitation.value.Name,
				this.invitation.value.Email,
				privileges,
				relatedInfo,
				async () => await Promise.all([
					TrackingUtility.trackAsync(this.title, "users/invitation"),
					this.openProfileAsync(async () => await this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("users.profile.invitation.message")))
				]),
				async error => await this.appFormsSvc.showErrorAsync(error)
			);
		}
	}

	async logoutAsync() {
		await this.appFormsSvc.showAlertAsync(
			await this.configSvc.getResourceAsync("users.profile.buttons.logout"),
			undefined,
			await this.configSvc.getResourceAsync("users.profile.logout.confirm"),
			async () => await this.authSvc.logOutAsync(
				async () => {
					await Promise.all([
						TrackingUtility.trackAsync(await this.configSvc.getResourceAsync("users.profile.buttons.logout"), "session/log-out"),
						this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("users.profile.logout.success"))
					]);
					if (this.configSvc.previousUrl.startsWith("/users")) {
						this.configSvc.navigateHome();
					}
					else {
						this.configSvc.navigateBack();
					}
				},
				error => this.appFormsSvc.showErrorAsync(error)
			),
			await this.configSvc.getResourceAsync("users.profile.buttons.logout"),
			await this.configSvc.getResourceAsync("common.buttons.cancel")
		);
	}

}
