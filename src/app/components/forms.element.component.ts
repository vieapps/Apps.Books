import { Component, Input, Output, EventEmitter } from "@angular/core";
import { FormGroup, FormArray } from "@angular/forms";
import { AppFormsControl } from "./forms.service";

@Component({
	selector: "app-form-element",
	templateUrl: "forms.element.component.html"
})
export class AppFormsElementComponent {
	@Input() formGroup: FormGroup;
	@Input() control: AppFormsControl;
	@Input() index: number;
	@Output() refreshCaptchaEvent: EventEmitter<any> = new EventEmitter();

	constructor (
	) {
	}

	public get isFormControl() {
		return !this.control.SubControls;
	}

	public get isFormGroup() {
		return this.control.SubControls && !this.control.SubControls.AsArray;
	}

	public get isFormArray() {
		return this.control.SubControls && this.control.SubControls.AsArray;
	}

	public get isSimpleFormArray() {
		return this.isFormArray && !this.control.SubControls.AsComplexArray;
	}

	public get isComplexFormArray() {
		return this.isFormArray && this.control.SubControls.AsComplexArray;
	}

	public isControl(type: string) {
		return this.control.Type.toLowerCase() === type.toLowerCase();
	}

	public get label() {
		return this.control.Control.Label;
	}

	public get color() {
		return this.control.Control.LabelOptions.Color;
	}

	public get position() {
		return this.control.Control.LabelOptions.Position;
	}

	public get css() {
		return {
			label: this.control.Control.LabelOptions.Css,
			control: this.control.Control.Css,
			description: this.control.Control.DescriptionOptions.Css
		};
	}

	public get type() {
		return this.control.Control.Type;
	}

	public get required() {
		return this.control.Required ? true : undefined;
	}

	public get readonly() {
		return this.control.Control.ReadOnly ? true : undefined;
	}

	public get autofocus() {
		return this.control.Control.AutoFocus ? true : undefined;
	}

	public get placeholder() {
		return this.control.Control.PlaceHolder;
	}

	public get min() {
		return this.control.Control.Min;
	}

	public get max() {
		return this.control.Control.Max;
	}

	public get minLength() {
		return this.control.Control.MinLength;
	}

	public get maxLength() {
		return this.control.Control.MaxLength;
	}

	public get clearOnEdit() {
		return this.control.Control.Type.toLowerCase() === "password" ? false : undefined;
	}

	public get style() {
		let style = "";
		if (this.control.Control.Width) {
			style += `width:${this.control.Control.Width}px;`;
		}
		if (this.control.Control.MinWidth) {
			style += `min-width:${this.control.Control.MinWidth}px;`;
		}
		if (this.control.Control.MaxWidth) {
			style += `max-width:${this.control.Control.MaxWidth}px;`;
		}
		if (this.control.Control.Height) {
			style += `height:${this.control.Control.Height}px;`;
		}
		if (this.control.Control.MinHeight) {
			style += `min-height:${this.control.Control.MinHeight}px;`;
		}
		if (this.control.Control.MaxHeight) {
			style += `max-height:${this.control.Control.MaxHeight}px;`;
		}
		if (this.control.Type === "Captcha") {
			style += "text-transform:uppercase";
		}
		return {
			control: style !== "" ? style : undefined,
			description: this.control.Control.DescriptionOptions.Style !== "" ? this.control.Control.DescriptionOptions.Style : undefined
		};
	}

	public get description() {
		return this.control.Control.Description;
	}

	public get formControlName() {
		return this.index !== undefined ? this.index : this.control.Key;
	}

	public get invalid() {
		const control = this.formGroup.controls[this.formControlName];
		return control.invalid && control.dirty;
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
		return control.Control.Label;
	}

	public getSubColor(control: AppFormsControl) {
		return control.Control.LabelOptions.Color;
	}

	public getSubCss(control: AppFormsControl) {
		return control.Control.LabelOptions.Css;
	}

	public refreshCaptcha() {
		this.formGroup.controls[this.control.Key].setValue("");
		this.refreshCaptchaEvent.emit(this.control);
	}

	public controlTrackBy(index: number, item: AppFormsControl) {
		return item.Key;
	}

}
