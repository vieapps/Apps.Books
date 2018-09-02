import { Injectable } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, FormArray } from "@angular/forms";
import { Validators, ValidatorFn, AsyncValidatorFn } from "@angular/forms";
import { LoadingController, AlertController, ActionSheetController, ModalController, ToastController } from "@ionic/angular";
import { CompleterData, CompleterItem } from "ng2-completer";
import { AppConfig } from "../app.config";
import { AppUtility } from "./app.utility";
import { PlatformUtility } from "./app.utility.platform";

/** Configuration of a control in the dynamic forms */
export class AppFormsControl {

	constructor (
		options?: any,
		order?: number
	) {
		if (options !== undefined) {
			this.assign(options, this, order);
		}
	}

	Key = "";
	Type = "TextBox";
	Order = 0;
	Excluded = false;
	Required = false;
	Validators: Array<ValidatorFn> | Array<string> = undefined;
	AsyncValidators: Array<AsyncValidatorFn> | Array<string> = undefined;
	Extras: { [key: string]: any } = {};
	Options = {
		Type: "text",
		Label: undefined as string,
		LabelOptions: {
			Position: "stacked",
			Color: "",
			Css: ""
		},
		Description: undefined as string,
		DescriptionOptions: {
			Css: "",
			Style: ""
		},
		Icon: "",
		Name: "",
		Css: "",
		PlaceHolder: undefined as string,
		ValidatePattern: undefined as string,
		Disabled: false,
		ReadOnly: false,
		AutoFocus: false,
		Min: undefined as any,
		Max: undefined as any,
		MinLength: undefined as number,
		MaxLength: undefined as number,
		Width: undefined as string,
		MinWidth: undefined as string,
		MaxWidth: undefined as string,
		Height: undefined as string,
		MinHeight: undefined as string,
		MaxHeight: undefined as string,
		SelectOptions: {
			Values: undefined as Array<{ Value: string, Label: any }>,
			Multiple: false,
			AsBoxes: false,
			Interface: "alert",
			InterfaceOptions: undefined as any,
			CancelText: undefined as string,
			OKText: undefined as string,
		},
		DateOptions: {
			AllowTimes: false,
			DisplayFormat: undefined as string,
			PickerFormat: undefined as string,
			DayNames: undefined as string,
			DayShortNames: undefined as string,
			MonthNames: undefined as string,
			MonthShortNames: undefined as string,
			CancelText: undefined as string,
			DoneText: undefined as string,
		},
		CompleterOptions: {
			SearchingText: "Searching...",
			NoResultsText: "Not found",
			PauseMiliseconds: 123,
			ClearSelected: false,
			DataSource: undefined as CompleterData,
			Handlers: {
				Initialize: undefined as (control: AppFormsControl) => void,
				GetInitialValue: undefined as (control: AppFormsControl) => any,
				OnItemSelected: undefined as (item: CompleterItem, control: AppFormsControl) => void
			}
		}
	};
	SubControls: {
		AsArray: boolean,
		Controls: Array<AppFormsControl>
	} = undefined;

	/** Gets uri of the captcha image */
	public get captchaUri() {
		return this.Extras["_data:CaptchaUri"];
	}

	/** Sets uri of the captcha image */
	public set captchaUri(value: string) {
		this.Extras["_data:CaptchaUri"] = value;
	}

	/** Gets the reference to the UI element of this control */
	public get elementRef() {
		return this.Extras["_ctrl:ElementRef"];
	}

	/** Sets the reference to the UI element of this control */
	public set elementRef(value: any) {
		this.Extras["_ctrl:ElementRef"] = value;
	}

	/** Gets the reference to the form element of this control */
	public get formRef() {
		return this.Extras["_ctrl:FormRef"];
	}

	/** Sets the reference to the form element of this control */
	public set formRef(value: AbstractControl) {
		this.Extras["_ctrl:FormRef"] = value;
	}

	/** Gets the reference to the next sibling */
	public get next() {
		return this.Extras["_cfg:Next"];
	}

	/** Sets the reference to the next sibling */
	public set next(value: AppFormsControl) {
		this.Extras["_cfg:Next"] = value;
	}

