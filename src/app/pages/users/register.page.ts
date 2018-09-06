import * as Rx from "rxjs";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { registerLocaleData } from "@angular/common";
import { FormGroup } from "@angular/forms";
import { AppUtility } from "../../components/app.utility";
import { TrackingUtility } from "../../components/app.utility.trackings";
import { AppFormsControl, AppFormsService } from "../../components/forms.service";
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
		registerLocaleData(this.configSvc.localeData);
	}

	title = "Register new account";
	rxSubscriptions = new Array<Rx.Subscription>();
	register = {
		form: new FormGroup({}, [this.appFormsSvc.areEquals("Email", "ConfirmEmail"), this.appFormsSvc.areEquals("Password", "ConfirmPassword")]),
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>(),
		value: undefined as any,
		button: {
			label: "Register",
			icon: undefined as string,
			color: "primary",
			fill: "solid"
		}
	};

	get locale() {
		return this.configSvc.locale;
	}

	ngOnInit() {
		this.rxSubscriptions.push(this.register.form.valueChanges.subscribe(value => this.register.value = value));
		this.initializeFormAsync();
	}

	ngOnDestroy() {
		this.rxSubscriptions.forEach(subscription => subscription.unsubscribe());
	}

	async initializeFormAsync() {
		this.register.config = [
			{
				Key: "Email",
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
				Key: "ConfirmEmail",
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
				Key: "Password",
				Required: true,
				Options: {
					Type: "password",
					Label: await this.configSvc.getResourceAsync("users.register.controls.Password"),
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
					Label: await this.configSvc.getResourceAsync("users.register.controls.ConfirmPassword"),
					MinLength: 1,
					MaxLength: 150
				}
			},
			{
				Key: "Name",
				Required: true,
				Options: {
					Type: "text",
					Label: await this.configSvc.getResourceAsync("users.register.controls.Name.label"),
					Description: await this.configSvc.getResourceAsync("users.register.controls.Name.description"),
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
					Min: new Date().getFullYear() - 100,
					Max: (new Date().getFullYear() - 16) + "-12-31",
				}
			},
			{
				Key: "Address",
				Required: true,
				Options: {
					Type: "text",
					Label: await this.configSvc.getResourceAsync("users.register.controls.Address.label"),
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
					PlaceHolder: await this.configSvc.getResourceAsync("users.register.controls.Address.placeholder"),
					MinLength: 2,
					MaxLength: 250,
					CompleterOptions: {
						SearchingText: await this.configSvc.getResourceAsync("app.messages.completer.searching"),
						NoResultsText: await this.configSvc.getResourceAsync("app.messages.completer.noresults")
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
					MaxLength: 15
				}
			},
			{
				Key: "Captcha",
				Type: "Captcha",
				Required: true,
				Options: {
					Label: await this.configSvc.getResourceAsync("users.login.reset.controls.Captcha.label"),
					Description: await this.configSvc.getResourceAsync("users.login.reset.controls.Captcha.description"),
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
				options.Required = false;
			}
			if (required[options.Key] && !options.Excluded) {
				options.Required = true;
			}
		});

		this.register.button.label = await this.configSvc.getResourceAsync("users.register.button");
		this.title = await this.configSvc.getResourceAsync("users.register.title");
		this.configSvc.appTitle = this.title;
	}

	async registerAsync() {
		if (this.register.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.register.form);
			return;
		}

		await this.appFormsSvc.showLoadingAsync(this.title);
		await this.usersSvc.registerAsync(
			AppUtility.clone(this.register.value, ["ConfirmEmail", "ConfirmPassword", "Captcha"]),
			this.register.value.Captcha,
			async () => await Promise.all([
				TrackingUtility.trackAsync(this.title, "/users/register"),
				this.appFormsSvc.showAlertAsync(
					await this.configSvc.getResourceAsync("users.register.alert.header"),
					undefined,
					await this.configSvc.getResourceAsync("users.register.alert.message", { email: this.register.value.Email }),
					() => this.configSvc.navigateBack()
				)
			]),
			async error => await Promise.all([
				this.refreshCaptchaAsync(),
				this.appFormsSvc.showErrorAsync(error)
			])
		);
	}

	onFormInitialized($event) {
		this.refreshCaptchaAsync();
		this.register.form.patchValue({ Gender: "NotProvided" });
	}

	onRefreshCaptcha($event) {
		this.refreshCaptchaAsync($event as AppFormsControl);
	}

	async refreshCaptchaAsync(control?: AppFormsControl) {
		await this.authSvc.registerCaptchaAsync(() => (control || this.register.controls.find(c => c.Key === "Captcha")).captchaURI = this.configSvc.appConfig.session.captcha.uri);
	}

}
