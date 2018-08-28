import { Component, OnInit, OnDestroy, AfterViewInit, Input, Output, EventEmitter, ViewChild } from "@angular/core";
import { FormGroup, FormArray } from "@angular/forms";
import { CompleterService, CompleterItem } from "ng2-completer";
import { AppUtility } from "./app.utility";
import { AppFormsControl, AppFormsService } from "./forms.service";

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

	public ngOnInit() {
		if (this.isControl("Completer")) {
			this.completerInit();
		}
	}

	public ngAfterViewInit() {
		this.control.elementRef = this.elementRef;
		this.control.formRef = this.formControl;
	}

	public ngOnDestroy() {
		this.refreshCaptchaEvent.unsubscribe();
		this.lastFocusEvent.unsubscribe();
		if (this.control.Options.CompleterOptions.DataSource !== undefined) {
			this.control.Options.CompleterOptions.DataSource.cancel();
		}
	}

	public get visible() {
		return !this.control.Excluded;
	}

	public get invalid() {
		const formControl = this.formControl;
		return formControl !== undefined && formControl.invalid && formControl.dirty;
	}

	public get isFormControl() {
		return this.control.SubControls === undefined;
	}

	public get isFormGroup() {
		return this.control.SubControls !== undefined && !this.control.SubControls.AsArray;
	}

	public get isFormArray() {
		return this.control.SubControls !== undefined && this.control.SubControls.AsArray;
	}

	public get isSimpleFormArray() {
		return this.isFormArray && this.control.SubControls.Controls.find(subcontrol => subcontrol.SubControls !== undefined) === undefined;
	}

	public get isComplexFormArray() {
		return this.isFormArray && this.control.SubControls.Controls.find(subcontrol => subcontrol.SubControls !== undefined) !== undefined;
	}

	public isControl(type: string) {
		return this.control.Type === type || this.control.Type.toLowerCase() === type.toLowerCase();
	}

	public get isPasswordControl() {
		return this.isControl("TextBox") && this.control.Options.Type === "password";
	}

	public get label() {
		return this.control.Options.Label;
	}

	public get color() {
		return this.control.Options.LabelOptions.Color;
	}

	public get position() {
		return this.control.Options.LabelOptions.Position;
	}

	public get description() {
		return this.control.Options.Description;
	}

	public get css() {
		return {
			label: this.control.Options.LabelOptions.Css,
			control: this.control.Options.Css,
			description: this.control.Options.DescriptionOptions.Css
		};
	}

	public get type() {
		return this.control.Options.Type === "password" && this.show
			? "text"
			: this.control.Options.Type;
	}

	public get required() {
		return this.control.Required ? true : undefined;
	}

	public get disabled() {
		return this.control.Options.Disabled ? true : undefined;
	}

	public get readonly() {
		return this.control.Options.ReadOnly ? true : undefined;
	}

	public get autofocus() {
		return this.control.Options.AutoFocus ? true : undefined;
	}

	public get placeholder() {
		return this.control.Options.PlaceHolder;
	}

	public get min() {
		return this.control.Options.Min;
	}

	public get max() {
		return this.control.Options.Max;
	}

	public get minLength() {
		return this.control.Options.MinLength;
	}

	public get maxLength() {
		return this.control.Options.MaxLength;
	}

	public get clearOnEdit() {
		return this.control.Options.Type.toLowerCase() === "password" ? false : undefined;
	}

	public get style() {
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

	public get formControl() {
		return this.formGroup.controls[this.control.Key];
	}

	public get formControlName() {
		return this.formArrayIndex !== undefined ? this.formArrayIndex : this.control.Key;
	}

	public get name() {
		return this.control.Options.Name;
	}

	public get value() {
		return this.formControl.value;
	}

	public get datetimeValue() {
		return this.value !== undefined ? new Date(this.value).toJSON() : undefined;
	}

	public datetimeValueChange($event) {
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

	public get datetimeDisplayFormat() {
		return this.control.Options.DateOptions.DisplayFormat !== undefined
			? this.control.Options.DateOptions.DisplayFormat
			: this.control.Options.DateOptions.AllowTimes
				? "DD/MM/YYYY HH:mm"
				: "DD/MM/YYYY";
	}

	public get datetimePickerFormat() {
		return this.control.Options.DateOptions.PickerFormat;
	}

	public get datetimeDayNames() {
		return this.control.Options.DateOptions.DayNames;
	}

	public get datetimeDayShortNames() {
		return this.control.Options.DateOptions.DayShortNames;
	}

	public get datetimeMonthNames() {
		return this.control.Options.DateOptions.MonthNames;
	}

	public get datetimeMonthShortNames() {
		return this.control.Options.DateOptions.MonthShortNames;
	}

	public get datetimeCancelText() {
		return this.control.Options.DateOptions.CancelText;
	}

	public get datetimeDoneText() {
		return this.control.Options.DateOptions.DoneText;
	}

	public get selectValues() {
		return this.control.Options.SelectOptions.Values;
	}

	public selectValuesChange($event) {
		this.formControl.setValue($event.detail.value);
		this.focusNext();
	}

	public get selectAsRadioBoxes() {
		return this.isControl("Select") && !this.control.Options.SelectOptions.Multiple && this.control.Options.SelectOptions.AsBoxes;
	}

	public get selectMultiple() {
		return this.control.Options.SelectOptions.Multiple;
	}

	public get selectInterface() {
		return this.control.Options.SelectOptions.Interface;
	}

	public get selectInterfaceOptions() {
		return this.control.Options.SelectOptions.InterfaceOptions;
	}

	public get selectCancelText() {
		return this.control.Options.SelectOptions.CancelText;
	}

	public get selectOKText() {
		return this.control.Options.SelectOptions.OKText;
	}

	completerInit() {
		if (this.control.Options.Type === "Address") {
			this.control.Options.CompleterOptions.DataSource = this.completerSvc.local(this.appFormsSvc.getCounties(), "Title,TitleANSI", "Title");
		}
		else if (this.control.Options.CompleterOptions.Handlers.Initialize !== undefined) {
			this.control.Options.CompleterOptions.Handlers.Initialize(this.control);
		}
	}

	public get completerPlaceHolder() {
		return this.placeholder || "";
	}

	public get completerMinLength() {
		return this.minLength || 3;
	}

	public get completerMaxLength() {
		return this.maxLength || 150;
	}

	public get completerSearchingText() {
		return this.control.Options.CompleterOptions.SearchingText || "Searching...";
	}

	public get completerNoResultsText() {
		return this.control.Options.CompleterOptions.NoResultsText || "Not found";
	}

	public get completerPauseMiliseconds() {
		return this.control.Options.CompleterOptions.PauseMiliseconds || 123;
	}

	public get completerClearSelected() {
		return this.control.Options.CompleterOptions.ClearSelected;
	}

	public get completerDataSource() {
		return this.control.Options.CompleterOptions.DataSource;
	}

	public get completerInitialValue() {
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
			return this.appFormsSvc.getCounties().find(addr => addr.County === value.County && addr.Province === value.Province && addr.Country === value.Country);
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

	public get captchaUri() {
		return this.control.captchaUri;
	}

	public refreshCaptcha() {
		this.formControl.setValue("");
		this.control.focus();
		this.refreshCaptchaEvent.emit(this.control);
	}

	public get subControls() {
		return this.control.SubControls.Controls;
	}

	public get subFormGroup() {
		return this.formControl;
	}

	public getSubFormGroup(index: number) {
		return (this.subFormGroup as FormArray).controls[index];
	}

	public getSubControls(control: AppFormsControl) {
		return control.SubControls.Controls;
	}

	public getSubLabel(control: AppFormsControl) {
		return control.Options.Label;
	}

	public getSubColor(control: AppFormsControl) {
		return control.Options.LabelOptions.Color;
	}

	public getSubCss(control: AppFormsControl) {
		return control.Options.LabelOptions.Css;
	}

	public trackControl(index: number, control: AppFormsControl) {
		return control.Key;
	}

	public onKeyUp($event: KeyboardEvent) {
		if ($event.code === "Enter") {
			this.focusNext();
		}
	}

	private focusNext() {
		this.appFormsSvc.focusNext(this.control, () => this.lastFocusEvent.emit(this.control));
	}

}