	/** Gets the reference to the parent sibling */
	public get parent() {
		return this.Extras["_cfg:Parent"];
	}

	/** Sets the reference to the parent sibling */
	public set parent(value: AppFormsControl) {
		this.Extras["_cfg:Parent"] = value;
	}

	/** Sets the value of the control */
	public set value(value: any) {
		this.formRef.setValue(value);
	}

	/** Gets the value of the control */
	public get value() {
		return this.formRef.value;
	}

	private assign(options: any, control?: AppFormsControl, order?: number, alternativeKey?: string) {
		control = control || new AppFormsControl();
		control.Order = options.Order || options.order || order || 0;
		control.Extras = options.Extras || options.extras || {};

		control.Key = options.Key || options.key || (alternativeKey !== undefined ? `${alternativeKey}_${control.Order}` : `c_${control.Order}`);
		control.Type = options.Type || options.type || "TextBox";

		control.Excluded = !!(options.Excluded || options.excluded);
		control.Required = !control.Excluded && !!options.Required;

		control.Validators = options.Validators;
		control.AsyncValidators = options.AsyncValidators;

		const controlOptions = options.Options || options.options;
		if (controlOptions !== undefined) {
			control.Options.Type = controlOptions.Type || controlOptions.type || "text";

			control.Options.Label = controlOptions.Label || controlOptions.label;
			const labelOptions = controlOptions.LabelOptions || controlOptions.labeloptions;
			if (labelOptions !== undefined) {
				control.Options.LabelOptions.Position = labelOptions.Position || labelOptions.position || "stacked";
				control.Options.LabelOptions.Color = labelOptions.Color || labelOptions.color || "";
				control.Options.LabelOptions.Css = labelOptions.Css || labelOptions.css || "";
			}

			control.Options.Description = controlOptions.Description || controlOptions.description;
			const descriptionOptions = controlOptions.DescriptionOptions || controlOptions.descriptionoptions;
			if (descriptionOptions !== undefined) {
				control.Options.DescriptionOptions.Css = (descriptionOptions.Css || descriptionOptions.css || "").replace("--description-label-css", "description");
				control.Options.DescriptionOptions.Style = descriptionOptions.Style || descriptionOptions.style || "";
			}

			control.Options.PlaceHolder = controlOptions.PlaceHolder || controlOptions.placeholder;
			control.Options.Css = controlOptions.Css || controlOptions.css || "";
			control.Options.Icon = controlOptions.Icon || controlOptions.icon;
			control.Options.Name = alternativeKey !== undefined ? `${alternativeKey}-${control.Key}` : `${control.Key}`;
			control.Options.ValidatePattern = controlOptions.ValidatePattern || controlOptions.validatepattern;

			control.Options.Disabled = !!(controlOptions.Disabled || controlOptions.disabled);
			control.Options.ReadOnly = !!(controlOptions.ReadOnly || controlOptions.readonly);
			control.Options.AutoFocus = !!(controlOptions.AutoFocus || controlOptions.autofocus);

			control.Options.Min = controlOptions.Min || controlOptions.min;
			control.Options.Max = controlOptions.Max || controlOptions.max;

			control.Options.MinLength = controlOptions.MinLength || controlOptions.minlength;
			control.Options.MaxLength = controlOptions.MaxLength || controlOptions.maxlength;

			control.Options.Width = controlOptions.Width || controlOptions.width;
			control.Options.MinWidth = controlOptions.MinWidth || controlOptions.minwidth;
			control.Options.MaxWidth = controlOptions.MaxWidth || controlOptions.maxwidth;

			control.Options.Height = controlOptions.Height || controlOptions.height;
			control.Options.MinHeight = controlOptions.MinHeight || controlOptions.minheight;
			control.Options.MaxHeight = controlOptions.MaxHeight || controlOptions.maxheight;

			const selectOptions = controlOptions.SelectOptions || controlOptions.selectoptions;
			if (selectOptions !== undefined) {
				control.Options.SelectOptions = {
					Values: ((selectOptions.Values || selectOptions.values) as Array<any> || []).map(kvp => {
						return {
							Value: kvp.Value || kvp.value,
							Label: kvp.Label || kvp.label
						};
					}),
					Multiple: !!(selectOptions.Multiple || selectOptions.multiple),
					AsBoxes: !!(selectOptions.AsBoxes || selectOptions.asboxes),
					Interface: selectOptions.Interface || selectOptions.interface || "alert",
					InterfaceOptions: selectOptions.InterfaceOptions || selectOptions.interfaceoptions,
					CancelText: selectOptions.CancelText || selectOptions.canceltext,
					OKText: selectOptions.OKText || selectOptions.oktext
				};
			}

			const dateOptions = controlOptions.DateOptions || controlOptions.dateoptions;
			if (dateOptions !== undefined) {
				control.Options.DateOptions = {
					AllowTimes: !!(dateOptions.AllowTimes || dateOptions.allowtimes),
					DisplayFormat: dateOptions.DisplayFormat || dateOptions.displayformat,
					PickerFormat: dateOptions.PickerFormat || dateOptions.pickerformat,
					DayNames: dateOptions.DayNames || dateOptions.daynames,
					DayShortNames: dateOptions.DayShortNames || dateOptions.dayshortnames,
					MonthNames: dateOptions.MonthNames || dateOptions.monthnames,
					MonthShortNames: dateOptions.MonthShortNames || dateOptions.monthshortnames,
					CancelText: dateOptions.CancelText || dateOptions.canceltext,
					DoneText: dateOptions.DoneText || dateOptions.donetext
				};
			}

			const completerOptions = controlOptions.CompleterOptions || controlOptions.completeroptions;
			if (completerOptions !== undefined) {
				const handlers = completerOptions.Handlers || completerOptions.handlers || {};
				control.Options.CompleterOptions = {
					SearchingText: completerOptions.SearchingText || completerOptions.searchingtext || "Searching...",
					NoResultsText: completerOptions.NoResultsText || completerOptions.noresultstext || "Not found",
					PauseMiliseconds: completerOptions.PauseMiliseconds || completerOptions.pausemiliseconds || 123,
					ClearSelected: !!(completerOptions.ClearSelected || completerOptions.clearselected),
					DataSource: completerOptions.DataSource || completerOptions.datasource,
					Handlers: {
						Initialize: handlers.Initialize || handlers.initialize,
						GetInitialValue: handlers.GetInitialValue || handlers.getinitialvalue,
						OnItemSelected: handlers.OnItemSelected || handlers.onitemselected
					}
				};
			}
		}

		const subControls = options.SubControls || options.subcontrols;
		if (subControls !== undefined) {
			const subConfig = subControls.Controls || subControls.controls;
			if (AppUtility.isArray(subConfig, true)) {
				control.SubControls = {
					AsArray: !!(subControls.AsArray || subControls.asarray),
					Controls: (subConfig as Array<any>).map((suboptions, suborder) => this.assign(suboptions, undefined, suborder, control.Key)).sort((a, b) => a.Order - b.Order)
				};
				if (control.SubControls.Controls.length < 1) {
					control.SubControls = undefined;
				}
			}
		}

		return control;
	}

