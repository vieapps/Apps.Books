import { Component, Input, Output, EventEmitter } from "@angular/core";
import { FormGroup, FormArray } from "@angular/forms";
import { AppFormsControl } from "./forms.service";

@Component({
	selector: "app-form-element",
	templateUrl: "./forms.element.component.html"
})
export class AppFormsElementComponent {
	@Input() formGroup: FormGroup;
	@Input() control: AppFormsControl;
	@Input() index: number;
	@Output() refreshCaptchaEvent: EventEmitter<any> = new EventEmitter();

	private _style: string = undefined;

	constructor (
	) {
	}

	public get visible() {
		return !this.control.Excluded;
	}

	public get invalid() {
		const control = this.formGroup.controls[this.control.Key];
		return control !== undefined
			? control.invalid && control.dirty
			: false;
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
		return this.isFormArray && this.control.SubControls.Controls.filter(subcontrol => subcontrol.SubControls !== undefined).length < 1;
	}

	public get isComplexFormArray() {
		return this.isFormArray && this.control.SubControls.Controls.filter(subcontrol => subcontrol.SubControls !== undefined).length > 0;
	}

	public isControl(type: string) {
		return this.control.Type.toLowerCase() === type.toLowerCase();
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

	public get values() {
		return this.control.Options.SelectOptions.Values;
	}

	public get css() {
		return {
			label: this.control.Options.LabelOptions.Css,
			control: this.control.Options.Css,
			description: this.control.Options.DescriptionOptions.Css
		};
	}

	public get type() {
		return this.control.Options.Type;
	}

	public get required() {
		return this.control.Required ? true : undefined;
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
				this._style += `width:${this.control.Options.Width}px;`;
			}
			if (this.control.Options.MinWidth) {
				this._style += `min-width:${this.control.Options.MinWidth}px;`;
			}
			if (this.control.Options.MaxWidth) {
				this._style += `max-width:${this.control.Options.MaxWidth}px;`;
			}
			if (this.control.Options.Height) {
				this._style += `height:${this.control.Options.Height}px;`;
			}
			if (this.control.Options.MinHeight) {
				this._style += `min-height:${this.control.Options.MinHeight}px;`;
			}
			if (this.control.Options.MaxHeight) {
				this._style += `max-height:${this.control.Options.MaxHeight}px;`;
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

	public get extras() {
		return this.control.Extras;
	}

	public get formControlName() {
		return this.index !== undefined ? this.index : this.control.Key;
	}

	public get subControls() {
		return this.control.SubControls.Controls;
	}

	public get subFormGroup() {
		return this.formGroup.controls[this.control.Key];
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

	public refreshCaptcha() {
		this.formGroup.controls[this.control.Key].setValue("");
		this.refreshCaptchaEvent.emit(this.control);
	}

	public trackControl(index: number, control: AppFormsControl) {
		return control.Key;
	}

}
