import { Injectable } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, FormArray } from "@angular/forms";
import { Validators, ValidatorFn, AsyncValidatorFn } from "@angular/forms";
import { LoadingController, AlertController, ActionSheetController, ModalController, ToastController } from "@ionic/angular";
import { TranslateService } from "@ngx-translate/core";
import { CompleterData } from "ng2-completer";
import { AppConfig } from "../app.config";
import { AppXHR } from "./app.apis";
import { AppUtility } from "./app.utility";
import { PlatformUtility } from "./app.utility.platform";
import { ConfigurationService } from "../services/configuration.service";

/** Presents the settings of a control in the dynamic forms */
export class AppFormsControl {

	constructor(
		options?: any,
		order?: number
	) {
		if (options !== undefined) {
			this.assign(options, this, order);
		}
	}

	Name = "";
	Order = 0;
	Segment: string;
	Type = "TextBox";
	Hidden = false;
	Required = false;
	Validators: Array<ValidatorFn> | Array<string>;
	AsyncValidators: Array<AsyncValidatorFn> | Array<string>;
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
			Css: "description",
			Style: ""
		},
		Icon: "",
		Name: "",
		Css: "",
		Color: "",
		PlaceHolder: undefined as string,
		ValidatePattern: undefined as string,
		Disabled: false,
		ReadOnly: false,
		AutoFocus: false,
		MinValue: undefined as any,
		MaxValue: undefined as any,
		MinLength: undefined as number,
		MaxLength: undefined as number,
		Width: undefined as string,
		Height: undefined as string,
		TextAreaRows: undefined as number,
		SelectOptions: {
			Values: undefined as Array<{ Value: string, Label: string }>,
			RemoteURI: undefined as string,
			RemoteURIConverter: undefined as (data: any) => { Value: string, Label: string },
			RemoteURIProcessor: undefined as (uri: string, converter?: (data: any) => { Value: string, Label: string }) => Promise<Array<{ Value: string, Label: string }>>,
			Multiple: false,
			AsBoxes: false,
			Interface: "alert",
			InterfaceOptions: undefined as any,
			CancelText: "{{common.buttons.cancel}}",
			OkText: "{{common.buttons.ok}}"
		},
		LookupOptions: {
			SearchingText: "{{common.messages.completer.searching}}",
			NoResultsText: "{{common.messages.completer.noresults}}",
			AsCompleter: true,
			PauseMiliseconds: 234,
			ClearSelected: false,
			DataSource: undefined as CompleterData,
			InitialValue: undefined as any,
			Handlers: {
				Initialize: undefined as (control: AppFormsControl) => void,
				GetInitialValue: undefined as (control: AppFormsControl) => any,
				OnItemSelected: undefined as (item: any, control: AppFormsControl) => void
			}
		},
		DatePickerOptions: {
			AllowTimes: false,
			DisplayFormat: undefined as string,
			PickerFormat: undefined as string,
			DayNames: undefined as string,
			DayShortNames: undefined as string,
			MonthNames: undefined as string,
			MonthShortNames: undefined as string,
			CancelText: "{{common.buttons.cancel}}",
			DoneText: "{{common.buttons.done}}"
		},
		FilePickerOptions: {
			Accept: "*",
			AllowMultiple: true,
			AllowPreview: false,
			AllowDelete: true,
			Handlers: {
				OnChanged: undefined as (event: any) => void,
				OnDeleted: undefined as (file: File) => void
			}
		}
	};
	SubControls: {
		AsArray: boolean,
		Controls: Array<AppFormsControl>
	};

	/** Gets uri of the captcha image */
	public get captchaURI() {
		return this.Extras["_data:CaptchaUri"];
	}

	/** Sets uri of the captcha image */
	public set captchaURI(value: string) {
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

	/** Gets the index of segment (if has) */
	public get segmentIndex() {
		const index = this.Extras["_cfg:SegmentIndex"];
		return index !== undefined ? index as number : 0;
	}

	/** Sets the index of segment (if has) */
	public set segmentIndex(value: number) {
		this.Extras["_cfg:SegmentIndex"] = value;
	}

	/** Sets the value of the control */
	public set value(value: any) {
		this.formRef.setValue(value);
	}

	/** Gets the value of the control */
	public get value() {
		return this.formRef.value;
	}

	private assign(options: any, control?: AppFormsControl, order?: number, alternativeName?: string) {
		control = control || new AppFormsControl();
		control.Order = (options.Order !== undefined ? options.Order : undefined) || (options.order !== undefined ? options.order : undefined) || (order !== undefined ? order : 0);
		control.Segment = options.Segment || options.segment;

		control.Name = options.Name || options.name || (alternativeName !== undefined ? `${alternativeName}_${control.Order}` : `c_${control.Order}`);
		control.Type = options.Type || options.type || "TextBox";

		control.Hidden = !!(options.Hidden || options.hidden);
		control.Required = !control.Hidden && !!(options.Required || options.required);
		control.Extras = options.Extras || options.extras || {};

		control.Validators = options.Validators;
		control.AsyncValidators = options.AsyncValidators;

		const controlOptions = options.Options || options.options;
		if (controlOptions !== undefined) {
			control.Options.Type = controlOptions.Type || controlOptions.type || "text";

			control.Options.Label = controlOptions.Label || controlOptions.label;
			const labelOptions = controlOptions.LabelOptions || controlOptions.labeloptions;
			if (labelOptions !== undefined) {
				control.Options.LabelOptions.Position = labelOptions.Position || labelOptions.position || "stacked";
				control.Options.LabelOptions.Color = labelOptions.Color || labelOptions.color;
				control.Options.LabelOptions.Css = labelOptions.Css || labelOptions.css || "";
			}

			control.Options.Description = controlOptions.Description || controlOptions.description;
			const descriptionOptions = controlOptions.DescriptionOptions || controlOptions.descriptionoptions;
			if (descriptionOptions !== undefined) {
				control.Options.DescriptionOptions.Css = descriptionOptions.Css || descriptionOptions.css || "description";
				control.Options.DescriptionOptions.Style = descriptionOptions.Style || descriptionOptions.style || "";
			}

			control.Options.PlaceHolder = controlOptions.PlaceHolder || controlOptions.placeholder;
			control.Options.Css = controlOptions.Css || controlOptions.css || "";
			control.Options.Color = controlOptions.Color || controlOptions.color;
			control.Options.Icon = controlOptions.Icon || controlOptions.icon;
			control.Options.Name = controlOptions.Name || controlOptions.name || (alternativeName !== undefined ? `${alternativeName}-${control.Name}` : `${control.Name}`);
			control.Options.ValidatePattern = controlOptions.ValidatePattern || controlOptions.validatepattern;

			control.Options.Disabled = !!(controlOptions.Disabled || controlOptions.disabled);
			control.Options.ReadOnly = !!(controlOptions.ReadOnly || controlOptions.readonly);
			control.Options.AutoFocus = !!(controlOptions.AutoFocus || controlOptions.autofocus);

			control.Options.MinValue = controlOptions.MinValue || controlOptions.minvalue;
			control.Options.MaxValue = controlOptions.MaxValue || controlOptions.maxvalue;

			control.Options.MinLength = controlOptions.MinLength || controlOptions.minlength;
			control.Options.MaxLength = controlOptions.MaxLength || controlOptions.maxlength;

			control.Options.Width = controlOptions.Width || controlOptions.width;
			control.Options.Height = controlOptions.Height || controlOptions.height;

			control.Options.TextAreaRows = controlOptions.TextAreaRows || controlOptions.textarearows;

			const selectOptions = controlOptions.SelectOptions || controlOptions.selectoptions;
			if (selectOptions !== undefined) {
				const selectValues = selectOptions.Values || selectOptions.values;
				control.Options.SelectOptions = {
					Values: AppUtility.isNotEmpty(selectValues)
						? (AppUtility.toArray(selectValues) as Array<string>).map(value => {
								return { Value: value, Label: value };
							})
						: AppUtility.isArray(selectValues, true)
							? selectValues.length > 0 && typeof selectValues[0] === "string"
								? (selectValues as Array<string>).map(value => {
										return { Value: value, Label: value };
									})
								: (selectValues as Array<any>).map(data => {
										return { Value: data.Value || data.value, Label: data.Label || data.label || data.Value || data.value };
									})
							: undefined,
					RemoteURI: selectOptions.RemoteURI || selectOptions.remoteuri,
					RemoteURIConverter: selectOptions.RemoteURIConverter || selectOptions.remoteuriconverter,
					RemoteURIProcessor: selectOptions.RemoteURIProcessor || selectOptions.remoteuriprocessor,
					Multiple: !!(selectOptions.Multiple || selectOptions.multiple),
					AsBoxes: !!(selectOptions.AsBoxes || selectOptions.asboxes),
					Interface: selectOptions.Interface || selectOptions.interface || "alert",
					InterfaceOptions: selectOptions.InterfaceOptions || selectOptions.interfaceoptions,
					CancelText: selectOptions.CancelText || selectOptions.canceltext || "{{common.buttons.cancel}}",
					OkText: selectOptions.OkText || selectOptions.oktext || "{{common.buttons.ok}}"
				};
			}

			const lookupOptions = controlOptions.LookupOptions || controlOptions.lookupoptions;
			if (lookupOptions !== undefined) {
				const handlers = lookupOptions.Handlers || lookupOptions.handlers || {};
				control.Options.LookupOptions = {
					SearchingText: lookupOptions.SearchingText || lookupOptions.searchingtext || "{{common.messages.completer.searching}}",
					NoResultsText: lookupOptions.NoResultsText || lookupOptions.noresultstext || "{{common.messages.completer.noresults}}",
					AsCompleter: lookupOptions.AsCompleter !== undefined || lookupOptions.ascompleter !== undefined ? lookupOptions.AsCompleter || lookupOptions.ascompleter : true,
					PauseMiliseconds: lookupOptions.PauseMiliseconds || lookupOptions.pausemiliseconds || 123,
					ClearSelected: !!(lookupOptions.ClearSelected || lookupOptions.clearselected),
					DataSource: lookupOptions.DataSource || lookupOptions.datasource,
					InitialValue: lookupOptions.InitialValue || lookupOptions.initialvalue,
					Handlers: {
						Initialize: handlers.Initialize || handlers.initialize,
						GetInitialValue: handlers.GetInitialValue || handlers.getinitialvalue,
						OnItemSelected: handlers.OnItemSelected || handlers.onitemselected
					}
				};
			}

			const datepickerOptions = controlOptions.DatePickerOptions || controlOptions.datepickeroptions;
			if (datepickerOptions !== undefined) {
				control.Options.DatePickerOptions = {
					AllowTimes: !!(datepickerOptions.AllowTimes || datepickerOptions.allowtimes),
					DisplayFormat: datepickerOptions.DisplayFormat || datepickerOptions.displayformat,
					PickerFormat: datepickerOptions.PickerFormat || datepickerOptions.pickerformat,
					DayNames: datepickerOptions.DayNames || datepickerOptions.daynames,
					DayShortNames: datepickerOptions.DayShortNames || datepickerOptions.dayshortnames,
					MonthNames: datepickerOptions.MonthNames || datepickerOptions.monthnames,
					MonthShortNames: datepickerOptions.MonthShortNames || datepickerOptions.monthshortnames,
					CancelText: datepickerOptions.CancelText || datepickerOptions.canceltext || "{{common.buttons.cancel}}",
					DoneText: datepickerOptions.DoneText || datepickerOptions.donetext || "{{common.buttons.done}}"
				};
			}

			const filepickerOptions = controlOptions.FilePickerOptions || controlOptions.filepickeroptions;
			if (filepickerOptions !== undefined) {
				control.Options.FilePickerOptions = {
					Accept: filepickerOptions.Accept || filepickerOptions.accept,
					AllowMultiple: !!(filepickerOptions.AllowMultiple || filepickerOptions.allowmultiple),
					AllowPreview: !!(filepickerOptions.AllowPreview || filepickerOptions.allowpreview),
					AllowDelete: !!(filepickerOptions.AllowDelete || filepickerOptions.allowdelete),
					Handlers: filepickerOptions.Handlers || filepickerOptions.handlers,
				};
			}
		}

		const subControls = options.SubControls || options.subcontrols;
		if (subControls !== undefined) {
			const subConfig = subControls.Controls || subControls.controls;
			if (AppUtility.isArray(subConfig, true)) {
				control.SubControls = {
					AsArray: !!(subControls.AsArray || subControls.asarray),
					Controls: (subConfig as Array<any>).map((suboptions, suborder) => this.assign(suboptions, undefined, suborder, control.Name)).sort(AppUtility.getCompareFunction("Order"))
				};
				if (control.SubControls.Controls.length < 1) {
					control.SubControls = undefined;
				}
				else {
					control.SubControls.Controls.forEach((subcontrol, suborder) => subcontrol.Order = suborder);
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
		options.Options.LookupOptions.DataSource = this.Options.LookupOptions.DataSource;
		options.Options.LookupOptions.Handlers = this.Options.LookupOptions.Handlers;
		options.Options.FilePickerOptions.Handlers = this.Options.FilePickerOptions.Handlers;
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

/** Presents the settings of a segment (means a tab that contains group of controls) in the dynamic forms */
export class AppFormsSegment {

	constructor(
		name?: string,
		label?: string,
		icon?: string
	) {
		this.Name = name || "";
		this.Label = label || "";
		this.Icon = icon;
	}

	Name: string;
	Label: string;
	Icon: string;
}

/** Provides the servicing operations of the dynamic forms */
@Injectable()
export class AppFormsService {

	constructor(
		private translateSvc: TranslateService,
		private configSvc: ConfigurationService,
		private loadingController: LoadingController,
		private alertController: AlertController,
		private actionsheetController: ActionSheetController,
		private modalController: ModalController,
		private toastController: ToastController
	) {
	}

	private _loading: any;
	private _actionsheet: any;
	private _modal: any;
	private _alert: any;
	private _toast: any;
	private _types = {
		text: ["text", "password", "email", "search", "tel", "url"],
		datetime: ["date", "datetime", "datetime-local"]
	};
	private _metaCounties: {
		[key: string]: Array<{ County: string, Province: string, Country: string, Title: string, TitleANSI: string}>
	} = {};

	private async normalizeResourceAsync(resource: string) {
		return AppUtility.isNotEmpty(resource) && resource.startsWith("{{") && resource.endsWith("}}")
			? await this.getResourceAsync(resource.substr(2, resource.length - 4).trim())
			: resource;
	}

	private async prepareControlsAsync(controls: Array<AppFormsControl>, modifyDatePickers?: boolean) {
		controls.forEach((control, index) => {
			if (index < controls.length - 1) {
				control.next = controls[index + 1];
			}
		});
		await Promise.all(controls.filter(control => !control.Hidden).map(async control => {
			control.Options.Label = await this.normalizeResourceAsync(control.Options.Label);
			control.Options.Description = await this.normalizeResourceAsync(control.Options.Description);
			control.Options.PlaceHolder = await this.normalizeResourceAsync(control.Options.PlaceHolder);
			if (control.Type === "Select") {
				if (AppUtility.isArray(control.Options.SelectOptions.Values, true)) {
					await Promise.all(control.Options.SelectOptions.Values.map(async selectValue => {
						selectValue.Value = await this.normalizeResourceAsync(selectValue.Value);
						selectValue.Label = await this.normalizeResourceAsync(selectValue.Label);
					}));
				}
				else if (AppUtility.isNotEmpty(control.Options.SelectOptions.RemoteURI)) {
					let uri = AppXHR.getURI(control.Options.SelectOptions.RemoteURI);
					uri += (uri.indexOf("?") < 0 ? "?" : "&") + AppConfig.getRelatedQuery();
					try {
						if (control.Options.SelectOptions.RemoteURIProcessor !== undefined) {
							control.Options.SelectOptions.Values = await control.Options.SelectOptions.RemoteURIProcessor(uri, control.Options.SelectOptions.RemoteURIConverter);
						}
						else {
							const values = uri.indexOf("discovery/definitions?") > 0
								? await this.configSvc.fetchDefinitionAsync(uri)
								: await AppXHR.sendRequestAsync("GET", uri);
							control.Options.SelectOptions.Values = AppUtility.isArray(values, true)
								? (values as Array<string>).length > 0 && typeof values[0] === "string"
									? (values as Array<string>).map(value => {
											return { Value: value, Label: value };
										})
									: (values as Array<any>).map(data => {
											return control.Options.SelectOptions.RemoteURIConverter !== undefined
												? control.Options.SelectOptions.RemoteURIConverter(data)
												: { Value: data.Value || data.value, Label: data.Label || data.label || data.Value || data.value };
										})
								: AppUtility.isNotEmpty(values)
									? (AppUtility.toArray(values) as Array<string>).map(value => {
											return { Value: value, Label: value };
										})
									: [];
						}
					}
					catch (error) {
						console.error("[Forms]: Error occurred while preparing the selecting values from a remote URI", error);
						control.Options.SelectOptions.Values = [];
					}
					await Promise.all(control.Options.SelectOptions.Values.map(async selectValue => {
						selectValue.Value = await this.normalizeResourceAsync(selectValue.Value);
						selectValue.Label = await this.normalizeResourceAsync(selectValue.Label);
					}));
				}
				control.Options.SelectOptions.OkText = await this.normalizeResourceAsync(control.Options.SelectOptions.OkText);
				control.Options.SelectOptions.CancelText = await this.normalizeResourceAsync(control.Options.SelectOptions.CancelText);
			}
			else if (control.Type === "Lookup") {
				control.Options.LookupOptions.SearchingText = await this.normalizeResourceAsync(control.Options.LookupOptions.SearchingText);
				control.Options.LookupOptions.NoResultsText = await this.normalizeResourceAsync(control.Options.LookupOptions.NoResultsText);
			}
			else if (control.Type === "DatePicker") {
				if (AppUtility.isTrue(modifyDatePickers)) {
					control.Type = "TextBox";
					control.Options.Type = control.Options.DatePickerOptions.AllowTimes ? "datetime-local" : "date";
				}
				else  {
					control.Options.DatePickerOptions.DayNames = await this.normalizeResourceAsync(control.Options.DatePickerOptions.DayNames);
					control.Options.DatePickerOptions.DayShortNames = await this.normalizeResourceAsync(control.Options.DatePickerOptions.DayShortNames);
					control.Options.DatePickerOptions.MonthNames = await this.normalizeResourceAsync(control.Options.DatePickerOptions.MonthNames);
					control.Options.DatePickerOptions.MonthShortNames = await this.normalizeResourceAsync(control.Options.DatePickerOptions.MonthShortNames);
					control.Options.DatePickerOptions.DoneText = await this.normalizeResourceAsync(control.Options.DatePickerOptions.DoneText);
					control.Options.DatePickerOptions.CancelText = await this.normalizeResourceAsync(control.Options.DatePickerOptions.CancelText);
				}
			}
			if (control.SubControls !== undefined) {
				await this.prepareControlsAsync(control.SubControls.Controls, modifyDatePickers);
				control.SubControls.Controls.forEach(subcontrol => subcontrol.parent = control);
			}
		}));
	}

	private prepareControls(controls: Array<AppFormsControl>, modifyDatePickers?: boolean) {
		this.prepareControlsAsync(controls, modifyDatePickers);
	}

	/** Gets the definition of all controls */
	public getControls(config: Array<any> = [], controls?: Array<AppFormsControl>, segments?: { items: Array<AppFormsSegment>, default: string, current: string }) {
		controls = controls || new Array<AppFormsControl>();
		config.map((options, order) => {
			const control = new AppFormsControl(options, order);
			if (segments !== undefined && segments.items !== undefined && segments.items.length > 0) {
				if (control.Segment === undefined) {
					control.Segment = segments.default !== undefined && segments.items.findIndex(segment => segment.Name === segments.default) > -1
						? segments.default
						: segments.items[0].Name;
				}
				const segmentIndex = segments.items.findIndex(segment => segment.Name === control.Segment);
				control.Segment = segmentIndex < 0 ? segments.items[0].Name : control.Segment;
				control.segmentIndex = segmentIndex < 0 ? 0 : segmentIndex;
			}
			return control;
		})
		.sort(AppUtility.getCompareFunction("segmentIndex", "Order"))
		.forEach((control, order) => {
			control.Order = order;
			controls.push(control);
		});
		this.prepareControls(controls, !AppConfig.isNativeApp && AppConfig.app.platform.startsWith("Desktop") && !PlatformUtility.isSafari());
		return controls;
	}

	/** Updates the definition of all controls */
	public updateControls(controls: Array<AppFormsControl> = [], value: any = {}) {
		controls.forEach((control, order) => control.Order = order);
		controls.filter(control => control.SubControls !== undefined).forEach(control => {
			if (control.SubControls.AsArray) {
				const values = value[control.Name] as Array<any>;
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
				this.updateControls(control.SubControls.Controls, value[control.Name]);
			}
		});
	}

	/** Builds the form */
	public buildForm(form: FormGroup, controls: Array<AppFormsControl> = [], value?: any, validators?: Array<ValidatorFn>, asyncValidators?: Array<AsyncValidatorFn>) {
		this.getFormGroup(controls, form, validators, asyncValidators);
		if (value !== undefined) {
			this.updateControls(controls, value);
			this.prepareControls(controls, !AppConfig.isNativeApp && AppConfig.app.platform.startsWith("Desktop") && !PlatformUtility.isSafari());
			form.patchValue(value);
		}
		else {
			this.prepareControls(controls, !AppConfig.isNativeApp && AppConfig.app.platform.startsWith("Desktop") && !PlatformUtility.isSafari());
		}
	}

	private getFormGroup(controls: Array<AppFormsControl>, formGroup?: FormGroup, validators?: Array<ValidatorFn>, asyncValidators?: Array<AsyncValidatorFn>) {
		formGroup = formGroup || new FormGroup({}, validators, asyncValidators);
		controls.forEach(control => {
			if (control.SubControls === undefined && control.Type === "Lookup" && control.Options.LookupOptions.AsCompleter && control.Options.Type === "Address") {
				const options = control.copy();
				["County", "Province", "Country"].forEach(name => formGroup.addControl(name, this.getFormControl(new AppFormsControl(options))));
			}
			else {
				const formControl = control.SubControls === undefined
					? this.getFormControl(control)
					: control.SubControls.AsArray
						? this.getFormArray(control, this.getValidators(control), this.getAsyncValidators(control))
						: this.getFormGroup(control.SubControls.Controls, undefined, this.getValidators(control), this.getAsyncValidators(control));
				formGroup.addControl(control.Name, formControl);
			}
		});
		return formGroup;
	}

	private getFormArray(control: AppFormsControl, validators?: Array<ValidatorFn>, asyncValidators?: Array<AsyncValidatorFn>) {
		const formArray = new FormArray([], validators, asyncValidators);
		control.SubControls.Controls.forEach(subcontrol => {
			if (subcontrol.SubControls === undefined && subcontrol.Type === "Lookup" && control.Options.LookupOptions.AsCompleter && subcontrol.Options.Type === "Address") {
				const options = subcontrol.copy();
				const formGroup = new FormGroup({}, this.getValidators(subcontrol), this.getAsyncValidators(subcontrol));
				["County", "Province", "Country"].forEach(name => formGroup.addControl(name, this.getFormControl(new AppFormsControl(options))));
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
		return new FormControl("", this.getValidators(control), this.getAsyncValidators(control));
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

		if (this._types.text.findIndex(type => type === control.Options.Type) > -1) {
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
		else if (this._types.datetime.findIndex(type => type === control.Options.Type) > -1) {
			if (control.Options.MinValue !== undefined) {
				validators.push(this.minDate(control.Options.MinValue));
			}
			if (control.Options.MaxValue !== undefined) {
				validators.push(this.maxDate(control.Options.MaxValue));
			}
		}
		else if ("number" === control.Options.Type) {
			if (control.Options.MinValue !== undefined) {
				validators.push(Validators.min(+control.Options.MinValue));
			}
			if (control.Options.MaxValue !== undefined) {
				validators.push(Validators.max(+control.Options.MaxValue));
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
		Object.keys(form.controls).forEach(key => delete form.controls[key]);
		this.buildForm(form, controls, value);
	}

	/** Highlights all invalid controls (by mark as dirty on all invalid controls) and set focus into first invalid control */
	public highlightInvalids(form: FormGroup) {
		const control = this.highlightInvalidsFormGroup(form, form["_controls"] as Array<AppFormsControl>);
		if (control !== undefined) {
			console.warn(`[Forms]: Invalid => ${control.Name}`);
			control.focus();
		}
	}

	private highlightInvalidsFormGroup(formGroup: FormGroup, controls: Array<AppFormsControl>) {
		let first: AppFormsControl;
		Object.keys(formGroup.controls).forEach(key => {
			const formControl = formGroup.controls[key];
			if (formControl.invalid) {
				const control = controls.find(ctrl => ctrl.Name === key);
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
		while (next !== undefined && next.Hidden) {
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
			if (originalControl !== undefined && confirmControl !== undefined && !AppUtility.isEquals(originalControl.value, confirmControl.value)) {
				confirmControl.setErrors({ notEquivalent: true });
				return { notEquivalent: true };
			}
			return null;
		};
	}

	/** Checks value of the control is equal with other control value or not */
	public isEquals(other: string): ValidatorFn {
		return (formControl: AbstractControl): { [key: string]: any } | null => {
			const otherControl = formControl.parent instanceof FormGroup
				? (formControl.parent as FormGroup).controls[other]
				: undefined;
			if (otherControl !== undefined && !AppUtility.isEquals(otherControl.value, formControl.value)) {
				formControl.setErrors({ notEquivalent: true });
				return { notEquivalent: true };
			}
			return null;
		};
	}

	/** Checks value of the date control is greater or equal a specific value */
	public minDate(date: string): ValidatorFn {
		return (formControl: AbstractControl): { [key: string]: any } | null => {
			if (date !== undefined && formControl.value !== undefined && new Date(formControl.value) < new Date(date)) {
				formControl.setErrors({ lessThan: true });
				return { lessThan: true };
			}
			return null;
		};
	}

	/** Checks value of the date control is less than or equal a specific value */
	public maxDate(date: string): ValidatorFn {
		return (formControl: AbstractControl): { [key: string]: any } | null => {
			if (date !== undefined && formControl.value !== undefined && new Date(formControl.value) > new Date(date)) {
				formControl.setErrors({ greater: true });
				return { greater: true };
			}
			return null;
		};
	}

	/** Gets the listing of meta counties of a specified country */
	public getMetaCounties(country?: string) {
		country = country || AppConfig.geoMeta.country;
		if (this._metaCounties[country] === undefined && AppConfig.geoMeta.provinces[country] !== undefined) {
			const counties = new Array<{
				County: string,
				Province: string,
				Country: string,
				Title: string,
				TitleANSI: string
			}>();
			const provinces = AppConfig.geoMeta.provinces[country].provinces || [];
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

	/** Gets the resource of current language by a key */
	public getResourceAsync(key: string, interpolateParams?: object) {
		return this.translateSvc.get(key, interpolateParams).toPromise<string>();
	}

	/** Shows the loading */
	public async showLoadingAsync(message?: string) {
		await this.hideLoadingAsync();
		this._loading = await this.loadingController.create({
			message: message || await this.getResourceAsync("common.messages.loading")
		});
		await this._loading.present();
	}

	/** Hides the loading */
	public async hideLoadingAsync(onNext?: () => void) {
		if (this._loading !== undefined) {
			await this._loading.dismiss();
			this._loading = undefined;
		}
		if (onNext !== undefined) {
			onNext();
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
		await this.hideLoadingAsync();
		if (AppUtility.isFalse(dontAddCancelButton)) {
			buttons.push(this.getActionSheetButton(await this.getResourceAsync("common.buttons.cancel"), "close", async () => await this.hideActionSheetAsync(), "cancel"));
		}
		if (AppConfig.isRunningOnIOS) {
			buttons.forEach(button => button.icon = undefined);
		}
		this._actionsheet = await this.actionsheetController.create({
			buttons: buttons,
			backdropDismiss: backdropDismiss
		});
		await this._actionsheet.present();
	}

	/** Hides the action sheet */
	public async hideActionSheetAsync(onNext?: () => void) {
		if (this._actionsheet !== undefined) {
			await this._actionsheet.dismiss();
			this._actionsheet = undefined;
		}
		if (onNext !== undefined) {
			onNext();
		}
	}

	/** Shows the alert/confirmation box  */
	public async showAlertAsync(header: string = null, subHeader: string = null, message: string, postProcess: (data?: any) => void = () => {}, okButtonText: string = null, cancelButtonText: string = null, inputs: Array<any> = null) {
		await this.hideLoadingAsync(async () => await this.hideAlertAsync());
		const buttons = AppUtility.isNotEmpty(cancelButtonText)
			? [{ text: cancelButtonText, role: "cancel", handler: async (data?: any) => await this.hideAlertAsync() }]
			: [];
		buttons.push({
			text: okButtonText || await this.getResourceAsync("common.buttons.ok"),
			role: undefined as string,
			handler: async (data?: any) => {
				postProcess(data);
				await this.hideAlertAsync();
			}
		});
		this._alert = await this.alertController.create({
			header: header || await this.getResourceAsync("common.alert.header.general"),
			subHeader: subHeader,
			backdropDismiss: false,
			message: message,
			inputs: AppUtility.isArray(inputs, true) ? inputs : undefined,
			buttons: buttons
		});
		await this._alert.present();
	}

	/** Hides the alert/confirmation sheet */
	public async hideAlertAsync(onNext?: () => void) {
		if (this._alert !== undefined) {
			await this._alert.dismiss();
			this._alert = undefined;
		}
		if (onNext !== undefined) {
			onNext();
		}
	}

	/** Shows the error message (by the alert confirmation box) */
	public async showErrorAsync(error: any, subHeader?: string, postProcess?: (data?: any) => void) {
		const message = AppUtility.isGotWrongAccountOrPasswordException(error)
			? await this.getResourceAsync("common.messages.errors.wrongAccountOrPassword")
			: AppUtility.isGotCaptchaException(error) || AppUtility.isGotOTPException(error)
				? await this.getResourceAsync("common.messages.errors.wrongCaptcha")
				: AppUtility.isNotEmpty(error.Message) ? error.Message : await this.getResourceAsync("common.messages.errors.general");
		await this.showAlertAsync(await this.getResourceAsync("common.alert.header.error"), subHeader, message, postProcess);
	}

	/** Shows the modal box */
	public async showModalAsync(component: any) {
		await this.hideLoadingAsync(async () => await this.hideModalAsync());
		this._modal = await this.modalController.create({
			component: component,
			backdropDismiss: false
		});
		await this._modal.present();
	}

	/** Hides the modal box */
	public async hideModalAsync(onNext?: () => void) {
		if (this._modal !== undefined) {
			await this._modal.dismiss();
			this._modal = undefined;
		}
		if (onNext !== undefined) {
			onNext();
		}
	}

	/** Shows the toast alert message */
	public async showToastAsync(message: string, duration: number = 1000, showCloseButton: boolean = false, closeButtonText: string = "close", atBottom: boolean = false) {
		await this.hideToastAsync();
		this._toast = await this.toastController.create({
			animated: true,
			message: message,
			duration: duration < 1 ? 1000 : duration,
			position: atBottom ? "bottom" : "top",
			buttons: showCloseButton && AppUtility.isNotEmpty(closeButtonText) ? [{ text: closeButtonText, role: "cancel" }] : []
		});
		await this._toast.present();
	}

	/** Hides the toast alert message */
	public async hideToastAsync(onNext?: () => void) {
		if (this._toast !== undefined) {
			await this._toast.dismiss();
			this._toast = undefined;
		}
		if (onNext !== undefined) {
			onNext();
		}
	}

}
