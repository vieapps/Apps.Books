import { Component, OnInit, OnDestroy, AfterViewInit, Input, Output, EventEmitter, ViewChild } from "@angular/core";
import { FormGroup, FormArray } from "@angular/forms";
import { CompleterService } from "ng2-completer";
import { AppFormsControl, AppFormsService } from "./forms.service";
import { AppUtility } from "./app.utility";

@Component({
	selector: "app-form-control",
	templateUrl: "./forms.control.component.html"
})
export class AppFormsControlComponent implements OnInit, OnDestroy, AfterViewInit {

	constructor (
		public appFormsSvc: AppFormsService,
		public completerSvc: CompleterService
	) {
	}

	public show = false;
	private _style: string = undefined;

	@Input() control: AppFormsControl;
	@Input() formGroup: FormGroup;
	@Input() formArrayIndex: number;

	@Output() refreshCaptchaEvent: EventEmitter<any> = new EventEmitter();
	@Output() lastFocusEvent: EventEmitter<any> = new EventEmitter();

	@ViewChild("elementRef") elementRef;

	ngOnInit() {
		if (this.isCompleter) {
			this.completerInit();
		}
	}

	ngAfterViewInit() {
		this.control.elementRef = this.elementRef;
		this.control.formRef = this.formControl;
	}

	ngOnDestroy() {
		this.refreshCaptchaEvent.unsubscribe();
		this.lastFocusEvent.unsubscribe();
		if (this.control.Options.LookupOptions.DataSource !== undefined) {
			this.control.Options.LookupOptions.DataSource.cancel();
		}
	}

	get formControl() {
		return this.formGroup.controls[this.control.Name];
	}

	get formControlName() {
		return this.formArrayIndex !== undefined ? this.formArrayIndex : this.control.Name;
	}

	get visible() {
		return !this.control.Hidden;
	}

	get invalid() {
		const formControl = this.formControl;
		return formControl !== undefined && formControl.invalid && formControl.dirty;
	}

	get isFormControl() {
		return this.control.SubControls === undefined;
	}

	get isFormGroup() {
		return this.control.SubControls !== undefined && !this.control.SubControls.AsArray;
	}

	get isFormArray() {
		return this.control.SubControls !== undefined && this.control.SubControls.AsArray;
	}

	get isSimpleFormArray() {
		return this.isFormArray && this.control.SubControls.Controls.find(subcontrol => subcontrol.SubControls !== undefined) === undefined;
	}

	get isComplexFormArray() {
		return this.isFormArray && this.control.SubControls.Controls.find(subcontrol => subcontrol.SubControls !== undefined) !== undefined;
	}

	isControl(type: string) {
		return this.control.Type === type || this.control.Type.toLowerCase() === type.toLowerCase();
	}

	get isPasswordControl() {
		return this.isControl("TextBox") && this.control.Options.Type === "password";
	}

	get isCaptchaControl() {
		return this.isControl("Captcha");
	}

	get label() {
		return this.control.Options.Label;
	}

	get color() {
		return {
			label: this.control.Options.LabelOptions.Color,
			control: this.control.Options.Color
		};
	}

	get position() {
		return this.control.Options.LabelOptions.Position;
	}

	get description() {
		return this.control.Options.Description;
	}

	get css() {
		return {
			label: this.control.Options.LabelOptions.Css,
			control: this.control.Options.Css,
			description: this.control.Options.DescriptionOptions.Css
		};
	}

	get type() {
		return this.isPasswordControl && this.show ? "text" : this.control.Options.Type;
	}

	get required() {
		return this.control.Required ? true : undefined;
	}

	get disabled() {
		return this.control.Options.Disabled ? true : undefined;
	}

	get readonly() {
		return this.control.Options.ReadOnly ? true : undefined;
	}

	get placeholder() {
		return this.control.Options.PlaceHolder;
	}

	get minValue() {
		return this.control.Options.MinValue;
	}

	get maxValue() {
		return this.control.Options.MaxValue;
	}

	get minLength() {
		return this.control.Options.MinLength;
	}

