import { Component, OnInit, OnDestroy, AfterViewInit, Input, Output, EventEmitter, ViewChild, ChangeDetectorRef } from "@angular/core";
import { FormGroup } from "@angular/forms";
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

	public showPassword = false;

	/** The object that contains settings and data of this control */
	@Input() control: AppFormsControl;

	/** The form-group object that contains this control */
	@Input() formGroup: FormGroup;

	/** The index position of the form array object that contains this control */
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
		this.control.controlRef = this;
		this.control.formControlRef = this.formControl;
		if (this.isCompleter) {
			this.completerInit();
			this.completerGetInitialValue();
		}
	}

	ngAfterViewInit() {
		this._step = "ngAfterViewInit";
		this.control.elementRef = this.elementRef;
		if (this.isYesNoControl || (this.isCompleter && this.completerInitialValue !== undefined)) {
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
		return !this.isFormControl && !this.control.SubControls.AsArray;
	}

	get isFormArray() {
		return !this.isFormControl && this.control.SubControls.AsArray;
	}

	get isSimpleFormArray() {
		return this.isFormArray && this.control.SubControls.Controls.find(subcontrol => subcontrol.SubControls !== undefined) === undefined;
	}

	get isComplexFormArray() {
		return this.isFormArray && this.control.SubControls.Controls.find(subcontrol => subcontrol.SubControls !== undefined) !== undefined;
	}

	get isFormButtons() {
		return !this.isFormControl && this.isControl("Buttons");
	}

	isControl(type: string) {
		return AppUtility.isEquals(this.control.Type, type);
	}

	isCustomControl(type?: string) {
		return this.isFormControl && this.isControl("Custom") && (type === undefined || AppUtility.isEquals(this.control.Options.Type, type));
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

	get isToggleControl() {
		return this.isYesNoControl && AppUtility.isEquals(this.control.Options.Type, "toggle");
	}

	get isCheckboxControl() {
		return this.isYesNoControl && !AppUtility.isEquals(this.control.Options.Type, "toggle");
	}

	get isDatePickerControl() {
		return this.isFormControl && this.isControl("DatePicker");
	}

	get isDatePickerDesktopControl() {
		return this.isTextBoxControl && this.control.Options.Type.startsWith("date");
	}

	get isFilePickerControl() {
		return this.isFormControl && this.isControl("FilePicker");
	}

	get isImagePickerControl() {
		return this.isFilePickerControl && !this.control.Options.FilePickerOptions.Multiple && this.control.Options.FilePickerOptions.Accept !== undefined && this.control.Options.FilePickerOptions.Accept.indexOf("image/") > -1;
	}

	get isAllowImagePreview() {
		return this.isImagePickerControl && this.control.Options.FilePickerOptions.AllowPreview && this.value !== undefined;
	}

	get isAllowDelete() {
		return this.isLookupControl
			? this.lookupDisplayValues && this.lookupDisplayValues.length > 0
			: this.isDatePickerControl
				? this.control.Options.DatePickerOptions.AllowDelete
				: this.isFilePickerControl
					? this.isImagePickerControl
						? this.control.Options.FilePickerOptions.AllowDelete && this.value !== undefined && this.value.new !== undefined
						: this.control.Options.FilePickerOptions.AllowDelete
					: false;
	}

	get deleteIcon() {
		return this.isDatePickerDesktopControl
			? "close"
			: "trash";
	}

	/** Gets the form control object (can be instance of AbstractControl, FormControl, FormGroup or FormArray) that assoiciates with this control */
	get formControl() {
		return this.formGroup.controls[this.control.Name];
	}

	get formControlAsFormGroup() {
		return this.formControl as FormGroup;
	}

	get formControlName() {
		return this.formArrayIndex !== undefined
			? this.formArrayIndex
			: this.control.Name;
	}

	get visible() {
		return !this.control.Hidden;
	}

	get invalid() {
		return this.formControl !== undefined && this.formControl.invalid && this.formControl.dirty;
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
		return this.isYesNoControl
			? ""
			: this.control.Options.LabelOptions.Position;
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
		return (this.isPasswordControl && this.showPassword ? "text" : this.control.Options.Type).trim().toLowerCase();
	}

	get required() {
		return this.control.Required
			? true
			: undefined;
	}

	get disabled() {
		return this.control.Options.Disabled
			? true
			: undefined;
	}

	get readonly() {
		return this.control.Options.ReadOnly
			? true
			: undefined;
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
		return this.isPasswordControl
			? false
			: undefined;
	}

	get width() {
		return this.control.Options.Width !== undefined
			? this.control.Options.Width
			: "";
	}

	get height() {
		return this.control.Options.Height !== undefined
			? this.control.Options.Height
			: "";
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
			control: this._style,
			description: this.control.Options.DescriptionOptions.Style || ""
		};
	}

	get icon() {
		return AppUtility.isNotEmpty(this.control.Options.Icon)
			? this.control.Options.Icon
			: undefined;
	}

	get name() {
		return this.control.Options.Name;
	}

	/** Gets the value of this control */
	get value() {
		return this.isDatePickerControl
			? AppUtility.toIsoDateTime(new Date(this.formControl.value), true)
			: this.isDatePickerDesktopControl
				? new Date(this.formControl.value)
				: this.formControl.value;
	}

	get rows() {
		return this.selectAsDropdown
			? undefined
			: this.control.Options.Rows !== undefined && this.control.Options.Rows > 0 ? this.control.Options.Rows : 4;
	}

	get yesnoChecked() {
		return this.formControl.value !== undefined
			? this.minValue === undefined || this.maxValue === undefined ? AppUtility.isTrue(this.formControl.value) : +this.formControl.value !== 0
			: false;
	}

	get datetimeValue() {
		return this.formControl.value !== undefined
			? AppUtility.toIsoDateTime(new Date(this.formControl.value), true)
			: undefined;
	}

	get datetimeDisplayFormat() {
		return this.control.Options.DatePickerOptions.DisplayFormat !== undefined
			? this.control.Options.DatePickerOptions.DisplayFormat
			: this.control.Options.DatePickerOptions.AllowTimes ? "DD/MM/YYYY HH:mm" : "DD/MM/YYYY";
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

	get selectMultiple() {
		return this.control.Options.SelectOptions.Multiple;
	}

	get selectAsRadioBoxes() {
		return this.isSelectControl && this.control.Options.SelectOptions.AsBoxes && !this.selectMultiple;
	}

	get selectAsCheckBoxes() {
		return this.isSelectControl && this.control.Options.SelectOptions.AsBoxes && this.selectMultiple;
	}

	get selectAsDropdown() {
		return this.isSelectControl && !this.control.Options.SelectOptions.AsBoxes && AppUtility.isEquals(this.control.Options.Type, "dropdown") && !this.control.Options.SelectOptions.Multiple;
	}

	get selectAsMultiple() {
		return this.isSelectControl && !this.control.Options.SelectOptions.AsBoxes && AppUtility.isEquals(this.control.Options.Type, "dropdown") && this.control.Options.SelectOptions.Multiple;
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

	selectOptionIsChecked(selectOption: string) {
		if (this._selectValues === undefined) {
			const values = this.formControl.value;
			if (AppUtility.isNotEmpty(values)) {
				this._selectValues = AppUtility.toArray(values) as Array<string>;
			}
			else if (AppUtility.isArray(values, true)) {
				this._selectValues = (values as Array<any>).map(value => value.toString());
			}
			else if (AppUtility.isObject(values, true)) {
				this._selectValues = (AppUtility.toArray(values) as Array<any>).map(value => value.toString());
			}
			else {
				this._selectValues = [values.toString()];
			}
			this._selectValues = this._selectValues.filter(value => value !== "");
		}
		return this._selectValues.indexOf(selectOption) > -1;
	}

	trackOption(index: number, option: { Value: string, Label: string }) {
		return `${option.Value}@${index}`;
	}

	get rangeOptions() {
		return this.control.Options.RangeOptions;
	}

	get isCompleter() {
		return this.isLookupControl && this.control.Options.LookupOptions.AsCompleter;
	}

	get isCompleterAllowLookupByModal() {
		return this.control.Options.LookupOptions.CompleterOptions.AllowLookupByModal && this.control.Options.LookupOptions.ModalOptions.Component !== undefined;
	}

	private get isCompleterOfAddress() {
		return AppUtility.isEquals(this.control.Options.Type, "Address");
	}

	completerInit() {
		if (this.isCompleterOfAddress) {
			this.control.Options.LookupOptions.CompleterOptions.DataSource = this.completerSvc.local(this.appFormsSvc.getMetaCounties(), "Title,TitleANSI", "Title");
		}
		else if (this.control.Options.LookupOptions.CompleterOptions.OnInitialized !== undefined) {
			this.control.Options.LookupOptions.CompleterOptions.OnInitialized(this);
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
		return this.control.Options.LookupOptions.Multiple
			? true
			: this.control.Options.LookupOptions.CompleterOptions.ClearSelected;
	}

	get completerDataSource() {
		return this.control.Options.LookupOptions.CompleterOptions.DataSource;
	}

	get completerLookupByModalButtonIcon() {
		return (this.control.Options.LookupOptions.CompleterOptions.LookupByModalButtonIcon || "duplicate").trim().toLowerCase();
	}

	private completerGetInitialValue() {
		if (this.isCompleterOfAddress) {
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
			this._completerInitialValue = this.control.Options.LookupOptions.CompleterOptions.InitialValue !== undefined
				? this.control.Options.LookupOptions.CompleterOptions.InitialValue
				: this.control.Options.LookupOptions.CompleterOptions.GetInitialValue !== undefined
					? this.control.Options.LookupOptions.CompleterOptions.GetInitialValue(this)
					: undefined;
		}
		return this._completerInitialValue;
	}

	get completerInitialValue() {
		return this._completerInitialValue || this.completerGetInitialValue();
	}

	completerLookupAsync() {
		return this.appFormsSvc.showModalAsync(
			this.control.Options.LookupOptions.ModalOptions.Component,
			this.control.Options.LookupOptions.ModalOptions.ComponentProps,
			data => {
				this._completerInitialValue = this.control.Options.LookupOptions.CompleterOptions.OnModalDismiss !== undefined
					? this.control.Options.LookupOptions.CompleterOptions.OnModalDismiss(data, this)
					: data;
				this.changeDetector.detectChanges();
			}
		);
	}

	get isModal() {
		return this.isLookupControl && this.control.Options.LookupOptions.AsModal;
	}

	/** Gets the values of this lookup control */
	get lookupValues() {
		return this.control.Options.LookupOptions.Multiple
			? this.formControl.value as Array<string>
			: [this.formControl.value as string];
	}

	/** Sets the values of this lookup control */
	set lookupValues(values: Array<string>) {
		this.formControl.setValue(values);
	}

	/** Gets the values for displaying of this lookup control */
	get lookupDisplayValues() {
		return this.control.Options.LookupOptions.Multiple
			? this.control.Options.LookupOptions.DisplayValues
			: undefined;
	}

	/** Sets the values for displaying of this lookup control */
	set lookupDisplayValues(values: Array<{ Value: string, Label: string }>) {
		this.control.Options.LookupOptions.DisplayValues = values;
	}

	/** Gets the URI for displaying captcha image of this control */
	get captchaURI() {
		return this.control.captchaURI;
	}

	/** Sets focus into this control */
	focus() {
		this.control.focus();
	}

	/** Sets focus into next control */
	focusNext() {
		this.appFormsSvc.focusNext(this.control, () => this.lastFocus.emit(this.control));
	}

	trackControl(index: number, control: AppFormsControl) {
		return `${control.Name}@${index}`;
	}

	/** Sets the value of this control */
	setValue(value: any, options?: Object, updateValueAndValidity: boolean = false) {
		this.formControl.setValue(value, options);
		if (updateValueAndValidity) {
			this.formControl.updateValueAndValidity(options === undefined ? options : { onlySelf: AppUtility.isTrue(options["onlySelf"]), emitEvent: AppUtility.isTrue(options["emitEvent"]) });
		}
	}

	/** Patchs the value of this control */
	patchValue(value: any, options?: Object, updateValueAndValidity: boolean = false) {
		this.formControl.patchValue(value, options);
		if (updateValueAndValidity) {
			this.formControl.updateValueAndValidity(options === undefined ? options : { onlySelf: AppUtility.isTrue(options["onlySelf"]), emitEvent: AppUtility.isTrue(options["emitEvent"]) });
		}
	}

	/** Resets the value of this control */
	resetValue(value?: any, options?: Object, updateValueAndValidity: boolean = false) {
		this.formControl.reset(value, options);
		if (updateValueAndValidity) {
			this.formControl.updateValueAndValidity(options === undefined ? options : { onlySelf: AppUtility.isTrue(options["onlySelf"]), emitEvent: AppUtility.isTrue(options["emitEvent"]) });
		}
	}

	async deleteValueAsync(value?: any) {
		if (this.isLookupControl) {
			if (this.control.Options.LookupOptions.OnDelete !== undefined) {
				if (AppUtility.isNotEmpty(this.control.Options.LookupOptions.WarningOnDelete)) {
					await this.appFormsSvc.showAlertAsync(
						undefined,
						undefined,
						this.control.Options.LookupOptions.WarningOnDelete,
						() => {
							this.control.Options.LookupOptions.OnDelete(value as string, this);
							this.focus();
						},
						await this.appFormsSvc.getResourceAsync("common.buttons.ok"),
						await this.appFormsSvc.getResourceAsync("common.buttons.cancel")
					);
				}
				else {
					this.control.Options.LookupOptions.OnDelete(value as string, this);
					this.focus();
				}
			}
		}
		else if (this.isFilePickerControl) {
			if (this.control.Options.FilePickerOptions.OnDelete !== undefined) {
				if (AppUtility.isNotEmpty(this.control.Options.FilePickerOptions.WarningOnDelete)) {
					await this.appFormsSvc.showAlertAsync(
						undefined,
						undefined,
						this.control.Options.FilePickerOptions.WarningOnDelete,
						() => this.control.Options.FilePickerOptions.OnDelete(value as string, this),
						await this.appFormsSvc.getResourceAsync("common.buttons.ok"),
						await this.appFormsSvc.getResourceAsync("common.buttons.cancel")
					);
				}
				else {
					this.control.Options.FilePickerOptions.OnDelete(value as string, this);
				}
			}
		}
		else if (this.formControl !== undefined) {
			this.resetValue();
			this.focus();
		}
	}

	switchPasswordControlOnOff() {
		this.showPassword = !this.showPassword;
		this.focus();
	}

	refreshCaptchaImage() {
		this.deleteValueAsync();
		this.refreshCaptcha.emit(this.control);
	}

	clickOnButton(control: AppFormsControl, formGroup: FormGroup) {
		if (control !== undefined && control.Options.ButtonOptions.OnClick !== undefined) {
			control.Options.ButtonOptions.OnClick(control, formGroup);
		}
	}

	onFocus(event: any) {
		if (this.control.Options.OnFocus !== undefined) {
			this.control.Options.OnFocus(event, this);
		}
	}

	onKeyUp(event: KeyboardEvent, focusNextOnEnter: boolean = true) {
		if (this.control.Options.OnKeyUp !== undefined) {
			this.control.Options.OnKeyUp(event, this);
		}
		if (focusNextOnEnter && event.code === "Enter") {
			this.focusNext();
		}
	}

	onBlur(event: any) {
		if (this.control.Options.OnBlur !== undefined) {
			this.control.Options.OnBlur(event, this);
		}
	}

	onChanged(event: any) {
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
				this.setValue(new Date(value));
			}
			catch {}
			this.focusNext();
		}

		// special control: yes/no (toggle)
		else if (this.isYesNoControl) {
			this.setValue(this.minValue === undefined || this.maxValue === undefined ? AppUtility.isTrue(event.detail.checked) : AppUtility.isTrue(event.detail.checked) ? 1 : 0);
			this.focusNext();
		}

		// special control: completer
		else if (this.isCompleter) {
			if (this.isCompleterOfAddress) {
				let address = AppUtility.isObject(event, true) ? event.originalObject : undefined;
				if (address === undefined && AppUtility.isEquals(this._step, "ngAfterViewInit") && this.completerInitialValue !== undefined) {
					address = this.completerInitialValue;
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
				this.control.Options.LookupOptions.CompleterOptions.OnSelected(event, this);
				if (this.control.Options.LookupOptions.Multiple) {
					this.focus();
				}
			}
		}

		// special control: select-box
		else if (this.selectAsDropdown) {
			this._selectValues = AppUtility.isArray(event) ? (event as Array<any>).map(value => value.toString()) : [event.toString()];
			this.setValue(this._selectValues !== undefined && this._selectValues.length > 0 ? this._selectValues[0] : undefined);
			this.focusNext();
		}

		// special control: multiple (check-boxes or select-box with multiple)
		else if (this.selectAsCheckBoxes || this.selectAsMultiple) {
			if (AppUtility.isArray(event)) {
				this._selectValues = (event as Array<any>).map(value => value.toString());
			}
			else {
				this._selectValues = this._selectValues || [];
				if (!event.detail.checked) {
					AppUtility.removeAt(this._selectValues, this._selectValues.indexOf(event.detail.value));
				}
				else if (this._selectValues.indexOf(event.detail.value) < 0) {
					this._selectValues.push(event.detail.value);
				}
				this._selectValues = this._selectValues.filter(value => value !== "");
			}
			this.setValue(this._selectValues);
		}

		// normal control
		else if (!this.isFilePickerControl) {
			// set value
			this.setValue(event !== undefined && event.detail !== undefined ? event.detail.value : event);

			// focus to next control
			if (!this.isRangeControl) {
				this.focusNext();
			}
		}

		// call on-changed event handler
		if (this.control.Options.OnChanged !== undefined) {
			this.control.Options.OnChanged(event, this);
		}
	}

}
