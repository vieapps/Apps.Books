import { Component, OnInit, NgZone } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { AppCrypto } from "../../../components/app.crypto";
import { AppEvents } from "../../../components/app.events";
import { AppFormsControl, AppFormsService } from "../../../components/forms.service";
import { TrackingUtility } from "../../../components/app.utility.trackings";
import { ConfigurationService } from "../../../services/configuration.service";
import { AuthenticationService } from "../../../services/authentication.service";
import { UsersService } from "../../../services/users.service";
import { UserProfile } from "../../../models/user";
import { Account } from "../../../models/account";
import { Privilege } from "../../../models/privileges";

@Component({
	selector: "page-users-update",
	templateUrl: "./update.page.html",
	styleUrls: ["./update.page.scss"]
})

export class UsersUpdatePage implements OnInit {

	constructor (
		public zone: NgZone,
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public authSvc: AuthenticationService,
		public usersSvc: UsersService
	) {
	}

	title = "Update profile";
	mode = "";
	id: string;
	profile: UserProfile;
	buttons = {
		ok: undefined as {
			text: string,
			icon: string,
			handler: () => void
		},
		cancel: undefined as {
			text: string,
			icon: string,
			handler: () => void
		}
	};
	update = {
		form: new FormGroup({}),
		controls: new Array<AppFormsControl>(),
		config: undefined as Array<any>,
		hash: undefined as string,
		language: this.configSvc.appConfig.language
	};
	password = {
		form: new FormGroup({}, [this.appFormsSvc.areEquals("Password", "ConfirmPassword")]),
		controls: new Array<AppFormsControl>(),
		config: undefined as Array<any>
	};
	email = {
		form: new FormGroup({}, [this.appFormsSvc.areEquals("Email", "ConfirmEmail")]),
		controls: new Array<AppFormsControl>(),
		config: undefined as Array<any>
	};

	services: Array<string>;
	private _privileges = {
		privileges: {} as { [key: string]: Array<Privilege> },
		hash: ""
	};

	ngOnInit() {
		this.initializeAsync();
	}

	onFormInitialized($event: any) {
		if (this.update.config === $event.config) {
			this.update.form.patchValue(this.profile);
			this.update.hash = AppCrypto.hash(this.update.form.value);
		}
		else {
			const controls = ($event.form as FormGroup).controls;
			Object.keys(controls).forEach(name => controls[name].setValue(""));
		}
	}

