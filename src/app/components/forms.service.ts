import { Injectable } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, FormArray } from "@angular/forms";
import { Validators, ValidatorFn, AsyncValidatorFn } from "@angular/forms";
import { LoadingController, AlertController, ActionSheetController, ModalController, ToastController } from "@ionic/angular";
import { TranslateService } from "@ngx-translate/core";
import { CompleterData } from "ng2-completer";
import { AppXHR } from "@components/app.apis";
import { AppUtility } from "@components/app.utility";
import { PlatformUtility } from "@components/app.utility.platform";
import { AppFormsControlComponent } from "@components/forms.control.component";
import { AppFormsViewComponent } from "@components/forms.view.component";
import { ConfigurationService } from "@services/configuration.service";
import { AppConfig } from "../app.config";

/** Presents the settings of a segment (means a tab that contains group of controls) in the dynamic forms */
export class AppFormsSegment {

	constructor(
		name?: string,
		label?: string,
		icon?: string
	) {
		this.name = name || "";
		this.label = label || "";
		this.icon = icon;
	}

	private name: string;
	private label: string;
	private icon: string;

	/** Gets the name of the segment */
	get Name() {
		return this.name;
	}

	/** Gets the lable of the segment */
	get Label() {
		return this.label;
	}

	/** Gets the icon name of the segment */
	get Icon() {
		return this.icon;
	}

}

//  ---------------------------------------------------------------

/** Presents a value for working with lookup in the dynamic forms */
export interface AppFormsLookupValue {
	Value: string;
	Label: string;
	Description?: string;
	Image?: string;
	Extras?: { [key: string]: any };
	Children?: Array<AppFormsLookupValue>;
}

//  ---------------------------------------------------------------

/** Presents the icon options of a control in the dynamic forms */
export interface AppFormsControlIconOptionsConfig {
	Name?: string;
	Fill?: string;
	Color?: string;
	Slot?: string;
	OnClick?: (event: Event, control: AppFormsControlComponent | AppFormsViewComponent) => void;
}

//  ---------------------------------------------------------------

/** Presents the select options of a control in the dynamic forms */
export interface AppFormsControlSelectOptionsConfig {
	Values?: string | Array<string> | Array<AppFormsLookupValue>;
	RemoteURI?: string;
	RemoteURIConverter?: (data: any) => AppFormsLookupValue;
	RemoteURIProcessor?: (uri: string, converter?: (data: any) => AppFormsLookupValue) => Promise<Array<AppFormsLookupValue>>;
	Multiple?: boolean;
	AsBoxes?: boolean;
	Interface?: string;
	InterfaceOptions?: any;
	OkText?: string;
	CancelText?: string;
}

//  ---------------------------------------------------------------

/** Presents the lookup options of a control in the dynamic forms */
export interface AppFormsControlLookupOptionsConfig {
	Multiple?: boolean;
	OnDelete?: (data: Array<string>, control: AppFormsControlComponent) => void;
	WarningOnDelete?: string;
	AsModal?: boolean;
	ModalOptions?: {
		Component?: any;
		ComponentProps?: { [key: string]: any };
		BackdropDismiss?: boolean;
		SwipeToClose?: boolean
		OnDismiss?: (data?: any, control?: AppFormsControlComponent) => void;
	};
	AsCompleter?: boolean;
	CompleterOptions?: {
		SearchingText?: string;
		NoResultsText?: string;
		PauseMiliseconds?: number;
		ClearSelected?: boolean;
		DataSource?: CompleterData;
		InitialValue?: any;
		GetInitialValue?: (control: AppFormsControlComponent) => any;
		OnInitialized?: (control: AppFormsControlComponent) => void;
		OnSelected?: (data: any, control: AppFormsControlComponent) => void;
		AllowLookupByModal?: boolean;
	};
	AsSelector?: boolean;
	SelectorOptions?: {
		HeaderText?: string;
		OkText?: string;
		CancelText?: string;
		OnAdd?: (control?: AppFormsControlComponent) => void;
	};
}

//  ---------------------------------------------------------------

/** Presents the date-picker options of a control in the dynamic forms */
export interface AppFormsControlDatePickerOptionsConfig {
	AllowTimes?: boolean;
	DisplayFormat?: string;
	PickerFormat?: string;
	DayNames?: string;
	DayShortNames?: string;
	MonthNames?: string;
	MonthShortNames?: string;
	DoneText?: string;
	CancelText?: string;
	AllowDelete?: boolean;
}

//  ---------------------------------------------------------------

/** Presents the file-picker options of a control in the dynamic forms */
export interface AppFormsControlFilePickerOptionsConfig {
	Accept?: string;
	Multiple?: boolean;
	AllowSelect?: boolean;
	AllowPreview?: boolean;
	AllowDelete?: boolean;
	OnDelete?: (name: string, control: AppFormsControlComponent) => void;
	WarningOnDelete?: string;
}

//  ---------------------------------------------------------------

/** Presents the range options of a control in the dynamic forms */
export interface AppFormsControlRangeOptionsConfig {
	AllowPin?: boolean;
	AllowSnaps?: boolean;
	AllowDualKnobs?: boolean;
	AllowTicks?: boolean;
	Step?: number;
	Icons?: {
		Start?: string;
		End?: string;
	};
}

//  ---------------------------------------------------------------

/** Presents the button options of a control in the dynamic forms */
export interface AppFormsControlButtonOptionsConfig {
	OnClick?: (event: Event, control: AppFormsControl) => void;
	Fill?: string;
	Color?: string;
	Icon?: {
		Name?: string;
		Slot?: string;
	};
}

//  ---------------------------------------------------------------

/** Presents the options of a control in the dynamic forms */
export interface AppFormsControlOptionsConfig {
	Label?: string;
	LabelOptions?: {
		Position?: string;
		Color?: string;
		Css?: string;
	};
	Description?: string;
	DescriptionOptions?: {
		Css?: string;
		Style?: string;
	};
	Type?: string;
	Name?: string;
	Css?: string;
	Color?: string;
	PlaceHolder?: string;
	ValidatePattern?: string;
	Disabled?: boolean;
	ReadOnly?: boolean;
	AutoFocus?: boolean;
	MinValue?: any;
	MaxValue?: any;
	MinLength?: number;
	MaxLength?: number;
	Width?: string;
	Height?: string;
	Rows?: number;
	Icon?: AppFormsControlIconOptionsConfig;
	SelectOptions?: AppFormsControlSelectOptionsConfig;
	LookupOptions?: AppFormsControlLookupOptionsConfig;
	DatePickerOptions?: AppFormsControlDatePickerOptionsConfig;
	FilePickerOptions?: AppFormsControlFilePickerOptionsConfig;
	RangeOptions?: AppFormsControlRangeOptionsConfig;
	ButtonOptions?: AppFormsControlButtonOptionsConfig;
	OnAfterViewInit?: (control: AppFormsControlComponent | AppFormsViewComponent) => void;
	OnFocus?: (event: Event, control: AppFormsControlComponent) => void;
	OnKeyUp?: (event: KeyboardEvent, control: AppFormsControlComponent) => void;
	OnBlur?: (event: Event, control: AppFormsControlComponent) => void;
	OnChanged?: (event: any, control: AppFormsControlComponent) => void;
}