	/** Copies the options of this control */
	public copy(onPreCompleted?: (options: Array<any>) => void) {
		const options = AppUtility.clone(this, ["Order", "Validators", "AsyncValidators"]);
		options.Validators = this.Validators;
		options.AsyncValidators = this.AsyncValidators;
		options.Options.SelectOptions.InterfaceOptions = this.Options.SelectOptions.InterfaceOptions;
		options.Options.CompleterOptions.DataSource = this.Options.CompleterOptions.DataSource;
		options.Options.CompleterOptions.Handlers = this.Options.CompleterOptions.Handlers;
		if (onPreCompleted !== undefined) {
			onPreCompleted(options);
		}
		return options;
	}

	/** Clones this control */
	public clone(order?: number, onPreCompleted?: (control: AppFormsControl) => void) {
		const control = new AppFormsControl(this.copy(), order);
		if (onPreCompleted !== undefined) {
			onPreCompleted(control);
		}
		return control;
	}

	/** Sets focus into this control */
	public focus(defer?: number) {
		PlatformUtility.focus(this.elementRef, defer);
	}

}

@Injectable()
export class AppFormsService {

	constructor (
		public loadingController: LoadingController,
		public alertController: AlertController,
		public actionsheetController: ActionSheetController,
		public modalController: ModalController,
		public toastController: ToastController
	) {
	}

