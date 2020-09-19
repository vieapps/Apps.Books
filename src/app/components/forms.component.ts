import { Component, OnInit, OnDestroy, AfterViewInit, Input, Output, EventEmitter } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { AppFormsControl, AppFormsControlConfig, AppFormsSegment, AppFormsService } from "@components/forms.service";
import { AppFormsControlComponent } from "@components/forms.control.component";
import { AppUtility } from "@components/app.utility";
import { PlatformUtility } from "@components/app.utility.platform";
import { AppConfig } from "../app.config";

@Component({
	selector: "app-form",
	templateUrl: "./forms.component.html"
})

/** The configurable form */
export class AppFormsComponent implements OnInit, OnDestroy, AfterViewInit {

	constructor(
		private appFormsSvc: AppFormsService
	) {
	}

	/** The color theme of the form ('dark' or 'light') */
	@Input() color: string;

	/** The instance of the form */
	@Input() form: FormGroup;

	/** The configuration of the form controls */
	@Input() config: Array<AppFormsControlConfig>;

	/** The configuration of the form segments */
	@Input() segments: { items: Array<AppFormsSegment>, default: string, current: string };

	/** The instance of the form controls */
	@Input() controls: Array<AppFormsControl>;

	/** The value of the form controls */
	@Input() value: any;

	/** Set to true to use the form controls as view control */
	@Input() asViewControls: boolean;

	/** The event handler to run when the form was initialized */
	@Output() init = new EventEmitter<AppFormsComponent>();

	/** The event handler to run when the form's view was initialized */
	@Output() afterViewInit = new EventEmitter<AppFormsComponent>();

	/** The event handler to run when the form was submitted */
	@Output() submit = new EventEmitter<AppFormsComponent>();

	/** The event handler to run when the captcha code of the form was refreshed */
	@Output() refreshCaptcha = new EventEmitter<AppFormsControlComponent>();

	/** The event handler to run when the form was focused into last control */
	@Output() lastFocus = new EventEmitter<AppFormsControlComponent>();

	ngOnInit() {
		this.segments = this.segments || { items: undefined, default: undefined, current: undefined };
		if (this.segments.items !== undefined && this.segments.items.length > 0) {
			this.segments.current = this.segments.default !== undefined && this.segments.items.findIndex(segment => AppUtility.isEquals(segment.Name, this.segments.default)) > -1
				? this.segments.default
				: this.segments.items[0].Name;
		}

		if ((this.controls === undefined || this.controls.length < 1) && this.config !== undefined) {
			this.controls = this.appFormsSvc.getControls(this.config, this.controls, this.segments);
		}

		if (this.controls === undefined) {
			throw new Error("[Forms]: Controls or config of the form need to be initialized first (controls/config attributes)");
		}

		this.asViewControls = this.asViewControls !== undefined ? AppUtility.isTrue(this.asViewControls) : false;

		if (this.controls.length < 1) {
			console.warn("[Forms]: No control");
		}
		else if (!this.asViewControls) {
			this.appFormsSvc.buildForm(this.form, this.controls, this.value);
			this.form["_controls"] = this.controls;
			this.form["_segments"] = this.segments;
		}

		this.init.emit(this);
	}

	ngAfterViewInit() {
		PlatformUtility.focus(this.controls.find(control => control.Options.AutoFocus), AppConfig.isRunningOnIOS ? 567 : 345);
		this.afterViewInit.emit(this);
	}

	ngOnDestroy() {
		this.init.unsubscribe();
		this.afterViewInit.unsubscribe();
		this.submit.unsubscribe();
		this.refreshCaptcha.unsubscribe();
		this.lastFocus.unsubscribe();
	}

	onSubmit() {
		this.submit.emit(this);
	}

	onRefreshCaptcha(control: AppFormsControlComponent) {
		this.refreshCaptcha.emit(control);
	}

	onLastFocus(control: AppFormsControlComponent) {
		this.lastFocus.emit(control);
	}

	get gotSegments() {
		return this.segments !== undefined && this.segments.items !== undefined && this.segments.items.length > 0;
	}

	onSegmentChanged(event: any) {
		this.segments.current = event.detail.value;
	}

	getControls(segment: AppFormsSegment) {
		return this.controls.filter(control => AppUtility.isEquals(control.Segment, segment.Name));
	}

	track(index: number, item: any) {
		return `${item.Name}@${index}`;
	}

}
