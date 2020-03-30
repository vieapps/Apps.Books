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

	/** The settings of the form control */
	@Input() control: AppFormsControl;

	/** The instance of the form that contains this control */
	@Input() formGroup: FormGroup;

	/** The index position of the form array */
	@Input() formArrayIndex: number;

	/** The color theme of the form ('dark' or 'light') */
	@Input() theme: string;

	/** The event handler to run when the captcha code of the form was refreshed */
	@Output() refreshCaptcha: EventEmitter<any> = new EventEmitter();

	/** The event handler to run when the form was focused into last control */
	@Output() lastFocus: EventEmitter<any> = new EventEmitter();

	@ViewChild("elementRef", { static: false }) private elementRef: any;

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
		if (this.isCompleter && this._completerInitialValue !== undefined && AppUtility.isEquals(this.control.Options.Type, "Address")) {
			this.changeDetector.detectChanges();
		}
		else if (this.isYesNoControl) {
			this.changeDetector.detectChanges();
		}
	}

	ngOnDestroy() {
		this.refreshCaptcha.unsubscribe();
		this.lastFocus.unsubscribe();
		if (this.control.Options.LookupOptions.CompleterOptions.DataSource !== undefined) {
			this.control.Options.LookupOptions.CompleterOptions.DataSource.cancel();
		}
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
		return AppUtility.isEquals(this.control.Type, type);
	}

	get isTextBoxControl() {
		return this.isFormControl && this.isControl("TextBox");
	}

	get isTextAreaControl() {
		return this.isFormControl && this.isControl("TextArea");
	}

	get isSelectControl() {
		return this.isFormControl && this.isControl("Select");
	}

	get isRangeControl() {
		return this.isFormControl && this.isControl("Range");
	}

	get isLookupControl() {
		return this.isFormControl && this.isControl("Lookup");
	}

	get isPasswordControl() {
		return this.isTextBoxControl && AppUtility.isEquals(this.control.Options.Type, "password");
	}

	get isCaptchaControl() {
		return this.isFormControl && this.isControl("Captcha");
	}

	get isYesNoControl() {
		return this.isFormControl && this.isControl("YesNo");
	}

	get isDatePickerControl() {
		return this.isFormControl && this.isControl("DatePicker");
	}

	get isFilePickerControl() {
		return this.isFormControl && this.isControl("FilePicker");
	}

	get isImagePickerControl() {
		return this.isFilePickerControl && !this.control.Options.FilePickerOptions.AllowMultiple && this.control.Options.FilePickerOptions.Accept !== undefined && this.control.Options.FilePickerOptions.Accept.indexOf("image/") > -1;
	}

	get isCustomControl() {
		return this.isFormControl && this.isControl("Custom");
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
		return this.isYesNoControl ? "" : this.control.Options.LabelOptions.Position;
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
		return (this.isPasswordControl && this.show ? "text" : this.control.Options.Type).trim().toLowerCase();
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
		return this.isPasswordControl ? false : undefined;
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
				this._style += `width:${this.control.Options.Width.trim()};`;
			}
			if (this.control.Options.Height) {
				this._style += `height:${this.control.Options.Height.trim()};`;
			}
			if (this.isCaptchaControl) {
				this._style += "text-transform:uppercase";
			}
		}
		return {
			control: AppUtility.isNotEmpty(this._style) ? this._style : undefined,
			description: AppUtility.isNotEmpty(this.control.Options.DescriptionOptions.Style) ? this.control.Options.DescriptionOptions.Style.trim() : undefined
		};
	}

	get icon() {
		return AppUtility.isNotEmpty(this.control.Options.Icon) ? this.control.Options.Icon : undefined;
	}

	get name() {
		return this.control.Options.Name;
	}

	get value() {
		return AppUtility.isEquals(this.control.Options.Type, "datetime-local") || AppUtility.isEquals(this.control.Options.Type, "date")
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
		return this.isSelectControl && !this.control.Options.SelectOptions.Multiple && this.control.Options.SelectOptions.AsBoxes;
	}

	get selectAsDropdown() {
		return this.isSelectControl && !this.control.Options.SelectOptions.Multiple && AppUtility.isEquals(this.control.Options.Type, "dropdown");
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

	trackOption(index: number, option: { Value: string, Label: string }) {
		return `${option.Value}@${index}`;
	}

	get isCompleter() {
		return this.isLookupControl && this.control.Options.LookupOptions.AsCompleter;
	}

	get isCompleterAllowLookupByModal() {
		return this.control.Options.LookupOptions.CompleterOptions.AllowLookupByModal && this.control.Options.LookupOptions.ModalOptions.Component !== undefined;
	}

	completerInit() {
		if (AppUtility.isEquals(this.control.Options.Type, "Address")) {
			this.control.Options.LookupOptions.CompleterOptions.DataSource = this.completerSvc.local(this.appFormsSvc.getMetaCounties(), "Title,TitleANSI", "Title");
		}
		else if (this.control.Options.LookupOptions.CompleterOptions.OnInitialized !== undefined) {
			this.control.Options.LookupOptions.CompleterOptions.OnInitialized(this.control);
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
		return this.control.Options.LookupOptions.CompleterOptions.SearchingText;
	}

	get completerNoResultsText() {
		return this.control.Options.LookupOptions.CompleterOptions.NoResultsText;
	}

	get completerPauseMiliseconds() {
		return this.control.Options.LookupOptions.CompleterOptions.PauseMiliseconds || 123;
	}

	get completerClearSelected() {
		return this.control.Options.LookupOptions.CompleterOptions.ClearSelected;
	}

	get completerDataSource() {
		return this.control.Options.LookupOptions.CompleterOptions.DataSource;
	}

	get completerLookupByModalButtonIcon() {
		return (this.control.Options.LookupOptions.CompleterOptions.LookupByModalButtonIcon || "duplicate").trim().toLowerCase();
	}

	private get isCompleterOfAddress() {
		return AppUtility.isEquals(this.control.Options.Type, "Address");
	}

	get completerInitialValue() {
		if (this._completerInitialValue === undefined) {
			if (this.control.Options.LookupOptions.CompleterOptions.InitialValue !== undefined) {
				this._completerInitialValue = this.control.Options.LookupOptions.CompleterOptions.InitialValue;
			}
			else if (this.isCompleterOfAddress) {
				const value = {
					County: "",
					Province: "",
					Country: ""
				};
				["County", "Province", "Country"].forEach(name => {
					const formControl = this.formGroup.controls[name];
					value[name] = formControl !== undefined ? formControl.value : "";
				});
				this._completerInitialValue = this.appFormsSvc.getMetaCounties().find(address => AppUtility.isEquals(address.County, value.County) && AppUtility.isEquals(address.Province, value.Province) && AppUtility.isEquals(address.Country, value.Country));
			}
			else {
				this._completerInitialValue = this.control.Options.LookupOptions.CompleterOptions.GetInitialValue !== undefined
					? this.control.Options.LookupOptions.CompleterOptions.GetInitialValue(this.control)
					: undefined;
			}
		}
		return this._completerInitialValue;
	}

	completerLookupAsync() {
		return this.appFormsSvc.showModalAsync(
			this.control.Options.LookupOptions.ModalOptions.Component,
			this.control.Options.LookupOptions.ModalOptions.ComponentProps,
			data => {
				this._completerInitialValue = this.control.Options.LookupOptions.CompleterOptions.OnModalDismiss !== undefined
					? this.control.Options.LookupOptions.CompleterOptions.OnModalDismiss(data)
					: data;
				this.changeDetector.detectChanges();
			}
		);
	}

	get isModal() {
		return this.isLookupControl && this.control.Options.LookupOptions.AsModal;
	}

	private focusNext() {
		this.appFormsSvc.focusNext(this.control, () => this.lastFocus.emit(this.control));
	}

	onKeyUp(event: KeyboardEvent) {
		if (this.control.Options.OnKeyUp !== undefined) {
			this.control.Options.OnKeyUp(event);
		}
		if (event.code === "Enter") {
			this.focusNext();
		}
	}

	onChanged(event: any) {
		// call on-changed event handler
		if (this.isFilePickerControl && this.control.Options.FilePickerOptions.OnChanged !== undefined) {
			this.control.Options.FilePickerOptions.OnChanged(event);
		}
		else if (this.control.Options.OnChanged !== undefined) {
			this.control.Options.OnChanged(event);
		}

		// special control: date-picker
		if (this.isDatePickerControl) {
			try {
				const year = event.detail.value.year;
				const month = event.detail.value.month;
				const day = event.detail.value.day;
				let value = `${year.text}-${month.text}-${day.text}`;
				if (this.control.Options.DatePickerOptions.AllowTimes) {
					const hour = event.detail.value.hour;
					const minute = event.detail.value.minute;
					const second = event.detail.value.second;
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

		// special control: yes/no (toggle)
		else if (this.isYesNoControl) {
			this.formControl.setValue(this.minValue === undefined || this.maxValue === undefined ? AppUtility.isTrue(event.detail.checked) : AppUtility.isTrue(event.detail.checked) ? 1 : 0);
			this.focusNext();
		}

		// special control: look-up by Completer
		else if (this.isCompleter) {
			if (this.isCompleterOfAddress) {
				let address = AppUtility.isObject(event, true) ? event.originalObject : undefined;
				if (address === undefined && AppUtility.isEquals(this._step, "ngAfterViewInit") && this._completerInitialValue !== undefined) {
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
			else if (this.control.Options.LookupOptions.CompleterOptions.OnSelected !== undefined) {
				this.control.Options.LookupOptions.CompleterOptions.OnSelected(event, this.control);
			}
		}

		// normal control
		else {
			// set value
			this._selectValues = undefined;
			this.formControl.setValue(event !== undefined && event.detail !== undefined ? event.detail.value : event);

			// focus to next control
			if (!this.isRangeControl) {
				this.focusNext();
			}
		}
	}

	onDeleted(event: any) {
		if (this.isImagePickerControl) {
			if (this.control.Options.FilePickerOptions.OnDeleted !== undefined) {
				this.control.Options.FilePickerOptions.OnDeleted(event);
			}
		}
	}

	get captchaURI() {
		return this.control.captchaURI;
	}

	refreshCaptchaImage() {
		this.control.value = "";
		this.control.focus();
		this.refreshCaptcha.emit(this.control);
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
