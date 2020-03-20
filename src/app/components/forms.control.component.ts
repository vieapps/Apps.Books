import { Component, OnInit, OnDestroy, AfterViewInit, Input, Output, EventEmitter, ViewChild, ChangeDetectorRef } from "@angular/core";
import { FormGroup, FormArray } from "@angular/forms";
import { CompleterService } from "ng2-completer";
import { AppUtility } from "./app.utility";
import { AppFormsControl, AppFormsService } from "./forms.service";

@Component({
	selector: "app-form-control",
	templateUrl: "./forms.control.component.html"
})

export class AppFormsControlComponent implements OnInit, OnDestroy, AfterViewInit {

	constructor(
		private changeDetector: ChangeDetectorRef,
		private appFormsSvc: AppFormsService,
		private completerSvc: CompleterService
	) {
	}

	private _style: string;
	private _step = "";
	private _completerInitialValue: any;
	private _selectValues: Array<string>;

	public show = false;

	@Input() control: AppFormsControl;
	@Input() formGroup: FormGroup;
	@Input() formArrayIndex: number;
	@Input() theme: string;

	@Output() refreshCaptchaEvent: EventEmitter<any> = new EventEmitter();
	@Output() lastFocusEvent: EventEmitter<any> = new EventEmitter();

	@ViewChild("elementRef", { static: false }) elementRef: any;

	ngOnInit() {
		this._step = "ngOnInit";
		if (this.isCompleter) {
			this.completerInit();
		}
	}

	ngAfterViewInit() {
		this._step = "ngAfterViewInit";
		this.control.formRef = this.formControl;
		this.control.elementRef = this.elementRef;
		if (this.isCompleter && this._completerInitialValue !== undefined && this.control.Options.Type === "Address") {
			this.changeDetector.detectChanges();
		}
		else if (this.isControl("YesNo")) {
			this.changeDetector.detectChanges();
		}
	}