	private _loading: any;
	private _actionsheet: any;
	private _modal: any;
	private _alert: any;
	private _textControls = ["text", "password", "email", "search", "tel", "url"];
	private _metaCounties: {
		[key: string]: Array<{ County: string, Province: string, Country: string, Title: string, TitleANSI: string}>
	} = {};

	private prepareControls(controls: Array<AppFormsControl>) {
		controls.forEach((control, index) => {
			if (index < controls.length - 1) {
				control.next = controls[index + 1];
			}
			if (control.SubControls !== undefined) {
				control.SubControls.Controls.forEach(subcontrol => subcontrol.parent = control);
				this.prepareControls(control.SubControls.Controls);
			}
		});
	}

	/** Gets the definition of all controls */
	public getControls(config: Array<any> = [], controls?: Array<AppFormsControl>) {
		controls = controls || new Array<AppFormsControl>();
		config.map((options, order) => new AppFormsControl(options, order))
			.sort((a, b) => a.Order - b.Order)
			.forEach(control => controls.push(control));
		this.prepareControls(controls);
		return controls;
	}

	/** Updates the definition of all controls */
	public updateControls(controls: Array<AppFormsControl> = [], value: any = {}) {
		controls.filter(control => control.SubControls !== undefined).forEach(control => {
			if (control.SubControls.AsArray) {
				const values = value[control.Key] as Array<any>;
				const options = control.SubControls.Controls[0].copy();
				while (control.SubControls.Controls.length < values.length) {
					control.SubControls.Controls.push(new AppFormsControl(options, control.SubControls.Controls.length));
				}
				control.SubControls.Controls.forEach((subcontrol, subindex) => {
					if (subcontrol.SubControls !== undefined) {
						this.updateControls(subcontrol.SubControls.Controls, values[subindex]);
					}
				});
			}
			else {
				this.updateControls(control.SubControls.Controls, value[control.Key]);
			}
		});
		this.prepareControls(controls);
	}

	/** Builds the form */
	public buildForm(form: FormGroup, controls: Array<AppFormsControl> = [], value?: any, validators?: Array<ValidatorFn>, asyncValidators?: Array<AsyncValidatorFn>) {
		if (value !== undefined) {
			this.updateControls(controls, value);
			this.getFormGroup(controls, form, validators, asyncValidators);
			form.patchValue(value);
		}
		else {
			this.getFormGroup(controls, form, validators, asyncValidators);
		}
	}

	private getFormGroup(controls: Array<AppFormsControl>, formGroup?: FormGroup, validators?: Array<ValidatorFn>, asyncValidators?: Array<AsyncValidatorFn>) {
		formGroup = formGroup || new FormGroup({}, validators, asyncValidators);
		controls.forEach(control => {
			if (control.SubControls === undefined && control.Type === "Completer" && control.Options.Type === "Address") {
				const options = control.copy();
				["County", "Province", "Country"].forEach(key => formGroup.addControl(key, this.getFormControl(new AppFormsControl(options))));
			}
			else {
				const formControl = control.SubControls === undefined
					? this.getFormControl(control)
					: control.SubControls.AsArray
						? this.getFormArray(control, this.getValidators(control), this.getAsyncValidators(control))
						: this.getFormGroup(control.SubControls.Controls, undefined, this.getValidators(control), this.getAsyncValidators(control));
				formGroup.addControl(control.Key, formControl);
			}
		});
		return formGroup;
	}

