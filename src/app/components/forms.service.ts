import { Injectable } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, FormArray } from "@angular/forms";
import { Validators, ValidatorFn, AsyncValidatorFn } from "@angular/forms";
import { PlatformUtility } from "./app.utility.platform";
import { AppUtility } from "./app.utility";

/** Configuration of a control in the dynamic forms */
export class AppFormsControl {
	Key = "";
	Type = "TextBox";
	Required = false;
	Validators: Array<ValidatorFn> | Array<string> = undefined;
	AsyncValidators: Array<AsyncValidatorFn> | Array<string> = undefined;
	Order = 0;
	Replacement = "";
	Extras: any = {};
	Excluded = false;
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
		PlaceHolder: undefined as string,
		Css: "",
		Min: undefined as number,
		Max: undefined as number,
		MinLength: undefined as number,
		MaxLength: undefined as number,
		Width: undefined as number,
		MinWidth: undefined as number,
		MaxWidth: undefined as number,
		Height: undefined as number,
		MinHeight: undefined as number,
		MaxHeight: undefined as number,
		SelectOptions: {
			Values: undefined as Array<{ Key: string, Value: string }>,
			Multiple: false,
			AsBoxes: false
		},
		Disabled: false,
		ReadOnly: false,
		AutoFocus: false
	};
	SubControls: {
		AsArray: boolean,
		Controls: Array<AppFormsControl>
	} = undefined;

	constructor (
		options?: any,
		order?: number
	) {
		if (options !== undefined) {
			this.assign(options, this, order);
		}
	}

	private assign(options: any, control?: AppFormsControl, order?: number, altKey?: string) {
		control = control || new AppFormsControl();
		control.Order = options.Order || options.order || order || 0;

		control.Key = options.Key || options.key || (altKey ? `${altKey}_${control.Order}` : `c_${control.Order}`) || "";
		control.Type = options.Type || options.type || "TextBox";
		control.Required = !!options.Required;

		control.Validators = options.Validators;
		control.AsyncValidators = options.AsyncValidators;

		control.Replacement = options.Replacement || options.replacement;
		control.Extras = options.Extras || options.extras || {};
		control.Excluded = !!(options.Excluded || options.excluded);

		const controlOptions = options.Options || options.options;
		if (controlOptions !== undefined && controlOptions !== null) {
			control.Options.Type = controlOptions.Type || controlOptions.type || "text";

			control.Options.Label = controlOptions.Label || controlOptions.label;
			const labelOptions = controlOptions.LabelOptions || controlOptions.labeloptions;
			if (labelOptions !== undefined && labelOptions !== null) {
				control.Options.LabelOptions.Position = labelOptions.Position || labelOptions.position || "stacked";
				control.Options.LabelOptions.Color = labelOptions.Color || labelOptions.color || "";
				control.Options.LabelOptions.Css = labelOptions.Css || labelOptions.css || "";
			}

			control.Options.Description = controlOptions.Description || controlOptions.description;
			const descriptionOptions = controlOptions.DescriptionOptions || controlOptions.descriptionoptions;
			if (descriptionOptions !== undefined && descriptionOptions !== null) {
				control.Options.DescriptionOptions.Css = (descriptionOptions.Css || descriptionOptions.css || "").replace("--platform-label-css", PlatformUtility.labelCss).replace("--description-label-css", "description");
				control.Options.DescriptionOptions.Style = descriptionOptions.Style || descriptionOptions.style || "";
			}

			control.Options.PlaceHolder = controlOptions.PlaceHolder || controlOptions.placeholder;
			control.Options.Css = controlOptions.Css || controlOptions.css || "";

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
			if (selectOptions !== undefined && selectOptions !== null) {
				const values = selectOptions.Values || selectOptions.values;
				if (values !== undefined && values !== null && Array.isArray(values)) {
					control.Options.SelectOptions.Values = (values as Array<any>).map(kvp => {
						return {
							Key: kvp.Key || kvp.key,
							Value: kvp.Value || kvp.value
						};
					});
				}
				control.Options.SelectOptions.Multiple = !!(selectOptions.Multiple || selectOptions.multiple);
				control.Options.SelectOptions.AsBoxes = !!(selectOptions.AsBoxes || selectOptions.asboxes);
			}

			control.Options.Disabled = controlOptions.Disabled === undefined && controlOptions.disabled === undefined
				? false
				: !!(controlOptions.Disabled || controlOptions.disabled);
			control.Options.ReadOnly = controlOptions.ReadOnly === undefined && controlOptions.readonly === undefined
				? false
				: !!(controlOptions.ReadOnly || controlOptions.readonly);
			control.Options.AutoFocus = controlOptions.AutoFocus === undefined && controlOptions.autofocus === undefined
				? false
				: !!(controlOptions.AutoFocus || controlOptions.autofocus);
		}

		const subControls = options.SubControls || options.subcontrols;
		if (subControls !== undefined && subControls !== null) {
			const subConfig = subControls.Controls || subControls.controls;
			if (subConfig !== undefined && subConfig !== null && Array.isArray(subConfig)) {
				control.SubControls = {
					AsArray: !!(subControls.AsArray || subControls.asarray),
					Controls: (subConfig as Array<any>).map((subOptions, subOrder) => this.assign(subOptions, undefined, subOrder, control.Key)).sort((a, b) => a.Order - b.Order)
				};
				if (control.SubControls.Controls.length < 1) {
					control.SubControls = undefined;
				}
			}
		}

		return control;
	}

	/** Adds sub-controls of the form array */
	public addSubControls(length: number) {
		if (this.SubControls !== undefined && this.SubControls.AsArray) {
			const options = AppUtility.clone(this.SubControls.Controls[0]);
			while (this.SubControls.Controls.length < length) {
				const control = new AppFormsControl(options);
				control.Order = this.SubControls.Controls.length;
				control.Validators = this.SubControls.Controls[0].Validators;
				control.AsyncValidators = this.SubControls.Controls[0].AsyncValidators;
				this.SubControls.Controls.push(control);
			}
		}
	}

}