//  ---------------------------------------------------------------

/** Presents the configuration of a control in the dynamic forms */
export interface AppFormsControlConfig {
	Name?: string;
	Order?: number;
	Segment?: string;
	Type?: string;
	Hidden?: boolean;
	Required?: boolean;
	Validators?: Array<ValidatorFn> | Array<string>;
	AsyncValidators?: Array<AsyncValidatorFn> | Array<string>;
	Extras?: { [key: string]: any };
	Options?: AppFormsControlOptionsConfig;
	SubControls?: {
		AsArray?: boolean;
		Controls?: Array<AppFormsControlConfig>
	};
}

//  ---------------------------------------------------------------

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

	Name: string;
	Order: number;
	Segment: string;
	Type: string;
	Hidden: boolean;
	Required: boolean;
	Validators: Array<ValidatorFn> | Array<string>;
	AsyncValidators: Array<AsyncValidatorFn> | Array<string>;
	Extras: { [key: string]: any };
	Options = {
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
		Type: "text",
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
		Rows: undefined as number,
		OnAfterViewInit: undefined as (control: AppFormsControlComponent | AppFormsViewComponent) => void,
		OnFocus: undefined as (event: Event, control: AppFormsControlComponent) => void,
		OnKeyUp: undefined as (event: KeyboardEvent, control: AppFormsControlComponent) => void,
		OnBlur: undefined as (event: Event, control: AppFormsControlComponent) => void,
		OnChanged: undefined as (event: any, control: AppFormsControlComponent) => void,
		Icon: {
			Name: undefined as string,
			Fill: undefined as string,
			Color: undefined as string,
			Slot: undefined as string,
			OnClick: undefined as (event: Event, control: AppFormsControlComponent | AppFormsViewComponent) => void
		},
		SelectOptions: {
			Values: undefined as Array<AppFormsLookupValue>,
			RemoteURI: undefined as string,
			RemoteURIConverter: undefined as (data: any) => AppFormsLookupValue,
			RemoteURIProcessor: undefined as (uri: string, converter?: (data: any) => AppFormsLookupValue) => Promise<Array<AppFormsLookupValue>>,
			Multiple: false,
			AsBoxes: false,
			Interface: "alert",
			InterfaceOptions: undefined as any,
			OkText: "{{common.buttons.ok}}",
			CancelText: "{{common.buttons.cancel}}"
		},
		LookupOptions: {
			Multiple: false,
			OnDelete: undefined as (data: Array<string>, control: AppFormsControlComponent) => void,
			WarningOnDelete: undefined as string,
			AsModal: true,
			ModalOptions: {
				Component: undefined as any,
				ComponentProps: undefined as { [key: string]: any },
				BackdropDismiss: false,
				SwipeToClose: false,
				OnDismiss: undefined as (data?: any, control?: AppFormsControlComponent) => void
			},
			AsCompleter: false,
			CompleterOptions: {
				SearchingText: "{{common.messages.completer.searching}}",
				NoResultsText: "{{common.messages.completer.noresults}}",
				PauseMiliseconds: 234,
				ClearSelected: false,
				DataSource: undefined as CompleterData,
				InitialValue: undefined as any,
				GetInitialValue: undefined as (control: AppFormsControlComponent) => any,
				OnInitialized: undefined as (control: AppFormsControlComponent) => void,
				OnSelected: undefined as (data: any, control: AppFormsControlComponent) => void,
				AllowLookupByModal: false
			},
			AsSelector: false,
			SelectorOptions: {
				HeaderText: undefined as string,
				OkText: "{{common.buttons.ok}}",
				CancelText: "{{common.buttons.cancel}}",
				OnAdd: undefined as (control: AppFormsControlComponent) => void
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
			DoneText: "{{common.buttons.done}}",
			CancelText: "{{common.buttons.cancel}}",
			AllowDelete: true
		},
		FilePickerOptions: {
			Accept: "*",
			Multiple: true,
			AllowSelect: true,
			AllowPreview: false,
			AllowDelete: true,
			OnDelete: undefined as (name: string, control: AppFormsControlComponent) => void,
			WarningOnDelete: undefined as string
		},
		RangeOptions: {
			AllowPin: true,
			AllowSnaps: false,
			AllowDualKnobs: false,
			AllowTicks: true,
			Step: 1,
			Icons: {
				Start: undefined as string,
				End: undefined as string
			}
		},
		ButtonOptions: {
			OnClick: undefined as (event: Event, control: AppFormsControl) => void,
			Fill: "solid",
			Color: undefined as string,
			Icon: {
				Name: undefined as string,
				Slot: undefined as string
			}
		}
	};
	SubControls: {
		AsArray: boolean;
		Controls: Array<AppFormsControl>
	};

	/** Gets uri of the captcha image */
	public get captchaURI() {
		return this.Extras["_captchaURI"];
	}

	/** Sets uri of the captcha image */
	public set captchaURI(value: string) {
		this.Extras["_captchaURI"] = value;
	}

	/** Gets the reference to the UI element */
	public get elementRef() {
		return this.Extras["_elementRef"];
	}

	/** Sets the reference to the UI element */
	public set elementRef(value: any) {
		this.Extras["_elementRef"] = value;
	}

	/** Gets the reference to the form control */
	public get formControlRef() {
		return this.Extras["_formRef"];
	}

	/** Sets the reference to the form control */
	public set formControlRef(value: AbstractControl) {
		this.Extras["_formRef"] = value;
	}

	/** Gets the reference to the form control component */
	public get controlRef() {
		return this.Extras["_controlRef"];
	}

	/** Sets the reference to the form control component */
	public set controlRef(value: AppFormsControlComponent) {
		this.Extras["_controlRef"] = value;
	}

	/** Gets the reference to the next sibling */
	public get next() {
		return this.Extras["_nextControl"];
	}

	/** Sets the reference to the next sibling */
	public set next(value: AppFormsControl) {
		this.Extras["_nextControl"] = value;
	}

	/** Gets the reference to the parent sibling */
	public get parent() {
		return this.Extras["_parentControl"];
	}

	/** Sets the reference to the parent sibling */
	public set parent(value: AppFormsControl) {
		this.Extras["_parentControl"] = value;
	}

	/** Gets the index of segment (if has) */
	public get segmentIndex() {
		const index = this.Extras["_segmentIndex"];
		return index !== undefined ? index as number : 0;
	}

	/** Sets the index of segment (if has) */
	public set segmentIndex(value: number) {
		this.Extras["_segmentIndex"] = value;
	}

	/** Gets the value of the control */
	public get value() {
		return AppUtility.isEquals(this.Type, "Text")
			? this.Extras["Text"] || this.Extras["text"] || this.Extras["_value"]
			: this.formControlRef !== undefined ? this.formControlRef.value : this.Extras["_value"];
	}

	/** Sets the value of the control */
	public set value(value: any) {
		if (this.formControlRef !== undefined) {
			this.formControlRef.setValue(value, { onlySelf: true });
		}
		else {
			this.Extras["_value"] = value;
		}
	}

	private assign(options: any, control?: AppFormsControl, order?: number, alternativeName?: string) {
		options = options || {};
		control = control || new AppFormsControl();
		control.Order = (options.Order !== undefined ? options.Order : undefined) || (options.order !== undefined ? options.order : undefined) || (order !== undefined ? order : 0);
		control.Segment = options.Segment || options.segment;

		control.Name = options.Name || options.name || (alternativeName !== undefined ? `${alternativeName}_${control.Order}` : `c_${control.Order}`);
		control.Type = options.Type || options.type || "TextBox";

		control.Hidden = !!(options.Hidden || options.hidden);
		control.Required = !control.Hidden && !!(options.Required || options.required);
		control.Extras = options.Extras || options.extras || {};

		control.Validators = options.Validators || options.validators;
		control.AsyncValidators = options.AsyncValidators || options.asyncValidators || options.asyncvalidators;

		const controlOptions = options.Options || options.options;
		if (controlOptions !== undefined) {
			control.Options.Label = controlOptions.Label || controlOptions.label;
			const labelOptions = controlOptions.LabelOptions || controlOptions.labeloptions;
			if (labelOptions !== undefined) {
				control.Options.LabelOptions.Position = labelOptions.Position || labelOptions.position || "stacked";
				control.Options.LabelOptions.Color = labelOptions.Color || labelOptions.color;
				control.Options.LabelOptions.Css = labelOptions.Css || labelOptions.css || "";
			}

			control.Options.Description = controlOptions.Description || controlOptions.description;
			const descriptionOptions = controlOptions.DescriptionOptions || controlOptions.descriptionOptions || controlOptions.descriptionoptions;
			if (descriptionOptions !== undefined) {
				control.Options.DescriptionOptions.Css = descriptionOptions.Css || descriptionOptions.css || "description";
				control.Options.DescriptionOptions.Style = descriptionOptions.Style || descriptionOptions.style || "";
			}

			control.Options.Type = controlOptions.Type || controlOptions.type || "text";
			control.Options.Name = controlOptions.Name || controlOptions.name || (alternativeName !== undefined ? `${alternativeName}-${control.Name}` : `${control.Name}`);
			control.Options.Css = controlOptions.Css || controlOptions.css || "";
			control.Options.Color = controlOptions.Color || controlOptions.color;
			control.Options.PlaceHolder = controlOptions.PlaceHolder || controlOptions.placeHolder || controlOptions.placeholder;
			control.Options.ValidatePattern = controlOptions.ValidatePattern || controlOptions.validatePattern || controlOptions.validatepattern;

			control.Options.Disabled = !!(controlOptions.Disabled || controlOptions.disabled);
			control.Options.ReadOnly = !!(controlOptions.ReadOnly || controlOptions.readOnly || controlOptions.readonly);
			control.Options.AutoFocus = !!(controlOptions.AutoFocus || controlOptions.autoFocus || controlOptions.autofocus);

			control.Options.MinValue = controlOptions.MinValue || controlOptions.minValue || controlOptions.minvalue;
			control.Options.MaxValue = controlOptions.MaxValue || controlOptions.maxValue || controlOptions.maxvalue;

			control.Options.MinLength = controlOptions.MinLength || controlOptions.minLength || controlOptions.minlength;
			control.Options.MaxLength = controlOptions.MaxLength || controlOptions.maxLength || controlOptions.maxlength;

			control.Options.Width = controlOptions.Width || controlOptions.width;
			control.Options.Height = controlOptions.Height || controlOptions.height;
			control.Options.Rows = controlOptions.Rows || controlOptions.rows;

			control.Options.OnAfterViewInit = controlOptions.OnAfterViewInit || controlOptions.onAfterViewInit || controlOptions.onafterviewinit;
			control.Options.OnFocus = controlOptions.OnFocus || controlOptions.onFocus || controlOptions.onfocus;
			control.Options.OnKeyUp = controlOptions.OnKeyUp || controlOptions.onKeyUp || controlOptions.onkeyup;
			control.Options.OnBlur = controlOptions.OnBlur || controlOptions.onBlur || controlOptions.onblur;
			control.Options.OnChanged = controlOptions.OnChanged || controlOptions.onChanged || controlOptions.onchanged;

			let icon = controlOptions.Icon || controlOptions.icon;
			if (icon !== undefined) {
				control.Options.Icon = {
					Name: icon.Name || icon.name,
					Fill: icon.Fill || icon.fill,
					Color: icon.Color || icon.color,
					Slot: icon.Slot || icon.slot,
					OnClick: icon.OnClick || icon.onClick || icon.onclick,
				};
			}

			const selectOptions = controlOptions.SelectOptions || controlOptions.selectOptions || controlOptions.selectoptions;
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
										return { Value: data.Value || data.value, Label: data.Label || data.label || data.Value || data.value, Description: data.Description || data.description };
									})
							: [],
					RemoteURI: selectOptions.RemoteURI || selectOptions.remoteURI || selectOptions.remoteuri,
					RemoteURIConverter: selectOptions.RemoteURIConverter || selectOptions.remoteURIConverter || selectOptions.remoteuriconverter,
					RemoteURIProcessor: selectOptions.RemoteURIProcessor || selectOptions.remoteURIProcessor || selectOptions.remoteuriprocessor,
					Multiple: !!(selectOptions.Multiple || selectOptions.multiple),
					AsBoxes: !!(selectOptions.AsBoxes || selectOptions.asboxes),
					Interface: selectOptions.Interface || selectOptions.interface || "alert",
					InterfaceOptions: selectOptions.InterfaceOptions || selectOptions.interfaceOptions || selectOptions.interfaceoptions,
					OkText: selectOptions.OkText || selectOptions.okText || selectOptions.oktext || "{{common.buttons.ok}}",
					CancelText: selectOptions.CancelText || selectOptions.cancelText || selectOptions.canceltext || "{{common.buttons.cancel}}"
				};
			}

			const lookupOptions = controlOptions.LookupOptions || controlOptions.lookupOptions || controlOptions.lookupoptions;
			if (lookupOptions !== undefined) {
				const asModal = lookupOptions.AsModal !== undefined || lookupOptions.asModal !== undefined || lookupOptions.asmodal !== undefined ? !!(lookupOptions.AsModal || lookupOptions.asModal || lookupOptions.asmodal) : true;
				const modalOptions = lookupOptions.ModalOptions || lookupOptions.modalOptions || lookupOptions.modaloptions || {};
				const asCompleter = !asModal && (lookupOptions.AsCompleter !== undefined || lookupOptions.asCompleter !== undefined || lookupOptions.ascompleter !== undefined ? !!(lookupOptions.AsCompleter || lookupOptions.asCompleter || lookupOptions.ascompleter) : false);
				const completerOptions = lookupOptions.CompleterOptions || lookupOptions.completerOptions || lookupOptions.completeroptions || {};
				const asSelector = !asModal && !asCompleter && (lookupOptions.AsSelector !== undefined || lookupOptions.asSelector !== undefined || lookupOptions.asselector !== undefined ? !!(lookupOptions.AsSelector || lookupOptions.asSelector || lookupOptions.asselector) : false);
				const selectorOptions = lookupOptions.SelectorOptions || lookupOptions.selectorOptions || lookupOptions.selectoroptions || {};
				control.Options.LookupOptions = {
					AsModal: asModal,
					ModalOptions: {
						Component: modalOptions.Component || modalOptions.component,
						ComponentProps: modalOptions.ComponentProps || modalOptions.componentProps || modalOptions.componentprops,
						BackdropDismiss: !!(modalOptions.BackdropDismiss || modalOptions.backdropDismiss || modalOptions.backdropdismiss),
						SwipeToClose: !!(modalOptions.SwipeToClose || modalOptions.swipeToClose || modalOptions.swipetoclose),
						OnDismiss: modalOptions.OnDismiss || modalOptions.onDismiss || modalOptions.ondismiss
					},
					AsCompleter: asCompleter,
					CompleterOptions: {
						SearchingText: completerOptions.SearchingText || completerOptions.searchingText || completerOptions.searchingtext || "{{common.messages.completer.searching}}",
						NoResultsText: completerOptions.NoResultsText || completerOptions.noResultsText || completerOptions.noresultstext || "{{common.messages.completer.noresults}}",
						PauseMiliseconds: completerOptions.PauseMiliseconds || completerOptions.pauseMiliseconds || completerOptions.pausemiliseconds || 123,
						ClearSelected: !!(completerOptions.ClearSelected || completerOptions.clearSelected || completerOptions.clearselected),
						DataSource: completerOptions.DataSource || completerOptions.dataSource || completerOptions.datasource,
						InitialValue: completerOptions.InitialValue || completerOptions.initialValue || completerOptions.initialvalue,
						GetInitialValue: completerOptions.GetInitialValue || completerOptions.getInitialValue || completerOptions.getinitialvalue,
						OnInitialized: completerOptions.OnInitialized || completerOptions.onInitialized || completerOptions.oninitialized,
						OnSelected: completerOptions.OnSelected || completerOptions.onSelected || completerOptions.onselected,
						AllowLookupByModal: !!(completerOptions.AllowLookupByModal || completerOptions.allowLookupByModal || completerOptions.allowlookupbymodal)
					},
					AsSelector: asSelector,
					SelectorOptions: {
						HeaderText: selectorOptions.HeaderText || selectorOptions.headerText || selectorOptions.headertext,
						OkText: selectorOptions.OkText || selectorOptions.okText || selectorOptions.oktext || "{{common.buttons.ok}}",
						CancelText: selectorOptions.CancelText || selectorOptions.cancelText || selectorOptions.canceltext || "{{common.buttons.cancel}}",
						OnAdd: selectorOptions.OnAdd || selectorOptions.onAdd || selectorOptions.onadd
					},
					Multiple: lookupOptions.Multiple !== undefined || lookupOptions.multiple !== undefined ? !!(lookupOptions.Multiple || lookupOptions.multiple) : !asCompleter,
					OnDelete: lookupOptions.OnDelete || lookupOptions.onDelete || lookupOptions.ondelete,
					WarningOnDelete: lookupOptions.WarningOnDelete || lookupOptions.warningOnDelete || lookupOptions.warningondelete
				};
			}

			const datepickerOptions = controlOptions.DatePickerOptions || controlOptions.datePickerOptions || controlOptions.datepickerOptions || controlOptions.datepickeroptions;
			if (datepickerOptions !== undefined) {
				control.Options.DatePickerOptions = {
					AllowTimes: !!(datepickerOptions.AllowTimes || datepickerOptions.allowTimes || datepickerOptions.allowtimes),
					DisplayFormat: datepickerOptions.DisplayFormat || datepickerOptions.displayFormat || datepickerOptions.displayformat,
					PickerFormat: datepickerOptions.PickerFormat || datepickerOptions.pickerFormat || datepickerOptions.pickerformat,
					DayNames: datepickerOptions.DayNames || datepickerOptions.dayNames || datepickerOptions.daynames,
					DayShortNames: datepickerOptions.DayShortNames || datepickerOptions.dayShortNames || datepickerOptions.dayshortnames,
					MonthNames: datepickerOptions.MonthNames || datepickerOptions.monthNames || datepickerOptions.monthnames,
					MonthShortNames: datepickerOptions.MonthShortNames || datepickerOptions.monthShortNames || datepickerOptions.monthshortnames,
					DoneText: datepickerOptions.DoneText || datepickerOptions.doneText || datepickerOptions.donetext || "{{common.buttons.done}}",
					CancelText: datepickerOptions.CancelText || datepickerOptions.cancelText || datepickerOptions.canceltext || "{{common.buttons.cancel}}",
					AllowDelete: datepickerOptions.AllowDelete !== undefined || datepickerOptions.allowDelete !== undefined || datepickerOptions.allowdelete !== undefined ? !!(datepickerOptions.AllowDelete || datepickerOptions.allowDelete || datepickerOptions.allowdelete) : true
				};
			}

			const filepickerOptions = controlOptions.FilePickerOptions || controlOptions.filePickerOptions || controlOptions.filepickerOptions || controlOptions.filepickeroptions;
			if (filepickerOptions !== undefined) {
				control.Options.FilePickerOptions = {
					Accept: filepickerOptions.Accept || filepickerOptions.accept || "*",
					Multiple: filepickerOptions.Multiple !== undefined || filepickerOptions.multiple !== undefined ? !!(filepickerOptions.Multiple || filepickerOptions.multiple) : true,
					AllowSelect: filepickerOptions.AllowSelect !== undefined || filepickerOptions.allowSelect !== undefined || filepickerOptions.allowselect !== undefined ? !!(filepickerOptions.AllowSelect || filepickerOptions.allowSelect || filepickerOptions.allowselect) : true,
					AllowPreview: filepickerOptions.AllowPreview !== undefined || filepickerOptions.allowPreview !== undefined || filepickerOptions.allowpreview !== undefined ? !!(filepickerOptions.AllowPreview || filepickerOptions.allowPreview || filepickerOptions.allowpreview) : false,
					AllowDelete: filepickerOptions.AllowDelete !== undefined || filepickerOptions.allowDelete !== undefined || filepickerOptions.allowdelete !== undefined ? !!(filepickerOptions.AllowDelete || filepickerOptions.allowDelete || filepickerOptions.allowdelete) : true,
					OnDelete: filepickerOptions.OnDelete || filepickerOptions.onDelete || filepickerOptions.ondelete,
					WarningOnDelete: filepickerOptions.WarningOnDelete || filepickerOptions.warningOnDelete || filepickerOptions.warningondelete
				};
			}

			const rangeOptions = controlOptions.RangeOptions || controlOptions.rangeOptions || controlOptions.rangeoptions;
			if (rangeOptions !== undefined) {
				const icons = rangeOptions.Icons || rangeOptions.icons || {};
				control.Options.RangeOptions = {
					AllowPin: !!(rangeOptions.AllowPin || rangeOptions.allowPin || rangeOptions.allowpin),
					AllowSnaps: !!(rangeOptions.AllowSnaps || rangeOptions.allowSnaps || rangeOptions.allowSnaps),
					AllowDualKnobs: !!(rangeOptions.AllowDualKnobs || rangeOptions.allowDualKnobs || rangeOptions.allowdualknobs),
					AllowTicks: !!(rangeOptions.AllowTicks || rangeOptions.allowTicks || rangeOptions.allowticks),
					Step: rangeOptions.Step || rangeOptions.step || 1,
					Icons: {
						Start: icons.Start || icons.start,
						End:  icons.End || icons.end
					}
				};
			}

			const buttonOptions = controlOptions.ButtonOptions || controlOptions.buttonOptions || controlOptions.buttonoptions;
			if (buttonOptions !== undefined) {
				icon = buttonOptions.Icon || buttonOptions.icon || {};
				control.Options.ButtonOptions = {
					OnClick: buttonOptions.OnClick || buttonOptions.onClick || buttonOptions.onclick,
					Fill: buttonOptions.Fill || buttonOptions.fill || "solid",
					Color: buttonOptions.Color || buttonOptions.color,
					Icon: {
						Name: icon.Name || icon.name,
						Slot: icon.Slot || icon.slot || "start"
					}
				};
			}
		}

		const subControls = options.SubControls || options.subControls || options.subcontrols;
		if (subControls !== undefined) {
			const subConfig = subControls.Controls || subControls.controls;
			if (AppUtility.isArray(subConfig, true)) {
				control.SubControls = {
					AsArray: !!(subControls.AsArray || subControls.asArray || subControls.asarray),
					Controls: (subConfig as Array<any>).map((subOptions, subOrder) => this.assign(subOptions, undefined, subOrder, control.Name)).sort(AppUtility.getCompareFunction("Order"))
				};
				if (control.SubControls.Controls.length < 1) {
					control.SubControls = undefined;
				}
				else {
					control.SubControls.Controls.forEach((subControl, subOrder) => subControl.Order = subOrder);
				}
			}
		}

		return control;
	}

	/** Sets focus into this control */
	public focus(defer?: number) {
		PlatformUtility.focus(this.elementRef, defer);
	}

}

