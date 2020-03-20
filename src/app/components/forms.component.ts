import { Component, OnInit, OnDestroy, AfterViewInit, Input, Output, EventEmitter } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { AppConfig } from "../app.config";
import { AppFormsControl, AppFormsSegment, AppFormsService } from "./forms.service";
import { PlatformUtility } from "./app.utility.platform";

@Component({
	selector: "app-form",
	templateUrl: "./forms.component.html"
})

	/*** The configurable form */
	export class AppFormsComponent implements OnInit, OnDestroy, AfterViewInit {

	constructor(
		private appFormsSvc: AppFormsService
	) {
	}

	/*** The color theme of the form ('dark' or 'light') */
	@Input() color: string;

	/*** The instance of the form */
	@Input() form: FormGroup;

	/*** The configuration of the form controls */
	@Input() config: Array<any>;

	/*** The configuration of the form segments */
	@Input() segments: { items: Array<AppFormsSegment>, default: string, current: string };

	/*** The instance of the form controls */
	@Input() controls: Array<AppFormsControl>;

	/*** The value of the form controls */
	@Input() value: any;

	/*** The event handler to run when the form was initialized */
	@Output() initEvent: EventEmitter<any> = new EventEmitter();

	/*** The event handler to run when the captcha code of form was refreshed */
	@Output() refreshCaptchaEvent: EventEmitter<any> = new EventEmitter();

	/*** The event handler to run when the form was focused into last control */
	@Output() lastFocusEvent: EventEmitter<any> = new EventEmitter();

	/*** The event handler to run when the form was submitted */
	@Output() submitEvent: EventEmitter<any> = new EventEmitter();

	ngOnInit() {
		this.segments = this.segments || { items: undefined, default: undefined, current: undefined };
		if (this.segments.items !== undefined && this.segments.items.length > 0) {
			this.segments.current = this.segments.default !== undefined && this.segments.items.findIndex(segment => segment.Name === this.segments.default) > -1
				? this.segments.default
				: this.segments.items[0].Name;
		}

		if ((this.controls === undefined || this.controls.length < 1) && this.config !== undefined) {
			this.controls = this.appFormsSvc.getControls(this.config, this.controls, this.segments);
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
		this.lastFocusEvent.emit($event);
	}

	onSubmit() {
		this.submitEvent.emit(this.form.value);
	}

	get gotSegments() {
		return this.segments !== undefined && this.segments.items !== undefined && this.segments.items.length > 0;
	}

	onSegmentChanged($event: any) {
		this.segments.current = $event.detail.value;
	}

	trackSegment(index: number, segment: AppFormsSegment) {
		return `${segment.Name}@${index}`;
	}

	getControls(segment: AppFormsSegment) {
		return this.controls.filter(control => control.Segment === segment.Name);
	}

	trackControl(index: number, control: AppFormsControl) {
		return `${control.Name}@${index}`;
	}

}
