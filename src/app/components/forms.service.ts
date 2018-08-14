import { Injectable } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, FormArray } from "@angular/forms";
import { Validators, ValidatorFn, AsyncValidatorFn } from "@angular/forms";

/** Configuration of a control in the dynamic forms */
export class AppFormsControl {
	Key = "";
	Value = undefined;
	Type = "TextBox";
	Required = false;
	Validators: Array<ValidatorFn> | Array<string> = undefined;
	AsyncValidators: Array<AsyncValidatorFn> | Array<string> = undefined;
	Order = 0;
	Excluded = false;
	Control = {
		Type: "text",
		Label: undefined as string,
		LabelOptions: {
			Position: "floating",
			Color: "",
			Css: ""
		},
		Description: undefined as string,
		DescriptionOptions: {
			Color: "",
			Css: ""
		},
		PlaceHolder: "",
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
			Multiple: false
		},
		Disabled: false,
		ReadOnly: false,
		AutoFocus: false
	};
	SubControls: {
		Controls: Array<AppFormsControl>,
		AsArray: boolean,
		AsComplexArray: boolean
	} = undefined;

	constructor(options: any = {}, order?: number) {
		this.assign(options, this, order);
	}

	/** Gets the controls */
	static getControls(config: Array<any> = []) {
		return config.map((options, order) => new AppFormsControl(options, order)).filter(c => !c.Excluded).sort((a, b) => a.Order - b.Order);
	}

	private assign(options: any, ctrl?: AppFormsControl, order?: number, altKey?: string) {
		ctrl = ctrl || new AppFormsControl();
		ctrl.Order = options.Order || options.order || order || 0;
		ctrl.Excluded = !!options.Excluded;

		ctrl.Key = options.Key || options.key || (altKey ? `${altKey}_${ctrl.Order}` : `c_${ctrl.Order}`) || "";
		ctrl.Value = options.Value || options.value || "";
		ctrl.Type = options.Type || options.type || "TextBox";
		ctrl.Required = !!options.Required;

		ctrl.Validators = options.Validators;
		ctrl.AsyncValidators = options.AsyncValidators;

		const control = options.Control || options.control;
		if (control !== undefined && control !== null) {
			ctrl.Control.Type = control.Type || control.type || "text";

			ctrl.Control.Label = control.Label || control.label;
			const labelOptions = control.LabelOptions || control.labeloptions;
			if (labelOptions !== undefined && labelOptions !== null) {
				ctrl.Control.LabelOptions.Position = labelOptions.Position || labelOptions.position || "floating";
				ctrl.Control.LabelOptions.Color = labelOptions.Color || labelOptions.color || "";
				ctrl.Control.LabelOptions.Css = labelOptions.Css || labelOptions.css || "";
			}

			ctrl.Control.Description = control.Description || control.description;
			const descriptionOptions = control.DescriptionOptions || control.descriptionoptions;
			if (descriptionOptions !== undefined && descriptionOptions !== null) {
				ctrl.Control.DescriptionOptions.Color = descriptionOptions.Color || descriptionOptions.color || "";
				ctrl.Control.DescriptionOptions.Css = descriptionOptions.Css || descriptionOptions.css || "";
			}

			ctrl.Control.PlaceHolder = control.PlaceHolder || control.placeholder;
			ctrl.Control.Css = control.Css || control.css || "";

			ctrl.Control.Min = control.Min || control.min;
			ctrl.Control.Max = control.Max || control.max;

			ctrl.Control.MinLength = control.MinLength || control.minlength;
			ctrl.Control.MaxLength = control.MaxLength || control.maxlength;

			ctrl.Control.Width = control.Width || control.width;
			ctrl.Control.MinWidth = control.MinWidth || control.minwidth;
			ctrl.Control.MaxWidth = control.MaxWidth || control.maxwidth;

			ctrl.Control.Height = control.Height || control.height;
			ctrl.Control.MinHeight = control.MinHeight || control.minheight;
			ctrl.Control.MaxHeight = control.MaxHeight || control.maxheight;

			const selectOptions = control.SelectOptions || control.selectoptions;
			if (selectOptions !== undefined && selectOptions !== null) {
				const values = selectOptions.Values || selectOptions.values;
				if (values !== undefined && values !== null && Array.isArray(values)) {
					ctrl.Control.SelectOptions.Values = (values as Array<any>).map(kvp => {
						return {
							Key: kvp.Key || kvp.key,
							Value: kvp.Value || kvp.value
						};
					});
				}
				ctrl.Control.SelectOptions.Multiple = !!(selectOptions.Multiple || selectOptions.multiple);
			}

			ctrl.Control.Disabled = control.Disabled === undefined && control.disabled === undefined
				? false
				: !!(control.Disabled || control.disabled);
			ctrl.Control.ReadOnly = control.ReadOnly === undefined && control.readonly === undefined
				? false
				: !!(control.ReadOnly || control.readonly);
			ctrl.Control.AutoFocus = control.AutoFocus === undefined && control.autofocus === undefined
				? false
				: !!(control.AutoFocus || control.autofocus);
		}

		const subControls = options.SubControls || options.subcontrols;
		if (subControls !== undefined && subControls !== null) {
			const subConfig = subControls.Controls || subControls.controls;
			if (subConfig !== undefined && subConfig !== null && Array.isArray(subConfig)) {
				ctrl.SubControls = {
					Controls: (subConfig as Array<any>).map((subOptions, subOrder) => this.assign(subOptions, undefined, subOrder, ctrl.Key)).filter(c => !c.Excluded).sort((a, b) => a.Order - b.Order),
					AsArray: !!(subControls.AsArray || subControls.asarray),
					AsComplexArray: false
				};
				ctrl.SubControls.AsComplexArray = ctrl.SubControls.AsArray && ctrl.SubControls.Controls.filter(c => c.SubControls).length > 0;
			}
		}

		return ctrl;
	}
}

@Injectable()
export class AppFormsService {

	constructor (
	) {
	}

	/** Gets the controls */
	getControls(config: Array<any> = []) {
		return AppFormsControl.getControls(config);
	}

	/** Builds the form */
	buildForm(formGroup: FormGroup, controls: Array<AppFormsControl> = []) {
		this.getFormGroup(controls, formGroup);
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
		control.SubControls.Controls.forEach(ctrl => {
			const formControl: AbstractControl = ctrl.SubControls === undefined
				? this.getFormControl(ctrl)
				: ctrl.SubControls.AsArray
					? this.getFormArray(ctrl)
					: this.getFormGroup(ctrl.SubControls.Controls);
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
			if (control.Control.Type === "text" || control.Control.Type === "email" || control.Control.Type === "password" || control.Control.Type === "tel" || control.Control.Type === "url") {
				if (control.Control.MinLength > 0) {
					validators.push(Validators.minLength(control.Control.MinLength));
				}
				if (control.Control.MaxLength > 0) {
					validators.push(Validators.maxLength(control.Control.MaxLength));
				}
				if (control.Control.Type === "email") {
					validators.push(Validators.pattern("([a-zA-Z0-9_.-]+)@([a-zA-Z0-9_.-]+)\\.([a-zA-Z]{2,5})"));
				}
			}
			if (control.Control.Type === "number") {
				if (control.Control.Min > 0) {
					validators.push(Validators.min(control.Control.Min));
				}
				if (control.Control.Max > 0) {
					validators.push(Validators.max(control.Control.Max));
				}
			}
		}

		const asyncValidators = new Array<AsyncValidatorFn>();

		return new FormControl({ value: control.Value, disabled: control.Control.Disabled }, validators, asyncValidators);
	}

}