//  ---------------------------------------------------------------

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
	private _modal: {
		component: any;
		onDismiss: (data?: any) => void
	};
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

	private async prepareControlsAsync(formControls: Array<AppFormsControl>, modifyDatePickers?: boolean) {
		formControls.forEach((formControl, index) => {
			if (index < formControls.length - 1) {
				formControl.next = formControls[index + 1];
			}
		});
		await Promise.all(formControls.map(async formControl => {
			formControl.Options.Label = await this.normalizeResourceAsync(formControl.Options.Label);
			formControl.Options.Description = await this.normalizeResourceAsync(formControl.Options.Description);
			formControl.Options.PlaceHolder = await this.normalizeResourceAsync(formControl.Options.PlaceHolder);
			if (formControl.Type === "Select") {
				if (AppUtility.isNotEmpty(formControl.Options.SelectOptions.RemoteURI)) {
					let uri = AppXHR.getURI(formControl.Options.SelectOptions.RemoteURI);
					uri += (uri.indexOf("?") < 0 ? "?" : "&") + AppConfig.getRelatedQuery();
					try {
						if (formControl.Options.SelectOptions.RemoteURIProcessor !== undefined) {
							formControl.Options.SelectOptions.Values = await formControl.Options.SelectOptions.RemoteURIProcessor(uri, formControl.Options.SelectOptions.RemoteURIConverter);
						}
						else {
							const values = uri.indexOf("discovery/definitions?") > 0
								? await this.configSvc.fetchDefinitionAsync(uri)
								: await AppXHR.sendRequestAsync("GET", uri);
							formControl.Options.SelectOptions.Values = AppUtility.isArray(values, true)
								? (values as Array<string>).length > 0 && typeof values[0] === "string"
									? (values as Array<string>).map(value => {
											return { Value: value, Label: value };
										})
									: (values as Array<any>).map(data => {
											return formControl.Options.SelectOptions.RemoteURIConverter !== undefined
												? formControl.Options.SelectOptions.RemoteURIConverter(data)
												: { Value: data.Value || data.value, Label: data.Label || data.label || data.Value || data.value, Description: data.Description || data.description };
										})
								: AppUtility.isNotEmpty(values)
									? (AppUtility.toArray(values) as Array<string>).map(value => {
											return { Value: value, Label: value };
										})
									: AppUtility.isNotNull(values)
										? [values.toString()]
										: [];
						}
					}
					catch (error) {
						console.error("[Forms]: Error occurred while preparing the selecting values from a remote URI", error);
						formControl.Options.SelectOptions.Values = [];
					}
				}
				if (AppUtility.isArray(formControl.Options.SelectOptions.Values, true)) {
					await Promise.all(formControl.Options.SelectOptions.Values.map(async selectValue => {
						selectValue.Value = await this.normalizeResourceAsync(selectValue.Value);
						selectValue.Label = await this.normalizeResourceAsync(selectValue.Label);
					}));
				}
				formControl.Options.SelectOptions.OkText = await this.normalizeResourceAsync(formControl.Options.SelectOptions.OkText);
				formControl.Options.SelectOptions.CancelText = await this.normalizeResourceAsync(formControl.Options.SelectOptions.CancelText);
			}
			else if (AppUtility.isEquals(formControl.Type, "Lookup")) {
				if (AppUtility.isNotEmpty(formControl.Options.LookupOptions.WarningOnDelete)) {
					formControl.Options.LookupOptions.WarningOnDelete = await this.normalizeResourceAsync(formControl.Options.LookupOptions.WarningOnDelete);
				}
				formControl.Options.LookupOptions.CompleterOptions.SearchingText = await this.normalizeResourceAsync(formControl.Options.LookupOptions.CompleterOptions.SearchingText);
				formControl.Options.LookupOptions.CompleterOptions.NoResultsText = await this.normalizeResourceAsync(formControl.Options.LookupOptions.CompleterOptions.NoResultsText);
				if (AppUtility.isNotEmpty(formControl.Options.LookupOptions.SelectorOptions.HeaderText)) {
					formControl.Options.LookupOptions.SelectorOptions.HeaderText = await this.normalizeResourceAsync(formControl.Options.LookupOptions.SelectorOptions.HeaderText);
				}
				formControl.Options.LookupOptions.SelectorOptions.OkText = await this.normalizeResourceAsync(formControl.Options.LookupOptions.SelectorOptions.OkText);
				formControl.Options.LookupOptions.SelectorOptions.CancelText = await this.normalizeResourceAsync(formControl.Options.LookupOptions.SelectorOptions.CancelText);
			}
			else if (AppUtility.isEquals(formControl.Type, "DatePicker")) {
				if (AppUtility.isTrue(modifyDatePickers)) {
					formControl.Type = "TextBox";
					formControl.Options.Type = formControl.Options.DatePickerOptions.AllowTimes ? "datetime-local" : "date";
				}
				else  {
					formControl.Options.DatePickerOptions.DayNames = await this.normalizeResourceAsync(formControl.Options.DatePickerOptions.DayNames);
					formControl.Options.DatePickerOptions.DayShortNames = await this.normalizeResourceAsync(formControl.Options.DatePickerOptions.DayShortNames);
					formControl.Options.DatePickerOptions.MonthNames = await this.normalizeResourceAsync(formControl.Options.DatePickerOptions.MonthNames);
					formControl.Options.DatePickerOptions.MonthShortNames = await this.normalizeResourceAsync(formControl.Options.DatePickerOptions.MonthShortNames);
					formControl.Options.DatePickerOptions.DoneText = await this.normalizeResourceAsync(formControl.Options.DatePickerOptions.DoneText);
					formControl.Options.DatePickerOptions.CancelText = await this.normalizeResourceAsync(formControl.Options.DatePickerOptions.CancelText);
				}
			}
			else if (AppUtility.isEquals(formControl.Type, "FilePicker") && AppUtility.isNotEmpty(formControl.Options.FilePickerOptions.WarningOnDelete)) {
				formControl.Options.FilePickerOptions.WarningOnDelete = await this.normalizeResourceAsync(formControl.Options.FilePickerOptions.WarningOnDelete);
			}
			else if (AppUtility.isEquals(formControl.Type, "Lookup") && AppUtility.isEquals(formControl.Options.Type, "selector")) {
				if (AppUtility.isNotEmpty(formControl.Options.LookupOptions.WarningOnDelete)) {
					formControl.Options.LookupOptions.WarningOnDelete = await this.normalizeResourceAsync(formControl.Options.LookupOptions.WarningOnDelete);
				}
				if (AppUtility.isNotEmpty(formControl.Options.LookupOptions.SelectorOptions.HeaderText)) {
					formControl.Options.LookupOptions.SelectorOptions.HeaderText = await this.normalizeResourceAsync(formControl.Options.LookupOptions.SelectorOptions.HeaderText);
				}
				formControl.Options.LookupOptions.SelectorOptions.OkText = await this.normalizeResourceAsync(formControl.Options.LookupOptions.SelectorOptions.OkText);
				formControl.Options.LookupOptions.SelectorOptions.CancelText = await this.normalizeResourceAsync(formControl.Options.LookupOptions.SelectorOptions.CancelText);
			}
			if (formControl.SubControls !== undefined) {
				await this.prepareControlsAsync(formControl.SubControls.Controls, modifyDatePickers);
				formControl.SubControls.Controls.forEach(subcontrol => subcontrol.parent = formControl);
			}
		}));
	}

	private prepareControls(formControls: Array<AppFormsControl>, modifyDatePickers?: boolean) {
		this.prepareControlsAsync(formControls, modifyDatePickers);
	}

	/** Gets the definition of all controls */
	public getControls(formConfig: Array<AppFormsControlConfig> = [], formControls?: Array<AppFormsControl>, formSegments?: { items: Array<AppFormsSegment>, default: string, current: string }) {
		formControls = formControls || new Array<AppFormsControl>();
		formConfig.map((options, order) => {
			const formControl = new AppFormsControl(options, order);
			if (formSegments !== undefined && formSegments.items !== undefined && formSegments.items.length > 0) {
				if (formControl.Segment === undefined) {
					formControl.Segment = formSegments.default !== undefined && formSegments.items.findIndex(segment => AppUtility.isEquals(segment.Name, formSegments.default)) > -1
						? formSegments.default
						: formSegments.items[0].Name;
				}
				const segmentIndex = formSegments.items.findIndex(segment => AppUtility.isEquals(segment.Name, formControl.Segment));
				formControl.Segment = segmentIndex < 0 ? formSegments.items[0].Name : formControl.Segment;
				formControl.segmentIndex = segmentIndex < 0 ? 0 : segmentIndex;
			}
			return formControl;
		})
		.sort(AppUtility.getCompareFunction("segmentIndex", "Order"))
		.forEach((formControl, order) => {
			formControl.Order = order;
			formControls.push(formControl);
		});
		this.prepareControls(formControls, !AppConfig.isNativeApp && AppConfig.app.platform.indexOf("Desktop") > -1 && !PlatformUtility.isSafari());
		return formControls;
	}

	/** Updates the definition of all controls */
	public updateControls(formControls: Array<AppFormsControl> = [], value: any = {}) {
		formControls.forEach((formControl, order) => formControl.Order = order);
		formControls.filter(formControl => formControl.SubControls !== undefined).forEach(formControl => {
			if (formControl.SubControls.AsArray) {
				const values = value[formControl.Name] as Array<any>;
				while (formControl.SubControls.Controls.length < values.length) {
					formControl.SubControls.Controls.push(new AppFormsControl(formControl.SubControls.Controls[0], formControl.SubControls.Controls.length));
				}
				formControl.SubControls.Controls.forEach((subcontrol, subindex) => {
					if (subcontrol.SubControls !== undefined) {
						this.updateControls(subcontrol.SubControls.Controls, values[subindex]);
					}
				});
			}
			else {
				this.updateControls(formControl.SubControls.Controls, value[formControl.Name]);
			}
		});
	}

	/** Copies the form control (creates new instance) */
	public copyControl(formControl: AppFormsControl, onCompleted?: (control: AppFormsControl) => void) {
		const control = new AppFormsControl(formControl);
		control.parent = formControl.parent;
		control.segmentIndex = formControl.segmentIndex;
		if (onCompleted !== undefined) {
			onCompleted(control);
		}
		return control;
	}

	/** Copies the form control config (clones a new instance) */
	public cloneControl(config: AppFormsControlConfig, onCompleted?: (config: AppFormsControlConfig) => void) {
		return AppUtility.clone(config, false, undefined, onCompleted);
	}

	/** Builds an Angular form */
	public buildForm(form: FormGroup, formControls: Array<AppFormsControl> = [], value?: any, validators?: Array<ValidatorFn>, asyncValidators?: Array<AsyncValidatorFn>) {
		this.getFormGroup(formControls, form, validators, asyncValidators);
		if (value !== undefined) {
			this.updateControls(formControls, value);
			this.prepareControls(formControls, !AppConfig.isNativeApp && AppConfig.app.platform.startsWith("Desktop") && !PlatformUtility.isSafari());
			form.patchValue(value);
		}
		else {
			this.prepareControls(formControls, !AppConfig.isNativeApp && AppConfig.app.platform.startsWith("Desktop") && !PlatformUtility.isSafari());
		}
	}

	/** Gets an Angular form group */
	public getFormGroup(formControls: Array<AppFormsControl>, formGroup?: FormGroup, validators?: Array<ValidatorFn>, asyncValidators?: Array<AsyncValidatorFn>) {
		formGroup = formGroup || new FormGroup({}, validators, asyncValidators);
		formControls.forEach(formControl => {
			if (formControl.SubControls === undefined && AppUtility.isEquals(formControl.Type, "Lookup") && formControl.Options.LookupOptions.AsCompleter && AppUtility.isEquals(formControl.Options.Type, "Address")) {
				["County", "Province", "Country"].forEach(name => formGroup.addControl(name, this.getFormControl(formControl)));
			}
			else {
				const frmControl = formControl.SubControls === undefined
					? AppUtility.isEquals(formControl.Type, "Text")
						? undefined
						: this.getFormControl(formControl)
					: formControl.SubControls.AsArray
						? this.getFormArray(formControl, this.getValidators(formControl), this.getAsyncValidators(formControl))
						: AppUtility.isEquals(formControl.Type, "Buttons")
							? undefined
							: this.getFormGroup(formControl.SubControls.Controls, undefined, this.getValidators(formControl), this.getAsyncValidators(formControl));
				if (frmControl !== undefined) {
					formGroup.addControl(formControl.Name, frmControl);
				}
			}
		});
		return formGroup;
	}

	/** Gets an Angular form array */
	public getFormArray(formControl: AppFormsControl, validators?: Array<ValidatorFn>, asyncValidators?: Array<AsyncValidatorFn>) {
		const formArray = new FormArray([], validators, asyncValidators);
		formControl.SubControls.Controls.forEach(subFormControl => {
			if (subFormControl.SubControls === undefined && AppUtility.isEquals(subFormControl.Type, "Lookup") && formControl.Options.LookupOptions.AsCompleter && AppUtility.isEquals(subFormControl.Options.Type, "Address")) {
				const formGroup = new FormGroup({}, this.getValidators(subFormControl), this.getAsyncValidators(subFormControl));
				["County", "Province", "Country"].forEach(name => formGroup.addControl(name, this.getFormControl(subFormControl)));
				formArray.push(formGroup);
			}
			else {
				const frmControl: AbstractControl = subFormControl.SubControls === undefined
					? this.getFormControl(subFormControl)
					: subFormControl.SubControls.AsArray
						? this.getFormArray(subFormControl, this.getValidators(subFormControl), this.getAsyncValidators(subFormControl))
						: this.getFormGroup(subFormControl.SubControls.Controls, undefined, this.getValidators(subFormControl), this.getAsyncValidators(subFormControl));
				formArray.push(frmControl);
			}
		});
		return formArray;
	}

	/** Gets an Angular form control */
	public getFormControl(formControl: AppFormsControl) {
		return new FormControl(undefined, this.getValidators(formControl), this.getAsyncValidators(formControl));
	}

	/** Gets the validators of an Angular form control */
	public getValidators(formControl: AppFormsControl) {
		let validators = new Array<ValidatorFn>();

		if (formControl.Validators !== undefined && formControl.Validators.length > 0) {
			if (typeof formControl.Validators[0] === "string") {

			}
			else {
				validators = formControl.Validators as Array<ValidatorFn>;
			}
		}

		if (formControl.Required) {
			validators.push(Validators.required);
		}

		if (this._types.text.findIndex(type => AppUtility.isEquals(type, formControl.Options.Type)) > -1) {
			if (formControl.Options.MinLength > 0) {
				validators.push(Validators.minLength(formControl.Options.MinLength));
			}
			if (formControl.Options.MaxLength > 0) {
				validators.push(Validators.maxLength(formControl.Options.MaxLength));
			}
			if (AppUtility.isEquals(formControl.Options.Type, "email")) {
				validators.push(Validators.pattern("([a-zA-Z0-9_.-]+)@([a-zA-Z0-9_.-]+)\\.([a-zA-Z]{2,5})"));
			}
		}
		else if (this._types.datetime.findIndex(type => AppUtility.isEquals(type, formControl.Options.Type)) > -1) {
			if (formControl.Options.MinValue !== undefined) {
				validators.push(this.minDate(formControl.Options.MinValue));
			}
			if (formControl.Options.MaxValue !== undefined) {
				validators.push(this.maxDate(formControl.Options.MaxValue));
			}
		}
		else if (AppUtility.isEquals("number", formControl.Options.Type)) {
			if (formControl.Options.MinValue !== undefined) {
				validators.push(Validators.min(+formControl.Options.MinValue));
			}
			if (formControl.Options.MaxValue !== undefined) {
				validators.push(Validators.max(+formControl.Options.MaxValue));
			}
		}

		if (AppUtility.isNotEmpty(formControl.Options.ValidatePattern)) {
			validators.push(Validators.pattern(formControl.Options.ValidatePattern));
		}

		return validators;
	}

	/** Gets the async validators of an Angular form control */
	public getAsyncValidators(formControl: AppFormsControl) {
		const asyncValidators = new Array<AsyncValidatorFn>();
		return asyncValidators;
	}

	/** Gets the forms' button controls */
	public getButtonControls(segment: string, ...buttons: Array<{ Name: string; Label: string; OnClick: (event: Event, control: AppFormsControl) => void; Options?: { Fill?: string; Color?: string; Css?: string; Icon?: { Name?: string; Slot?: string } } }>) {
		return {
			Name: "Buttons",
			Type: "Buttons",
			Segment: segment,
			SubControls: {
				Controls: buttons.map(button => {
					return {
						Name: button.Name,
						Type: "Button",
						Options: {
							Label: button.Label,
							Css: (button.Options !== undefined ? button.Options.Css : undefined) || "",
							ButtonOptions: {
								OnClick: button.OnClick,
								Fill: (button.Options !== undefined ? button.Options.Fill : undefined) || "solid",
								Color: (button.Options !== undefined ? button.Options.Color : undefined) || "primary",
								Icon: {
									Name: button.Options !== undefined && button.Options.Icon !== undefined ? button.Options.Icon.Name : undefined,
									Slot: (button.Options !== undefined && button.Options.Icon !== undefined ? button.Options.Icon.Slot : undefined) || "start"
								}
							}
						}
					};
				})
			}
		} as AppFormsControlConfig;
	}

	/** Validates the form and highlights all invalid controls (if has) */
	public validate(form: FormGroup, onPreCompleted?: (form: FormGroup, valid: boolean) => void) {
		form.updateValueAndValidity();
		const invalid = form.invalid;
		if (invalid) {
			this.highlightInvalids(form);
		}
		if (onPreCompleted !== undefined) {
			onPreCompleted(form, !invalid);
		}
		return !invalid;
	}

	/** Highlights all invalid controls (by mark as dirty on all invalid controls) and set focus into first invalid control */
	public highlightInvalids(form: FormGroup) {
		const formControl = this.highlightInvalidsFormGroup(form, form["_controls"] as Array<AppFormsControl>);
		if (formControl !== undefined) {
			if (AppUtility.isNotEmpty(formControl.Segment) && form["_segments"] !== undefined) {
				try {
					form["_segments"].current = formControl.Segment;
				}
				catch (error) {
					console.error("[Forms]: Cannot update form's segment", error);
				}
			}
			console.warn(`[Forms]: Invalid => ${formControl.Name}`, formControl.formControlRef.value);
			formControl.focus();
		}
		return formControl;
	}

	private highlightInvalidsFormGroup(formGroup: FormGroup, formControls: Array<AppFormsControl>) {
		let firstControl: AppFormsControl;
		Object.keys(formGroup.controls).forEach(key => {
			const formControl = formGroup.controls[key];
			if (formControl.invalid) {
				const control = formControls.find(ctrl => ctrl.Name === key);
				const subcontrols = control !== undefined && control.SubControls !== undefined ? control.SubControls.Controls : undefined;
				if (formControl instanceof FormGroup) {
					firstControl = firstControl || this.highlightInvalidsFormGroup(formControl as FormGroup, subcontrols);
				}
				else if (formControl instanceof FormArray) {
					firstControl = firstControl || this.highlightInvalidsFormArray(formControl as FormArray, subcontrols);
				}
				else {
					formControl.markAsDirty();
					firstControl = firstControl || control;
				}
			}
		});
		return firstControl;
	}

	private highlightInvalidsFormArray(formArray: FormArray, formControls: Array<AppFormsControl>) {
		let firstControl: AppFormsControl;
		formArray.controls.forEach((control, index) => {
			if (control.invalid) {
				if (control instanceof FormGroup) {
					firstControl = firstControl || this.highlightInvalidsFormGroup(control as FormGroup, formControls[index] !== undefined && formControls[index].SubControls !== undefined ? formControls[index].SubControls.Controls : undefined);
				}
				else if (control instanceof FormArray) {
					firstControl = firstControl || this.highlightInvalidsFormArray(control as FormArray, formControls[index] !== undefined && formControls[index].SubControls !== undefined ? formControls[index].SubControls.Controls : undefined);
				}
				else {
					control.markAsDirty();
					firstControl = firstControl || formControls[index];
				}
			}
		});
		return firstControl;
	}

	/** Sets focus into control */
	public focus(formControl: AppFormsControl, whenNoControlFound?: () => void) {
		if (formControl !== undefined) {
			formControl.focus();
		}
		else if (whenNoControlFound !== undefined) {
			whenNoControlFound();
		}
	}

	private getNext(formControl: AppFormsControl) {
		let next = formControl !== undefined ? formControl.next : undefined;
		while (next !== undefined && next.Hidden) {
			next = next.next;
		}
		return next;
	}

	/** Sets focus into next control */
	public focusNext(formControl: AppFormsControl, whenNoControlFound?: () => void) {
		this.focus(this.getNext(formControl), whenNoControlFound);
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
				Title: `${county.title}, ${province.title}, ${country}`,
				TitleANSI: AppUtility.toANSI(`${county.title}, ${province.title}, ${country}`)
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
	public async showActionSheetAsync(buttons: Array<{ text: string; role?: string; icon?: string; handler?: () => void }>, backdropDismiss: boolean = false, dontAddCancelButton: boolean = false) {
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
	public async showAlertAsync(header: string = null, message: string = null, subMessage?: string, postProcess?: (data?: any) => void, okButtonText?: string, cancelButtonText?: string, inputs?: Array<any>, backdropDismiss: boolean = false) {
		await this.hideLoadingAsync(async () => await this.hideAlertAsync());
		const buttons = AppUtility.isNotEmpty(cancelButtonText)
			? [{ text: cancelButtonText, role: "cancel", handler: async () => await this.hideAlertAsync() }]
			: [];
		buttons.push({
			text: okButtonText || await this.getResourceAsync("common.buttons.ok"),
			role: undefined as string,
			handler: async (data?: any) => {
				if (postProcess !== undefined) {
					postProcess(data);
				}
				await this.hideAlertAsync();
			}
		});
		this._alert = await this.alertController.create({
			header: header || await this.getResourceAsync("common.alert.header.general"),
			subHeader: message,
			backdropDismiss: backdropDismiss,
			message: subMessage,
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

	/**
	 * Shows the modal dialog
	 * @param component The component for showing in the modal dialog
	 * @param componentProps The input properties of the component in the modal dialog
	 * @param onDismiss The handler to run when the modal dialog was dismissed
	 * @param backdropDismiss true to dismiss when tap on backdrop
	 * @param swipeToClose true to swipe to close the modal dialog (only available on iOS)
	*/
	public async showModalAsync(component: any, componentProps?: { [key: string]: any }, onDismiss?: (data?: any) => void, backdropDismiss: boolean = false, swipeToClose: boolean = false) {
		await this.hideLoadingAsync(async () => await this.hideModalAsync());
		this._modal = {
			component: await this.modalController.create({
				component: component,
				componentProps: componentProps,
				backdropDismiss: backdropDismiss,
				swipeToClose: swipeToClose,
				presentingElement: swipeToClose ? await this.modalController.getTop() : undefined
			}),
			onDismiss: onDismiss
		};
		await this._modal.component.present();
	}

	/**
	 * Hides (Dismiss) the modal dialog
	 * @param data The data for the onDismiss/onNext handlers
	 * @param onNext The handler to run when the modal dialog was dismissed
	*/
	public async hideModalAsync(data?: any, onNext?: (data?: any) => void) {
		if (this._modal !== undefined) {
			await this._modal.component.dismiss();
			if (this._modal !== undefined && this._modal.onDismiss !== undefined) {
				this._modal.onDismiss(data);
			}
			if (onNext !== undefined) {
				onNext(data);
			}
			this._modal = undefined;
		}
		else if (onNext !== undefined) {
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