	private getFormArray(control: AppFormsControl, validators?: Array<ValidatorFn>, asyncValidators?: Array<AsyncValidatorFn>) {
		const formArray = new FormArray([], validators, asyncValidators);
		control.SubControls.Controls.forEach(subcontrol => {
			if (subcontrol.SubControls === undefined && subcontrol.Type === "Completer" && subcontrol.Options.Type === "Address") {
				const options = subcontrol.copy();
				const formGroup = new FormGroup({}, this.getValidators(subcontrol), this.getAsyncValidators(subcontrol));
				["County", "Province", "Country"].forEach(key => formGroup.addControl(key, this.getFormControl(new AppFormsControl(options))));
				formArray.push(formGroup);
			}
			else {
				const formControl: AbstractControl = subcontrol.SubControls === undefined
					? this.getFormControl(subcontrol)
					: subcontrol.SubControls.AsArray
						? this.getFormArray(subcontrol, this.getValidators(subcontrol), this.getAsyncValidators(subcontrol))
						: this.getFormGroup(subcontrol.SubControls.Controls, undefined, this.getValidators(subcontrol), this.getAsyncValidators(subcontrol));
				formArray.push(formControl);
			}
		});
		return formArray;
	}

	private getFormControl(control: AppFormsControl) {
		return new FormControl({ value: "", disabled: control.Options.Disabled }, this.getValidators(control), this.getAsyncValidators(control));
	}

	private getValidators(control: AppFormsControl) {
		let validators = new Array<ValidatorFn>();

		if (control.Validators !== undefined && control.Validators.length > 0) {
			if (typeof control.Validators[0] === "string") {

			}
			else {
				validators = control.Validators as Array<ValidatorFn>;
			}
		}

		if (control.Required) {
			validators.push(Validators.required);
		}

		if (this._textControls.findIndex(ctrl => ctrl === control.Options.Type) > -1) {
			if (control.Options.MinLength > 0) {
				validators.push(Validators.minLength(control.Options.MinLength));
			}
			if (control.Options.MaxLength > 0) {
				validators.push(Validators.maxLength(control.Options.MaxLength));
			}
			if (control.Options.Type === "email") {
				validators.push(Validators.pattern("([a-zA-Z0-9_.-]+)@([a-zA-Z0-9_.-]+)\\.([a-zA-Z]{2,5})"));
			}
		}

		if (control.Options.Type === "number" || control.Options.Type === "date") {
			if (control.Options.Min > 0) {
				validators.push(Validators.min(control.Options.Min));
			}
			if (control.Options.Max > 0) {
				validators.push(Validators.max(control.Options.Max));
			}
		}

		if (AppUtility.isNotEmpty(control.Options.ValidatePattern)) {
			validators.push(Validators.pattern(control.Options.ValidatePattern));
		}

		return validators;
	}

	private getAsyncValidators(control: AppFormsControl) {
		const asyncValidators = new Array<AsyncValidatorFn>();
		return asyncValidators;
	}

	/** Sets value of the form (also modify the FormArray controls if the length is not matched) */
	public setValue(form: FormGroup, controls: Array<AppFormsControl>, value: any = {}) {
		this.updateControls(controls, value);
		Object.keys(form.controls).forEach(key => delete form.controls[key]);
		this.buildForm(form, controls, value);
	}

	/** Highlights all invalid controls (by mark as dirty on all invalid controls) and set focus into first invalid control */
	public highlightInvalids(form: FormGroup) {
		const control = this.highlightInvalidsFormGroup(form, form["_controls"] as Array<AppFormsControl>);
		if (control !== undefined) {
			control.focus();
		}
	}

	private highlightInvalidsFormGroup(formGroup: FormGroup, controls: Array<AppFormsControl>) {
		let first: AppFormsControl;
		Object.keys(formGroup.controls).forEach(key => {
			const formControl = formGroup.controls[key];
			if (formControl.invalid) {
				const control = controls.find(ctrl => ctrl.Key === key);
				const subcontrols = control !== undefined && control.SubControls !== undefined ? control.SubControls.Controls : undefined;
				if (formControl instanceof FormGroup) {
					first = first || this.highlightInvalidsFormGroup(formControl as FormGroup, subcontrols);
				}
				else if (formControl instanceof FormArray) {
					first = first || this.highlightInvalidsFormArray(formControl as FormArray, subcontrols);
				}
				else {
					formControl.markAsDirty();
					first = first || control;
				}
			}
		});
		return first;
	}

