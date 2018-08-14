import { Component } from "@angular/core";
import { FormBuilder, FormArray, FormGroup, Validators } from "@angular/forms";
import { AppUtility } from "../../components/app.utility";

@Component({
	selector: "app-home",
	templateUrl: "home.page.html",
	styleUrls: ["home.page.scss"],
})
export class HomePage {
	public form: FormGroup;

	constructor(
		private formBuilder: FormBuilder
	) {
		console.log("Query", AppUtility.parseURI(window.location.href));
		this.form = this.formBuilder.group({
			name: ["Name", Validators.required],
			technologies: this.formBuilder.array([this.initTechnologyFields()])
		});
	}

	initTechnologyFields(): FormGroup	{
		return this.formBuilder.group({
			name: ["", Validators.required]
		});
	}

	addNewInputField()	{
		const control = <FormArray>this.form.controls.technologies;
		control.push(this.initTechnologyFields());
	}

	removeInputField(i: number) {
		const control = <FormArray>this.form.controls.technologies;
		control.removeAt(i);
	}

	manage(val: any) {
		console.dir(val);
	}

}