	ngOnDestroy() {
		this.refreshCaptchaEvent.unsubscribe();
		this.lastFocusEvent.unsubscribe();
		if (this.control.Options !== undefined && this.control.Options.LookupOptions !== undefined && this.control.Options.LookupOptions.DataSource !== undefined) {
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

	get isFilePickerControl() {
		return this.isControl("FilePicker");
	}

	get isImagePickerControl() {
		return this.isFilePickerControl && !this.control.Options.FilePickerOptions.AllowMultiple && this.control.Options.FilePickerOptions.Accept !== undefined && this.control.Options.FilePickerOptions.Accept.indexOf("image/") > -1;
	}

	get label() {
		return this.control.Options.Label;
	}

	get color() {
		return {
			label: AppUtility.isNotEmpty(this.control.Options.LabelOptions.Color) ? this.control.Options.LabelOptions.Color : undefined,
			control: AppUtility.isNotEmpty(this.control.Options.Color) ? this.control.Options.Color : undefined
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
			control: AppUtility.isNotEmpty(this._style) ? this._style : undefined,
			description: AppUtility.isNotEmpty(this.control.Options.DescriptionOptions.Style) ? this.control.Options.DescriptionOptions.Style : undefined
		};
	}

	get name() {
		return this.control.Options.Name;
	}

	get value() {
		return "datetime-local" === this.control.Options.Type || "date" === this.control.Options.Type
			? AppUtility.toIsoDateTime(new Date(this.formControl.value), true)
			: this.formControl.value;
	}

	get checked() {
		return this.control.formRef !== undefined && this.control.value !== undefined
			? this.minValue === undefined || this.maxValue === undefined
				? AppUtility.isTrue(this.control.value)
				: +this.control.value !== 0
			: false;
	}

	get textareaRows() {
		return this.control.Options.TextAreaRows !== undefined && this.control.Options.TextAreaRows > 0
			? this.control.Options.TextAreaRows
			: 4;
	}

	get datetimeValue() {
		return this.formControl.value !== undefined
			? AppUtility.toIsoDateTime(new Date(this.formControl.value), true)
			: undefined;
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

	get selectAsRadioBoxes() {
		return this.isControl("Select") && !this.control.Options.SelectOptions.Multiple && this.control.Options.SelectOptions.AsBoxes;
	}

	get selectAsDropdown() {
		return this.isControl("Select") && !this.control.Options.SelectOptions.Multiple && this.control.Options.Type === "dropdown";
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

	get selectOptions() {
		return this.control.Options.SelectOptions.Values || new Array<{ Value: string, Label: string }>();
	}

	selectOptionIsChecked(value: string) {
		if (this._selectValues === undefined) {
			const values = this.formControl.value;
			if (AppUtility.isNotEmpty(values)) {
				this._selectValues = AppUtility.toArray(values) as Array<string>;
			}
			else if (AppUtility.isArray(values, true)) {
				this._selectValues = (values as Array<any>).map(v => v + "");
			}
			else if (AppUtility.isObject(values, true)) {
				this._selectValues = (AppUtility.toArray(values) as Array<any>).map(v => v + "");
			}
			else {
				this._selectValues = [values + ""];
			}
		}
		return this._selectValues.indexOf(value) > -1;
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
		if (this._completerInitialValue === undefined) {
			if (this.control.Options.LookupOptions.InitialValue !== undefined) {
				this._completerInitialValue = this.control.Options.LookupOptions.InitialValue;
			}
			else if (this.control.Options.Type === "Address") {
				const value = {
					County: "",
					Province: "",
					Country: ""
				};
				["County", "Province", "Country"].forEach(name => {
					const formControl = this.formGroup.controls[name];
					value[name] = formControl !== undefined ? formControl.value : "";
				});
				this._completerInitialValue = this.appFormsSvc.getMetaCounties().find(address => address.County === value.County && address.Province === value.Province && address.Country === value.Country);
			}
			else {
				this._completerInitialValue = this.control.Options.LookupOptions.Handlers.GetInitialValue !== undefined
					? this.control.Options.LookupOptions.Handlers.GetInitialValue(this.control)
					: undefined;
			}
		}
		return this._completerInitialValue;
	}

	private focusNext() {
		this.appFormsSvc.focusNext(this.control, () => this.lastFocusEvent.emit(this.control));
	}

	onKeyUp($event: KeyboardEvent) {
		if ($event.code === "Enter") {
			this.focusNext();
		}
	}

	onChanged($event: any) {
		if (this.isFilePickerControl) {
			if (this.control.Options.FilePickerOptions.Handlers.OnChanged !== undefined) {
				this.control.Options.FilePickerOptions.Handlers.OnChanged($event);
			}
		}
		else if (this.isControl("DatePicker")) {
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
		else if (this.isControl("YesNo")) {
			this.control.value = this.minValue === undefined || this.maxValue === undefined
				? $event.detail.checked
				: $event.detail.checked ? 1 : 0;
			this.focusNext();
		}
		else if (this.isCompleter) {
			if (this.control.Options.Type === "Address") {
				let address = AppUtility.isObject($event, true) ? $event.originalObject : undefined;
				if (address === undefined && this._step === "ngAfterViewInit" && this._completerInitialValue !== undefined) {
					address = this._completerInitialValue;
					this._step = "ngDone";
				}
				["County", "Province", "Country"].forEach(name => {
					const formControl = this.formGroup.controls[name];
					if (formControl !== undefined) {
						formControl.setValue(address !== undefined ? address[name] || "" : "");
					}
				});
			}
			else if (this.control.Options.LookupOptions.Handlers.OnItemSelected !== undefined) {
				this.control.Options.LookupOptions.Handlers.OnItemSelected($event, this.control);
			}
		}
		else {
			this.formControl.setValue($event.detail.value);
			this._selectValues = undefined;
			if (!this.isControl("Range")) {
				this.focusNext();
			}
		}
	}

	onDeleted($event: any) {
		if (this.isImagePickerControl) {
			if (this.control.Options.FilePickerOptions.Handlers.OnDeleted !== undefined) {
				this.control.Options.FilePickerOptions.Handlers.OnDeleted($event);
			}
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
		return `${control.Name}@${index}`;
	}

}
