import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { AppFormsControl, AppFormsService } from "./forms.service";
import { PlatformUtility } from "./app.utility.platform";

@Component({
	selector: "app-form",
	templateUrl: "./forms.component.html"
})
export class AppFormsComponent implements OnInit, OnDestroy {

	constructor (
		public appFormsSvc: AppFormsService
	) {
	}

	@Input() form: FormGroup;
	@Input() controls: Array<AppFormsControl>;
	@Input() config: Array<any>;
	@Input() value: any;
	@Output() renderedEvent: EventEmitter<any> = new EventEmitter();
	@Output() refreshCaptchaEvent: EventEmitter<any> = new EventEmitter();
	@Output() submitEvent: EventEmitter<any> = new EventEmitter();

	public ngOnInit() {
		if (this.controls === undefined || this.controls === null || this.controls.length < 1) {
			if (this.config !== undefined && this.config !== null) {
				this.controls = this.appFormsSvc.getControls(this.config, this.controls);
			}
		}

		if (this.controls === undefined || this.controls === null) {
			throw new Error("Controls or config of the form need to be initialized first (controls/config attributes)");
		}

		if (this.controls.length < 1) {
			PlatformUtility.showWarning("[DynamicForms]: No control");
		}
		else {
			this.appFormsSvc.buildForm(this.form, this.controls, this.value);
		}

		this.form["_controls"] = this.controls;
		this.renderedEvent.emit(this);
	}

	public ngOnDestroy() {
		this.renderedEvent.unsubscribe();
		this.refreshCaptchaEvent.unsubscribe();
		this.submitEvent.unsubscribe();
	}

	public onRefreshCaptcha($event) {
		this.refreshCaptchaEvent.emit($event);
	}

	public onSubmit() {
		this.submitEvent.next(this.form.value);
	}

	public trackControl(index: number, control: AppFormsControl) {
		return control.Key;
	}

}
