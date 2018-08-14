import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { AppFormsControl, AppFormsService } from "./forms.service";

@Component({
	selector: "app-form",
	templateUrl: "forms.main.component.html"
})
export class AppFormsComponent implements OnInit {
	@Input() form: FormGroup;
	@Input() controls: Array<AppFormsControl>;
	@Input() config: Array<any>;
	@Output() submit: EventEmitter<any> = new EventEmitter();

	constructor (
		public appFormsSvc: AppFormsService
	) {
	}

	ngOnInit() {
		if (this.controls === undefined || this.controls === null) {
			if (this.config !== undefined && this.config !== null) {
				this.controls = this.appFormsSvc.getControls(this.config);
			}
			else {
				throw new Error("Controls or config of the form need to be initialized first (controls/config attributes)");
			}
		}
		this.appFormsSvc.buildForm(this.form, this.controls);
	}

	onSubmit() {
		this.submit.next(this.form.value);
	}

}