	private highlightInvalidsFormArray(formArray: FormArray, controls: Array<AppFormsControl>) {
		let first: AppFormsControl;
		formArray.controls.forEach((control, index) => {
			if (control.invalid) {
				if (control instanceof FormGroup) {
					first = first || this.highlightInvalidsFormGroup(control as FormGroup, controls[index] !== undefined && controls[index].SubControls !== undefined ? controls[index].SubControls.Controls : undefined);
				}
				else if (control instanceof FormArray) {
					first = first || this.highlightInvalidsFormArray(control as FormArray, controls[index] !== undefined && controls[index].SubControls !== undefined ? controls[index].SubControls.Controls : undefined);
				}
				else {
					control.markAsDirty();
					first = first || controls[index];
				}
			}
		});
		return first;
	}

	/** Sets focus into control */
	public focus(control: AppFormsControl, whenNoControlFound?: () => void) {
		if (control !== undefined) {
			control.focus();
		}
		else if (whenNoControlFound !== undefined) {
			whenNoControlFound();
		}
	}

	private getNext(control: AppFormsControl) {
		let next = control !== undefined ? control.next : undefined;
		while (next !== undefined && next.Excluded) {
			next = next.next;
		}
		return next;
	}

	/** Sets focus into next control */
	public focusNext(control: AppFormsControl, whenNoControlFound?: () => void) {
		this.focus(this.getNext(control), whenNoControlFound);
	}

	/** Checks values of two controls are equal or not */
	public areEquals(original: string, confirm: string): ValidatorFn {
		return (formGroup: FormGroup): { [key: string]: any } | null => {
			const originalControl = formGroup.controls[original];
			const confirmControl = formGroup.controls[confirm];
			if (originalControl !== undefined && confirmControl !== undefined && originalControl.value !== confirmControl.value) {
				confirmControl.setErrors({ notEquivalent: true });
				return { notEquivalent: true };
			}
			else {
				return null;
			}
		};
	}

	/** Checks value of the control is equal with other control value or not */
	public isEquals(other: string): ValidatorFn {
		return (formControl: AbstractControl): { [key: string]: any } | null => {
			const otherControl = formControl.parent instanceof FormGroup
				? (formControl.parent as FormGroup).controls[other]
				: undefined;
			if (otherControl !== undefined && otherControl.value !== formControl.value) {
				formControl.setErrors({ notEquivalent: true });
				return { notEquivalent: true };
			}
			else {
				return null;
			}
		};
	}

	/** Gets the listing of meta counties of a specified country */
	public getMetaCounties(country?: string) {
		country = country || AppConfig.meta.country;
		if (this._metaCounties[country] === undefined && AppConfig.meta.provinces[country] !== undefined) {
			const counties = new Array<{
				County: string,
				Province: string,
				Country: string,
				Title: string,
				TitleANSI: string
			}>();
			const provinces = AppConfig.meta.provinces[country].provinces || [];
			provinces.forEach(province => province.counties.forEach(county => counties.push({
				County: county.title,
				Province: province.title,
				Country: country,
				Title: county.title + ", " + province.title + ", " + country,
				TitleANSI: AppUtility.toANSI(county.title + ", " + province.title + ", " + country)
			})));
			this._metaCounties[country] = counties;
		}
		return this._metaCounties[country] || [];
	}

	/** Shows the loading */
	public async showLoadingAsync(message?: string) {
		if (this._loading === undefined) {
			this._loading = await this.loadingController.create({
				message: message || "Loading..."
			});
			await this._loading.present();
		}
	}

	/** Hides the loading */
	public async hideLoadingAsync(onDismiss?: () => void) {
		if (this._loading !== undefined) {
			await this._loading.dismiss();
			this._loading = undefined;
		}
		if (onDismiss !== undefined) {
			onDismiss();
		}
	}

	/** Get the button for working with action sheet */
	public getActionSheetButton(text: string, icon?: string, handler?: () => void, role?: string) {
		return {
			text: text,
			role: role,
			icon: icon,
			handler: handler
		};
	}