	async prepareButtonsAsync() {
		this.buttons.cancel = { text: await this.configSvc.getResourceAsync("common.buttons.cancel"), icon: undefined, handler: async () => await this.showProfileAsync() };
		this.buttons.ok = { text: await this.configSvc.getResourceAsync("common.buttons.update"), icon: undefined, handler: undefined };

		if (this.mode === "profile") {
			this.buttons.cancel.handler = async () => await this.appFormsSvc.showAlertAsync(
				await this.configSvc.getResourceAsync("users.profile.update.messages.alert"),
				undefined,
				await this.configSvc.getResourceAsync("users.profile.update.messages.confirm"),
				async () => await this.showProfileAsync(),
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
		else if (this.mode === "privileges") {
			this.buttons.ok.handler = async () => await this.updatePrivilegesAsync();
		}
		else {
			this.buttons.cancel = undefined;
			this.buttons.ok = undefined;
		}
	}

	initializeAsync() {
		const id = this.configSvc.requestParams["ID"] || this.configSvc.getAccount().id;
		return this.usersSvc.getProfileAsync(
			id,
			async () => {
				this.profile = UserProfile.get(id);
				if (this.profile === undefined || (this.profile.ID !== this.configSvc.getAccount().id && !this.authSvc.isSystemAdministrator())) {
					await Promise.all([
						this.appFormsSvc.showToastAsync("Hmmm..."),
						await this.configSvc.navigateHomeAsync()
					]);
				}
				else {
					this.mode = this.configSvc.requestParams["Mode"] || "profile";
					switch (this.mode) {
						case "password":
							await this.openUpdatePasswordAsync();
							break;
						case "email":
							await this.openUpdateEmailAsync();
							break;
						case "privileges":
							await this.openUpdatePrivilegesAsync();
							break;
						default:
							await this.openUpdateProfileAsync();
							break;
					}
				}
			},
			async error => await this.appFormsSvc.showErrorAsync(error)
		);
	}

	async openUpdateProfileAsync() {
		const config = [
			{
				Name: "ID",
				Hidden: true
			},
			{
				Name: "Name",
				Required: true,
				Options: {
					Label: await this.configSvc.getResourceAsync("users.register.controls.Name.label"),
					Description: await this.configSvc.getResourceAsync("users.register.controls.Name.description"),
					MinLength: 1,
					MaxLength: 250,
					AutoFocus: true
				}
			},
			{
				Name: "Gender",
				Type: "Select",
				Options: {
					Label: await this.configSvc.getResourceAsync("users.register.controls.Gender.label"),
					SelectOptions: {
						Values: ["NotProvided", "Male", "Female"].map(gender => {
							return {
								Value: gender,
								Label: `{{users.register.controls.Gender.options.${gender}}}`
							};
						})
					}
				}
			},
			{
				Name: "BirthDay",
				Type: "DatePicker",
				Options: {
					Type: "date",
					Label: await this.configSvc.getResourceAsync("users.register.controls.BirthDay"),
					MinValue: (new Date().getFullYear() - 100) + "-01-01",
					MaxValue: (new Date().getFullYear() - 16) + "-12-31",
					DatePickerOptions: {
						AllowTimes: false
					}
				}
			},
			{
				Name: "Address",
				Options: {
					Label: await this.configSvc.getResourceAsync("users.register.controls.Address.label"),
					MinLength: 1,
					MaxLength: 250
				}
			},
			{
				Name: "Addresses",
				Type: "Lookup",
				Options: {
					Type: "Address",
					PlaceHolder: await this.configSvc.getResourceAsync("users.register.controls.Address.placeholder"),
					MinLength: 2
				}
			},
			{
				Name: "Mobile",
				Options: {
					Type: "tel",
					Label: await this.configSvc.getResourceAsync("users.register.controls.Mobile"),
					MinLength: 10,
					MaxLength: 15,
				}
			},
			{
				Name: "Email",
				Required: true,
				Options: {
					Type: "email",
					Label: await this.configSvc.getResourceAsync("users.register.controls.Email"),
					ReadOnly: true
				}
			},
			{
				Name: "Language",
				Type: "Select",
				Required: true,
				Options: {
					Label: await this.configSvc.getResourceAsync("users.register.controls.Language.label"),
					Description: await this.configSvc.getResourceAsync("users.register.controls.Language.description"),
					SelectOptions: {
						Values: this.configSvc.languages
					},
				}
			}
		] as Array<any>;

		config.forEach(options => {
			if (!options.Required && this.configSvc.appConfig.accountRegistrations.required.findIndex(value => value === options.Name) > -1) {
				options.Required = true;
			}
		});

		this.update.language = this.profile.Language;
		this.title = await this.configSvc.getResourceAsync("users.profile.update.title");
		this.configSvc.appTitle = this.title;
		await this.prepareButtonsAsync();
		this.update.config = config;
	}

	async updateProfileAsync() {
		if (this.update.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.update.form);
		}
		else if (this.update.hash === AppCrypto.hash(this.update.form.value)) {
			await this.showProfileAsync();
		}
		else {
			await this.appFormsSvc.showLoadingAsync(this.title);
			await this.usersSvc.updateProfileAsync(
				this.update.form.value,
				async () => {
					if (this.profile.ID === this.configSvc.getAccount().id) {
						this.configSvc.getAccount().profile = UserProfile.get(this.profile.ID);
						await this.configSvc.storeSessionAsync();
						if (this.update.language !== this.update.form.value.Language) {
							await this.configSvc.changeLanguageAsync(this.update.form.value.Language);
						}
						AppEvents.broadcast("Profile", { Type: "Updated" });
					}
					await Promise.all([
						TrackingUtility.trackAsync(this.title + ` [${this.profile.Name}]`, "users/update/profile"),
						this.showProfileAsync(async () => await this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("users.profile.update.messages.success")))
					]);
				},
				async error => await this.appFormsSvc.showErrorAsync(error)
			);
		}
	}