	get maxLength() {
		return this.control.Options.MaxLength;
	}

	get clearOnEdit() {
		return this.control.Options.Type.toLowerCase() === "password" ? false : undefined;
	}

	get width() {
		return this.control.Options.Width !== undefined ? this.control.Options.Width : "";
	}

	get height() {
		return this.control.Options.Height !== undefined ? this.control.Options.Height : "";
	}

	get style() {
		if (this._style === undefined) {
			this._style = "";
			if (this.control.Options.Width) {
				this._style += `width:${this.control.Options.Width};`;
			}
			if (this.control.Options.Height) {
				this._style += `height:${this.control.Options.Height};`;
			}
			if (this.control.Type === "Captcha") {
				this._style += "text-transform:uppercase";
			}
		}
		return {
			control: this._style !== "" ? this._style : undefined,
			description: this.control.Options.DescriptionOptions.Style !== "" ? this.control.Options.DescriptionOptions.Style : undefined
		};
	}

	get name() {
		return this.control.Options.Name;
	}

	get value() {
		return this.formControl.value;
	}

	onValueChanged($event) {
		this.formControl.setValue($event.detail.value);
		if (!this.isControl("Range")) {
			this.focusNext();
		}
	}

	get datetimeValue() {
		return this.value !== undefined ? new Date(this.value).toJSON() : undefined;
	}

	datetimeOnValueChanged($event) {
		try {
			const year = $event.detail.value.year;
			const month = $event.detail.value.month;
			const day = $event.detail.value.day;
			let value = `${year.text}-${month.text}-${day.text}`;
			if (this.control.Options.DatePickerOptions.AllowTimes) {
				const hour = $event.detail.value.hour;
				const minute = $event.detail.value.minute;
				const second = $event.detail.value.second;
				if (hour !== undefined && minute !== undefined) {
					value += `T${hour.text}`;
					if (minute !== undefined) {
						value += `:${minute.text}`;
						if (second !== undefined) {
							value += `:${second.text}`;
						}
					}
					value += "Z";
				}
			}
			this.formControl.setValue(new Date(value));
		}
		catch {}
		this.focusNext();
	}

	get datetimeDisplayFormat() {
		return this.control.Options.DatePickerOptions.DisplayFormat !== undefined
			? this.control.Options.DatePickerOptions.DisplayFormat
			: this.control.Options.DatePickerOptions.AllowTimes
				? "DD/MM/YYYY HH:mm"
				: "DD/MM/YYYY";
	}

	get datetimePickerFormat() {
		return this.control.Options.DatePickerOptions.PickerFormat;
	}

	get datetimeDayNames() {
		return this.control.Options.DatePickerOptions.DayNames;
	}

	get datetimeDayShortNames() {
		return this.control.Options.DatePickerOptions.DayShortNames;
	}

	get datetimeMonthNames() {
		return this.control.Options.DatePickerOptions.MonthNames;
	}

	get datetimeMonthShortNames() {
		return this.control.Options.DatePickerOptions.MonthShortNames;
	}

	get datetimeCancelText() {
		return this.control.Options.DatePickerOptions.CancelText;
	}

	get datetimeDoneText() {
		return this.control.Options.DatePickerOptions.DoneText;
	}

	get selectValues() {
		return this.control.Options.SelectOptions.Values;
	}

	get selectAsRadioBoxes() {
		return this.isControl("Select") && !this.control.Options.SelectOptions.Multiple && this.control.Options.SelectOptions.AsBoxes;
	}

	get selectMultiple() {
		return this.control.Options.SelectOptions.Multiple;
	}

	get selectInterface() {
		return this.control.Options.SelectOptions.Interface;
	}

	get selectInterfaceOptions() {
		return this.control.Options.SelectOptions.InterfaceOptions;
	}

	get selectCancelText() {
		return this.control.Options.SelectOptions.CancelText;
	}

	get selectOkText() {
		return this.control.Options.SelectOptions.OkText;
	}

