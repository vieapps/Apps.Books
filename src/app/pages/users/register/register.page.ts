import { Component, OnInit, NgZone } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { AppUtility } from "../../../components/app.utility";
import { TrackingUtility } from "../../../components/app.utility.trackings";
import { AppFormsControl, AppFormsService } from "../../../components/forms.service";
import { ConfigurationService } from "../../../services/configuration.service";
import { AuthenticationService } from "../../../services/authentication.service";
import { UsersService } from "../../../services/users.service";

@Component({
	selector: "page-users-register",
	templateUrl: "./register.page.html",
	styleUrls: ["./register.page.scss"]
})

export class UsersRegisterPage implements OnInit {

	constructor(
		public zone: NgZone,
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public authSvc: AuthenticationService,
		public usersSvc: UsersService
	) {
	}

	title = "Register new account";
	register = {
		form: new FormGroup({}, [this.appFormsSvc.areEquals("Email", "ConfirmEmail"), this.appFormsSvc.areEquals("Password", "ConfirmPassword")]),
		controls: new Array<AppFormsControl>(),
		config: undefined as Array<any>,
		button: {
			label: "Register",
			icon: undefined as string
		}
	};

	async ngOnInit() {
		const config: Array<any> = [
			{
				Name: "Email",
				Required: true,
				Options: {
					Type: "email",
					Label: await this.configSvc.getResourceAsync("users.register.controls.Email"),
					MinLength: 1,
					MaxLength: 250,
					AutoFocus: true
				}
			},
			{
				Name: "ConfirmEmail",
				Required: true,
				Validators: [this.appFormsSvc.isEquals("Email")],
				Options: {
					Type: "email",
					Label: await this.configSvc.getResourceAsync("users.register.controls.ConfirmEmail"),
					MinLength: 1,
					MaxLength: 250
				}
			},
			{
				Name: "Password",
				Required: true,
				Options: {
					Type: "password",
					Label: await this.configSvc.getResourceAsync("users.register.controls.Password"),
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
					Label: await this.configSvc.getResourceAsync("users.register.controls.ConfirmPassword"),
					MinLength: 1,
					MaxLength: 150
				}
			},
			{
				Name: "Name",
				Required: true,
				Options: {
					Type: "text",
					Label: await this.configSvc.getResourceAsync("users.register.controls.Name.label"),
					Description: await this.configSvc.getResourceAsync("users.register.controls.Name.description"),
					MinLength: 1,
					MaxLength: 250
				}
			},
			{
				Name: "Gender",
				Type: "Select",
				Required: true,
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
				Required: true,
				Options: {
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
				Required: true,
				Options: {
					Type: "text",
					Label: await this.configSvc.getResourceAsync("users.register.controls.Address.label"),
					MinLength: 1,
					MaxLength: 250
				}
			},
			{
				Name: "Addresses",
				Type: "Lookup",
				Required: true,
				Options: {
					Type: "Address",
					PlaceHolder: await this.configSvc.getResourceAsync("users.register.controls.Address.placeholder"),
					MinLength: 2,
					MaxLength: 250
				}
			},
			{
				Name: "Mobile",
				Required: true,
				Options: {
					Type: "tel",
					Label: await this.configSvc.getResourceAsync("users.register.controls.Mobile"),
					MinLength: 10,
					MaxLength: 15
				}
			},
			{
				Name: "Captcha",
				Type: "Captcha",
				Required: true,
				Options: {
					Label: await this.configSvc.getResourceAsync("users.login.reset.controls.Captcha.label"),
					Description: await this.configSvc.getResourceAsync("users.login.reset.controls.Captcha.description"),
					MinLength: 4,
					MaxLength: 4
				}
			}
		];

		config.forEach(options => {
			if (this.configSvc.appConfig.accountRegistrations.hidden.findIndex(value => value === options.Name) > -1) {
				options.Hidden = true;
				options.Required = false;
			}
			else if (!options.Required && this.configSvc.appConfig.accountRegistrations.required.findIndex(value => value === options.Name) > -1) {
				options.Required = true;
			}
		});

		this.register.button.label = await this.configSvc.getResourceAsync("users.register.button");
		this.configSvc.appTitle = this.title = await this.configSvc.getResourceAsync("users.register.title");
		this.register.config = config;
	}

	async registerAsync() {
		if (this.register.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.register.form);
		}
		else {
			await this.appFormsSvc.showLoadingAsync(this.title);
			await this.usersSvc.registerAsync(
				AppUtility.clone(this.register.form.value, ["ConfirmEmail", "ConfirmPassword", "Captcha"]),
				this.register.form.value.Captcha,
				async () => await Promise.all([
					TrackingUtility.trackAsync(this.title, "/users/register"),
					this.appFormsSvc.showAlertAsync(
						await this.configSvc.getResourceAsync("users.register.alert.header"),
						undefined,
						await this.configSvc.getResourceAsync("users.register.alert.message", { email: this.register.form.value.Email }),
						async () => await this.zone.run(async () => {
							if (this.configSvc.previousUrl.startsWith("/users")) {
								await this.configSvc.navigateHomeAsync();
							}
							else {
								await this.configSvc.navigateBackAsync();
							}
						}
					))
				]),
				async error => await Promise.all([
					this.refreshCaptchaAsync(),
					this.appFormsSvc.showErrorAsync(error, undefined, () => {
						if (AppUtility.isGotCaptchaException(error)) {
							const control = this.register.controls.find(c => c.Name === "Captcha");
							control.value = "";
							control.focus();
						}
					})
				])
			);
		}
	}

	onFormInitialized($event: any) {
		this.refreshCaptchaAsync();
		this.register.form.patchValue({ Gender: "NotProvided" });
	}

	onRefreshCaptcha($event: AppFormsControl) {
		this.refreshCaptchaAsync($event);
	}

	refreshCaptchaAsync(control?: AppFormsControl) {
		return this.authSvc.registerCaptchaAsync(() => (control || this.register.controls.find(c => c.Name === "Captcha")).captchaURI = this.configSvc.appConfig.session.captcha.uri);
	}

}
