import { Component, OnInit, OnDestroy, AfterViewInit, Input, Output, EventEmitter, ViewChild } from "@angular/core";
import { FormGroup, FormArray } from "@angular/forms";
import { CompleterService, CompleterItem } from "ng2-completer";
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

	@Input() control: AppFormsControl;
	@Input() formGroup: FormGroup;
	@Input() formArrayIndex: number;

	@Output() refreshCaptchaEvent: EventEmitter<any> = new EventEmitter();
	@Output() lastFocusEvent: EventEmitter<any> = new EventEmitter();

	@ViewChild("elementRef") elementRef;

	show = false;
	private _style: string = undefined;

	ngOnInit() {
		if (this.isControl("Completer")) {
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
		if (this.control.Options.CompleterOptions.DataSource !== undefined) {
			this.control.Options.CompleterOptions.DataSource.cancel();
		}
	}

	get formControl() {
		return this.formGroup.controls[this.control.Key];
	}

	get formControlName() {
		return this.formArrayIndex !== undefined ? this.formArrayIndex : this.control.Key;
	}

	get visible() {
		return !this.control.Excluded;
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

	get label() {
		return this.control.Options.Label;
	}

	get color() {
		return this.control.Options.LabelOptions.Color;
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

	get autofocus() {
		return this.control.Options.AutoFocus ? true : undefined;
	}

	get placeholder() {
		return this.control.Options.PlaceHolder;
	}

	get min() {
		return this.control.Options.Min;
	}

	get max() {
		return this.control.Options.Max;
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

	get style() {
		if (this._style === undefined) {
			this._style = "";
			if (this.control.Options.Width) {
				this._style += `width:${this.control.Options.Width};`;
			}
			if (this.control.Options.MinWidth) {
				this._style += `min-width:${this.control.Options.MinWidth};`;
			}
			if (this.control.Options.MaxWidth) {
				this._style += `max-width:${this.control.Options.MaxWidth};`;
			}
			if (this.control.Options.Height) {
				this._style += `height:${this.control.Options.Height};`;
			}
			if (this.control.Options.MinHeight) {
				this._style += `min-height:${this.control.Options.MinHeight};`;
			}
			if (this.control.Options.MaxHeight) {
				this._style += `max-height:${this.control.Options.MaxHeight};`;
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

	get datetimeValue() {
		return this.value !== undefined ? new Date(this.value).toJSON() : undefined;
	}

	datetimeValueChange($event) {
		try {
			const year = $event.detail.value.year;
			const month = $event.detail.value.month;
			const day = $event.detail.value.day;
			let value = `${year.text}-${month.text}-${day.text}`;
			if (this.control.Options.DateOptions.AllowTimes) {
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
		return this.control.Options.DateOptions.DisplayFormat !== undefined
			? this.control.Options.DateOptions.DisplayFormat
			: this.control.Options.DateOptions.AllowTimes
				? "DD/MM/YYYY HH:mm"
				: "DD/MM/YYYY";
	}

	get datetimePickerFormat() {
		return this.control.Options.DateOptions.PickerFormat;
	}

	get datetimeDayNames() {
		return this.control.Options.DateOptions.DayNames;
	}

	get datetimeDayShortNames() {
		return this.control.Options.DateOptions.DayShortNames;
	}

	get datetimeMonthNames() {
		return this.control.Options.DateOptions.MonthNames;
	}

	get datetimeMonthShortNames() {
		return this.control.Options.DateOptions.MonthShortNames;
	}

	get datetimeCancelText() {
		return this.control.Options.DateOptions.CancelText;
	}

	get datetimeDoneText() {
		return this.control.Options.DateOptions.DoneText;
	}

	get selectValues() {
		return this.control.Options.SelectOptions.Values;
	}

	selectValuesChange($event) {
		this.formControl.setValue($event.detail.value);
		this.focusNext();
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

	get selectOKText() {
		return this.control.Options.SelectOptions.OKText;
	}

	completerInit() {
		if (this.control.Options.Type === "Address") {
			this.control.Options.CompleterOptions.DataSource = this.completerSvc.local(this.appFormsSvc.getMetaCounties(), "Title,TitleANSI", "Title");
		}
		else if (this.control.Options.CompleterOptions.Handlers.Initialize !== undefined) {
			this.control.Options.CompleterOptions.Handlers.Initialize(this.control);
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
		return this.control.Options.CompleterOptions.SearchingText || "Searching...";
	}

	get completerNoResultsText() {
		return this.control.Options.CompleterOptions.NoResultsText || "Not found";
	}

	get completerPauseMiliseconds() {
		return this.control.Options.CompleterOptions.PauseMiliseconds || 123;
	}

	get completerClearSelected() {
		return this.control.Options.CompleterOptions.ClearSelected;
	}

	get completerDataSource() {
		return this.control.Options.CompleterOptions.DataSource;
	}

	get completerInitialValue() {
		if (this.control.Options.Type === "Address") {
			const value = {
				County: "",
				Province: "",
				Country: ""
			};
			["County", "Province", "Country"].forEach(key => {
				const formControl = this.formGroup.controls[key];
				value[key] = formControl !== undefined ? formControl.value : "";
			});
			return this.appFormsSvc.getMetaCounties().find(addr => addr.County === value.County && addr.Province === value.Province && addr.Country === value.Country);
		}
		else {
			return this.control.Options.CompleterOptions.Handlers.GetInitialValue !== undefined
				? this.control.Options.CompleterOptions.Handlers.GetInitialValue(this.control)
				: undefined;
		}
	}

	completerItemChange(item: CompleterItem) {
		if (this.control.Options.Type === "Address") {
			const address = AppUtility.isObject(item, true) ? item.originalObject : undefined;
			["County", "Province", "Country"].forEach(key => {
				const formControl = this.formGroup.controls[key];
				if (formControl !== undefined) {
					formControl.setValue(address !== undefined ? address[key] : "");
				}
			});
		}
		else if (this.control.Options.CompleterOptions.Handlers.OnItemSelected !== undefined) {
			this.control.Options.CompleterOptions.Handlers.OnItemSelected(item, this.control);
		}
	}

	get captchaUri() {
		return this.control.captchaUri;
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
		return control.Key;
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