@Injectable()
export class AppFormsService {

	constructor (
	) {
	}

	/** Gets the definition of all controls */
	public getControls(config: Array<any> = [], controls?: Array<AppFormsControl>) {
		controls = controls || new Array<AppFormsControl>();
		config.map((options, order) => new AppFormsControl(options, order)).sort((a, b) => a.Order - b.Order).forEach(control => controls.push(control));
		return controls;
	}

	/** Updates the definition of all controls */
	public updateControls(controls: Array<AppFormsControl>, value: any = {}) {
		controls.filter(control => control.SubControls !== undefined).forEach(control => {
			if (control.SubControls.AsArray) {
				const values = value[control.Key] as Array<any>;
				control.addSubControls(values.length);
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
	}

	/** Builds the form */
	public buildForm(form: FormGroup, controls: Array<AppFormsControl> = [], value?: any) {
		if (value !== undefined && value !== null) {
			this.updateControls(controls, value);
			this.getFormGroup(controls, form);
			form.patchValue(value);
		}
		else {
			this.getFormGroup(controls, form);
		}
	}

	private getFormGroup(controls: Array<AppFormsControl>, formGroup?: FormGroup) {
		formGroup = formGroup || new FormGroup({});
		controls.forEach(control => {
			const formControl: AbstractControl = control.SubControls === undefined
				? this.getFormControl(control)
				: control.SubControls.AsArray
					? this.getFormArray(control)
					: this.getFormGroup(control.SubControls.Controls);
			formGroup.addControl(control.Key, formControl);
		});
		return formGroup;
	}

	private getFormArray(control: AppFormsControl) {
		const formArray = new FormArray([]);
		control.SubControls.Controls.forEach(subcontrol => {
			const formControl: AbstractControl = subcontrol.SubControls === undefined
				? this.getFormControl(subcontrol)
				: subcontrol.SubControls.AsArray
					? this.getFormArray(subcontrol)
					: this.getFormGroup(subcontrol.SubControls.Controls);
			formArray.push(formControl);
		});
		return formArray;
	}

	private getFormControl(control: AppFormsControl) {
		let validators = new Array<ValidatorFn>();
		if (control.Validators !== undefined && control.Validators !== null && control.Validators.length > 0) {
			if (typeof control.Validators[0] === "string") {

			}
			else {
				validators = control.Validators as ValidatorFn[];
			}
		}
		else {
			if (control.Required) {
				validators.push(Validators.required);
			}
			if (control.Options.Type === "text" || control.Options.Type === "email" || control.Options.Type === "password" || control.Options.Type === "tel" || control.Options.Type === "url") {
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
			if (control.Options.Type === "number") {
				if (control.Options.Min > 0) {
					validators.push(Validators.min(control.Options.Min));
				}
				if (control.Options.Max > 0) {
					validators.push(Validators.max(control.Options.Max));
				}
			}
		}

		const asyncValidators = new Array<AsyncValidatorFn>();

		return new FormControl({ value: "", disabled: control.Options.Disabled }, validators, asyncValidators);
	}

	/** Sets value of the form (also modify the FormArray controls if the length is not matched) */
	public setValue(form: FormGroup, controls: Array<AppFormsControl>, value: any = {}) {
		this.updateControls(controls, value);
		Object.keys(form.controls).forEach(key => delete form.controls[key]);
		this.buildForm(form, controls, value);
	}

	/** Highlights all invalid controls (by mark as dirty on all invalid controls) */
	public highlightInvalids(form: FormGroup) {
		this.highlightInvalidsFormGroup(form);
	}

	private highlightInvalidsFormGroup(formGroup: FormGroup) {
		Object.keys(formGroup.controls).forEach(key => {
			const control = formGroup.controls[key];
			if (control.invalid) {
				if (control instanceof FormGroup) {
					this.highlightInvalidsFormGroup(control as FormGroup);
				}
				else if (control instanceof FormArray) {
					this.highlightInvalidsFormArray(control as FormArray);
				}
				else {
					control.markAsDirty();
				}
			}
		});
	}

	private highlightInvalidsFormArray(formArray: FormArray) {
		formArray.controls.filter(control => control.invalid).forEach(control => {
			if (control instanceof FormGroup) {
				this.highlightInvalidsFormGroup(control as FormGroup);
			}
			else if (control instanceof FormArray) {
				this.highlightInvalidsFormArray(control as FormArray);
			}
			else {
				control.markAsDirty();
			}
		});
	}

}