	get checked() {
		return this.control.formRef !== undefined && this.control.value !== undefined
			? this.minValue === undefined || this.maxValue === undefined
				? AppUtility.isTrue(this.control.value)
				: +this.control.value !== 0
			: false;
	}

	yesnoOnValueChanged($event) {
		this.control.value = this.minValue === undefined || this.maxValue === undefined
			? $event.detail.checked
			: $event.detail.checked ? 1 : 0;
		this.focusNext();
	}

	get isCompleter() {
		return this.isControl("Lookup") && this.control.Options.LookupOptions.AsCompleter;
	}

	completerInit() {
		if (this.control.Options.Type === "Address") {
			this.control.Options.LookupOptions.DataSource = this.completerSvc.local(this.appFormsSvc.getMetaCounties(), "Title,TitleANSI", "Title");
		}
		else if (this.control.Options.LookupOptions.Handlers.Initialize !== undefined) {
			this.control.Options.LookupOptions.Handlers.Initialize(this.control);
		}
	}

	get completerPlaceHolder() {
		return this.placeholder || "";
	}

	get completerMinLength() {
		return this.minLength || 3;
	}

	get completerMaxLength() {
		return this.maxLength || 150;
	}

	get completerSearchingText() {
		return this.control.Options.LookupOptions.SearchingText;
	}

	get completerNoResultsText() {
		return this.control.Options.LookupOptions.NoResultsText;
	}

	get completerPauseMiliseconds() {
		return this.control.Options.LookupOptions.PauseMiliseconds || 123;
	}

	get completerClearSelected() {
		return this.control.Options.LookupOptions.ClearSelected;
	}

	get completerDataSource() {
		return this.control.Options.LookupOptions.DataSource;
	}

	get completerInitialValue() {
		if (this.control.Options.Type === "Address") {
			const value = {
				County: "",
				Province: "",
				Country: ""
			};
			["County", "Province", "Country"].forEach(name => {
				const formControl = this.formGroup.controls[name];
				value[name] = formControl !== undefined ? formControl.value : "";
			});
			return this.appFormsSvc.getMetaCounties().find(addr => addr.County === value.County && addr.Province === value.Province && addr.Country === value.Country);
		}
		else {
			return this.control.Options.LookupOptions.Handlers.GetInitialValue !== undefined
				? this.control.Options.LookupOptions.Handlers.GetInitialValue(this.control)
				: undefined;
		}
	}

	completerOnItemChanged(item) {
		if (this.control.Options.Type === "Address") {
			const address = AppUtility.isObject(item, true) ? item.originalObject : undefined;
			["County", "Province", "Country"].forEach(name => {
				const formControl = this.formGroup.controls[name];
				if (formControl !== undefined) {
					formControl.setValue(address !== undefined ? address[name] : "");
				}
			});
		}
		else if (this.control.Options.LookupOptions.Handlers.OnItemSelected !== undefined) {
			this.control.Options.LookupOptions.Handlers.OnItemSelected(item, this.control);
		}
	}

	get captchaURI() {
		return this.control.captchaURI;
	}

	refreshCaptcha() {
		this.control.value = "";
		this.control.focus();
		this.refreshCaptchaEvent.emit(this.control);
	}

	get subControls() {
		return this.control.SubControls.Controls;
	}

	get subFormGroup() {
		return this.formControl;
	}

	getSubFormGroup(index: number) {
		return (this.subFormGroup as FormArray).controls[index];
	}

	getSubControls(control: AppFormsControl) {
		return control.SubControls.Controls;
	}

	getSubLabel(control: AppFormsControl) {
		return control.Options.Label;
	}

	getSubColor(control: AppFormsControl) {
		return control.Options.LabelOptions.Color;
	}

	getSubCss(control: AppFormsControl) {
		return control.Options.LabelOptions.Css;
	}

	trackControl(index: number, control: AppFormsControl) {
		return control.Name;
	}

	onKeyUp($event: KeyboardEvent) {
		if ($event.code === "Enter") {
			this.focusNext();
		}
	}

	private focusNext() {
		this.appFormsSvc.focusNext(this.control, () => this.lastFocusEvent.emit(this.control));
	}

}
