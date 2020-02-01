import { Component, OnInit, OnDestroy, AfterViewInit, Input, Output, EventEmitter } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { AppConfig } from "../app.config";
import { AppFormsControl, AppFormsSegment, AppFormsService } from "./forms.service";
import { PlatformUtility } from "./app.utility.platform";

@Component({
	selector: "app-form",
	templateUrl: "./forms.component.html"
})

export class AppFormsComponent implements OnInit, OnDestroy, AfterViewInit {

	constructor (
		public appFormsSvc: AppFormsService
	) {
	}

	@Input() form: FormGroup;
	@Input() config: Array<any>;
	@Input() segments: Array<AppFormsSegment>;
	@Input() defaultSegment: string;
	@Input() controls: Array<AppFormsControl>;
	@Input() value: any;
	@Input() lastFocus: any;
	@Input() color: string;

	@Output() initEvent: EventEmitter<any> = new EventEmitter();
	@Output() submitEvent: EventEmitter<any> = new EventEmitter();
	@Output() refreshCaptchaEvent: EventEmitter<any> = new EventEmitter();

	currentSegment: string;

	ngOnInit() {
		if (this.segments !== undefined && this.segments.length > 0) {
			this.currentSegment = this.defaultSegment !== undefined && this.segments.findIndex(segment => segment.Name === this.defaultSegment) > -1
				? this.defaultSegment
				: this.segments[0].Name;
		}

		if ((this.controls === undefined || this.controls.length < 1) && this.config !== undefined) {
			this.controls = this.appFormsSvc.getControls(this.config, this.controls, this.segments, this.defaultSegment);
		}

		if (this.controls === undefined) {
			throw new Error("Controls or config of the form need to be initialized first (controls/config attributes)");
		}

		if (this.controls.length < 1) {
			console.warn("[Forms]: No control");
		}
		else {
			this.appFormsSvc.buildForm(this.form, this.controls, this.value);
			this.form["_controls"] = this.controls;
			this.initEvent.emit(this);
		}
	}

	ngAfterViewInit() {
		PlatformUtility.focus(this.controls.find(control => control.Options.AutoFocus), AppConfig.isRunningOnIOS ? 567 : 345);
	}

	ngOnDestroy() {
		this.initEvent.unsubscribe();
		this.submitEvent.unsubscribe();
		this.refreshCaptchaEvent.unsubscribe();
	}

	onRefreshCaptcha($event: any) {
		this.refreshCaptchaEvent.emit($event);
	}

	onLastFocus($event: any) {
		PlatformUtility.focus(this.lastFocus);
	}

	onSubmit() {
		this.submitEvent.emit(this.form.value);
	}

	get gotSegments() {
		return this.segments !== undefined && this.segments.length > 0;
	}

	onSegmentChanged($event: any) {
		this.currentSegment = $event.detail.value;
	}

	trackSegment(index: number, segment: AppFormsSegment) {
		return `${segment.Name}@${index}`;
	}

	getControls(segment: AppFormsSegment) {
		return this.controls.filter(ctrl => ctrl.Segment === segment.Name);
	}

	trackControl(index: number, control: AppFormsControl) {
		return `${control.Name}@${index}`;
	}

}
