import { Component, Input } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { AppFormsControl } from "./forms.service";

@Component({
	selector: "app-form-element",
	templateUrl: "forms.element.component.html"
})
export class AppFormsElementComponent {
	@Input() formGroup: FormGroup;
	@Input() control: AppFormsControl;
	@Input() index: number;

	constructor (
	) {
	}

	get isFormControl() {
		return !this.control.Children;
	}

	get isFormArray() {
		return !this.isFormControl && this.control.Children.AsArray;
	}

	get isFormGroup() {
		return !this.isFormControl && !this.control.Children.AsArray;
	}

	isControl(type: string) {
		return this.control.Type.toLowerCase() === type.toLowerCase();
	}

	get label() {
		return this.control.Control.Label;
	}

	get color() {
		return this.control.Control.LabelOptions.Color;
	}

	get position() {
		return this.control.Control.LabelOptions.Position;
	}

	get css() {
		return {
			label: this.control.Control.LabelOptions.Css,
			control: this.control.Control.Css
		};
	}

	get type() {
		return this.control.Control.Type;
	}

	get formControlName() {
		return this.index !== undefined ? this.index : this.control.Key;
	}

	get required() {
		return this.control.Required ? true : undefined;
	}

	get readonly() {
		return this.control.Control.ReadOnly ? true : undefined;
	}

	get autofocus() {
		return this.control.Control.AutoFocus ? true : undefined;
	}

	get placeholder() {
		return this.control.Control.PlaceHolder;
	}

	get min() {
		return this.control.Control.Min;
	}

	get max() {
		return this.control.Control.Max;
	}

	get minLength() {
		return this.control.Control.MinLength;
	}

	get maxLength() {
		return this.control.Control.MaxLength;
	}

	get clearOnEdit() {
		return this.control.Control.Type.toLowerCase() === "password" ? false : undefined;
	}

	get style() {
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
		return style !== "" ? style : undefined;
	}

	get childControls() {
		return this.control.Children.Controls;
	}

	get childFormGroup() {
		return this.formGroup.controls[this.control.Key];
	}
}