	/** Shows the action sheet */
	public async showActionSheetAsync(buttons: Array<{ text: string, role: string, icon: string, handler: () => void }>, backdropDismiss?: boolean, dontAddCancelButton?: boolean) {
		const isRunningOnIOS = AppConfig.isRunningOnIOS;
		const actions = buttons.map(button => {
			return {
				text: button.text,
				role: button.role,
				icon: isRunningOnIOS ? undefined : button.icon,
				handler: button.handler
			};
		});
		if (AppUtility.isFalse(dontAddCancelButton)) {
			actions.push(this.getActionSheetButton("Huỷ", "close", async () => await this.hideActionSheetAsync(), "cancel"));
		}
		this._actionsheet = await this.actionsheetController.create({
			buttons: actions,
			backdropDismiss: backdropDismiss
		});
		await Promise.all([
			this.hideLoadingAsync(),
			this._actionsheet.present()
		]);
	}

	/** Hides the action sheet */
	public async hideActionSheetAsync(onDismiss?: () => void) {
		if (this._actionsheet !== undefined) {
			await this._actionsheet.dismiss();
			this._actionsheet = undefined;
		}
		if (onDismiss !== undefined) {
			onDismiss();
		}
	}

	/** Shows the alert confirmation box  */
	public async showAlertAsync(header: string = null, subHeader: string = null, message: string, postProcess: (data?: any) => void = () => {}, okButtonText: string = null, cancelButtonText: string = null, inputs: Array<any> = null) {
		await this.hideLoadingAsync();
		if (this._alert !== undefined) {
			await this._alert.dismiss();
			this._alert = undefined;
		}

		const buttons = AppUtility.isNotEmpty(cancelButtonText)
			? [{ text: cancelButtonText || "Huỷ", role: "cancel", handler: undefined as (data?: any) => void }]
			: [];
		buttons.push({
			text: okButtonText || "Đóng",
			role: undefined as string,
			handler: async (data?: any) => {
				postProcess(data);
				await this._alert.dismiss();
				this._alert = undefined;
			}
		});

		this._alert = AppUtility.isArray(inputs, true)
			? await this.alertController.create({
					header: header || "Chú ý",
					subHeader: subHeader,
					backdropDismiss: false,
					message: message,
					inputs: inputs,
					buttons: buttons
				})
			: await this.alertController.create({
					header: header || "Chú ý",
					subHeader: subHeader,
					backdropDismiss: false,
					message: message,
					buttons: buttons
				});
		await this._alert.present();
	}

	/** Shows the error message (by the alert confirmation box) */
	public async showErrorAsync(error: any, subHeader?: string, postProcess?: (data?: any) => void) {
		const message = AppUtility.isGotWrongAccountOrPasswordException(error)
			? "Tài khoản hoặc mật khẩu không đúng!"
			: AppUtility.isGotCaptchaException(error) || AppUtility.isGotOTPException(error)
				? "Mã xác thực không đúng"
				: AppUtility.isNotEmpty(error.Message) ? error.Message : "Đã xảy ra lỗi!";
		await this.showAlertAsync("Lỗi", subHeader, message, postProcess);
	}

	/** Shows the modal box */
	public async showModalAsync(component: any) {
		await this.hideModalAsync();
		this._modal = await this.modalController.create({
			component: component,
			backdropDismiss: false
		});
		await this._modal.present();
	}

	/** Hides the modal box */
	public async hideModalAsync(onDismiss?: () => void) {
		if (this._modal !== undefined) {
			await this._modal.dismiss();
			this._modal = undefined;
		}
		if (onDismiss !== undefined) {
			onDismiss();
		}
	}

	/** Shows the toast alert message */
	public async showToastAsync(message: string, duration: number = 1000, showCloseButton: boolean = false, closeButtonText: string = "close", atBottom: boolean = false) {
		const toast = !showCloseButton && duration < 1
			? await this.toastController.create({
					message: message,
					duration: 1000,
					position: atBottom ? "bottom" : "top",
					animated: true
				}
			)
			: await this.toastController.create({
					message: message,
					duration: duration,
					showCloseButton: showCloseButton,
					closeButtonText: closeButtonText,
					position: atBottom ? "bottom" : "top",
					animated: true
				}
			);
		await toast.present();
	}

}
