import { Component, OnInit, AfterViewInit, Input, ViewChild } from "@angular/core";
import { registerLocaleData } from "@angular/common";
import { AppFormsControl } from "@components/forms.service";
import { AppUtility } from "@components/app.utility";
import { ConfigurationService } from "@services/configuration.service";

@Component({
	selector: "app-form-view",
	templateUrl: "./forms.view.component.html"
})

export class AppFormsViewComponent implements OnInit, AfterViewInit {

	constructor(
		private configSvc: ConfigurationService
	) {
		this.configSvc.locales.forEach(locale => registerLocaleData(this.configSvc.getLocaleData(locale)));
	}

	/** The object that contains settings and data of this view control */
	@Input() control: AppFormsControl;

	/** The color theme ('dark' or 'light') */
	@Input() theme: string;

	@ViewChild("elementRef", { static: false }) private elementRef: any;

	ngOnInit() {
	}

	ngAfterViewInit() {
		this.control.elementRef = this.elementRef;
		if (this.control.Options.OnAfterViewInit !== undefined) {
			this.control.Options.OnAfterViewInit(this);
		}
	}

	get locale() {
		return this.configSvc.locale;
	}

	get visible() {
		return !this.control.Hidden;
	}

	get label() {
		return this.control.Options.Label;
	}

	get position() {
		return this.isBoolean
			? ""
			: this.control.Options.LabelOptions.Position;
	}

	get value() {
		return this.control.value;
	}

	get icon() {
		return AppUtility.isNotEmpty(this.control.Options.Icon.Name)
			? this.control.Options.Icon.Name.trim().toLowerCase()
			: undefined;
	}

	get iconSlot() {
		return (this.control.Options.Icon.Slot || "end").trim().toLowerCase();
	}

	get iconFill() {
		return (this.control.Options.Icon.Fill || "clear").trim().toLowerCase();
	}

	get iconColor() {
		return (this.control.Options.Icon.Color || "medium").trim().toLowerCase();
	}

	clickOnIcon(event: Event) {
		if (this.control.Options.Icon.OnClick !== undefined) {
			this.control.Options.Icon.OnClick(event, this);
		}
	}

	get datetimeFormat() {
		return this.control.Extras["DateTimeFormat"] || this.control.Extras["datetimeFormat"] || "h:mm a @ d/M/y";
	}

	get isNumber() {
		return AppUtility.isEquals(this.control.Options.Type, "number");
	}

	get isDateTime() {
		return AppUtility.isEquals(this.control.Options.Type, "date") || AppUtility.isEquals(this.control.Options.Type, "datetime-local") || AppUtility.isEquals(this.control.Type, "DatePicker");
	}

	get isBoolean() {
		return AppUtility.isEquals(this.control.Type, "YesNo");
	}

	get isMediumText() {
		return AppUtility.isEquals(this.control.Type, "TextArea");
	}

	get isLargeText() {
		return AppUtility.isEquals(this.control.Type, "TextEditor");
	}

	get isFilePickerControl() {
		return AppUtility.isEquals(this.control.Type, "FilePicker");
	}

	onFilePickerChanged(event: any) {
		if (this.control !== undefined && this.control.Options !== undefined && typeof this.control.Options.OnChanged === "function") {
			this.control.Options.OnChanged(event, undefined);
		}
	}

	get isCustomControl() {
		return AppUtility.isEquals(this.control.Type, "Custom");
	}

	isCustomControlOf(type?: string) {
		return this.isCustomControl && (type === undefined || AppUtility.isEquals(this.control.Options.Type, type));
	}

	get isButtonsControl() {
		return AppUtility.isEquals(this.control.Type, "Buttons");
	}

}