	async openUpdatePasswordAsync() {
		const config = [
			{
				Name: "OldPassword",
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
				Name: "Password",
				Required: true,
				Options: {
					Type: "password",
					Label: await this.configSvc.getResourceAsync("users.profile.password.controls.Password"),
					MinLength: 1,
					MaxLength: 150
				}
			},
			{
				Name: "ConfirmPassword",
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
		this.title = await this.configSvc.getResourceAsync("users.profile.password.title");
		this.configSvc.appTitle = this.title;
		await this.prepareButtonsAsync();
		this.password.config = config;
	}

	async updatePasswordAsync() {
		if (this.password.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.password.form);
		}
		else {
			await this.appFormsSvc.showLoadingAsync(this.title);
			await this.usersSvc.updatePasswordAsync(
				this.password.form.value.OldPassword,
				this.password.form.value.Password,
				async () => await Promise.all([
					TrackingUtility.trackAsync(this.title + ` [${this.profile.Name}]`, "users/update/password"),
					this.showProfileAsync(async () => await this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("users.profile.password.message")))
				]),
				async error => await this.appFormsSvc.showErrorAsync(error, undefined, () => this.password.controls.find(ctrl => ctrl.Name === "OldPassword").focus())
			);
		}
	}

	async openUpdateEmailAsync() {
		const config = [
			{
				Name: "OldPassword",
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
				Name: "Email",
				Required: true,
				Options: {
					Type: "email",
					Label: await this.configSvc.getResourceAsync("users.profile.email.controls.Email"),
					MinLength: 1,
					MaxLength: 150
				}
			},
			{
				Name: "ConfirmEmail",
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
		this.title = await this.configSvc.getResourceAsync("users.profile.email.title");
		this.configSvc.appTitle = this.title;
		await this.prepareButtonsAsync();
		this.email.config = config;
	}

	async updateEmailAsync() {
		if (this.email.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.email.form);
		}
		else {
			await this.appFormsSvc.showLoadingAsync(this.title);
			await this.usersSvc.updateEmailAsync(
				this.email.form.value.OldPassword,
				this.email.form.value.Email,
				async () => await Promise.all([
					TrackingUtility.trackAsync(this.title + ` [${this.profile.Name}]`, "users/update/email"),
					this.showProfileAsync(async () => this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("users.profile.email.message")))
				]),
				async error => await this.appFormsSvc.showErrorAsync(error, undefined, () => this.password.controls.find(ctrl => ctrl.Name === "OldPassword").focus())
			);
		}
	}

	async openUpdatePrivilegesAsync() {
		this.title = await this.configSvc.getResourceAsync("users.profile.privileges.title") + ` [${this.profile.Name}]`;
		this.configSvc.appTitle = this.title;
		await this.prepareButtonsAsync();
		this.services = this.authSvc.isSystemAdministrator()
			? this.configSvc.appConfig.services.all.map(service => service.name)
			: this.configSvc.appConfig.services.all.filter(service => this.authSvc.isServiceAdministrator(service.name)).map(service => service.name);
		const privileges = Account.instances.getValue(this.profile.ID).privileges;
		this.services.forEach(service => this._privileges.privileges[service] = privileges.filter(privilege => privilege.ServiceName === service));
		this._privileges.hash = AppCrypto.hash(this._privileges.privileges);
	}

	onPrivilegesChanged($event: any) {
		this._privileges.privileges[$event.service] = $event.privileges as Array<Privilege>;
	}

	trackPrivileges(index: number, service: string) {
		return `${service}@${index}`;
	}

	getPrivileges(service: string) {
		return Account.instances.getValue(this.profile.ID).privileges.filter(privilege => privilege.ServiceName === service);
	}

	async updatePrivilegesAsync() {
		if (this._privileges.hash !== AppCrypto.hash(this._privileges.privileges)) {
			await this.appFormsSvc.showLoadingAsync(this.title);
			await this.usersSvc.updatePrivilegesAsync(
				this.profile.ID,
				this._privileges.privileges,
				async () => await Promise.all([
					TrackingUtility.trackAsync(this.title + ` [${this.profile.Name}]`, "users/update/privileges"),
					this.showProfileAsync(async () => this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("users.profile.privileges.message", { name: this.profile.Name })))
				]),
				async error => await this.appFormsSvc.showErrorAsync(error)
			);
		}
		else {
			await this.showProfileAsync();
		}
	}

	showProfileAsync(preProcess?: () => void) {
		return this.appFormsSvc.hideLoadingAsync(async () => await this.zone.run(async () => {
			if (preProcess !== undefined) {
				preProcess();
			}
			await this.configSvc.navigateBackAsync(!this.configSvc.previousUrl.startsWith(this.configSvc.appConfig.url.users.profile) ? this.configSvc.appConfig.url.users.profile + "/my" : undefined);
		}));
	}

}
