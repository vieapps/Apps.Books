import { Component, OnInit, Input } from "@angular/core";
import { registerLocaleData } from "@angular/common";
import { AppUtility, HashSet } from "@components/app.utility";
import { PlatformUtility } from "@components/app.utility.platform";
import { AppFormsControl, AppFormsService } from "@components/forms.service";
import { ConfigurationService } from "@services/configuration.service";
import { AttachmentInfo } from "@models/base";

@Component({
	selector: "control-files-selector",
	templateUrl: "./file.selector.control.html",
	styleUrls: ["./file.selector.control.scss"]
})

export class FilesSelectorControl implements OnInit {

	constructor(
		private configSvc: ConfigurationService,
		private appFormsSvc: AppFormsService
	) {
		this.configSvc.locales.forEach(locale => registerLocaleData(this.configSvc.getLocaleData(locale)));
	}

	/** The form control that contains this control */
	@Input() private control: AppFormsControl;

	/** The settings (allow add/delete, show show item's image/description, position of desscription) */
	@Input() private settings: { [key: string]: any };

	/** The handlers to process */
	@Input() private handlers: { onSelect?: (attachments: AttachmentInfo[]) => void; onEdit?: (attachment: AttachmentInfo) => void; onDelete?: (attachment: AttachmentInfo) => void; predicate?: (attachment: AttachmentInfo) => boolean };

	/** Set to 'true' to show allow select multiple */
	@Input() private multiple: boolean;

	/** Set to 'true' to allow select */
	@Input() allowSelect: boolean;

	/** Set to 'true' to allow delete */
	@Input() allowDelete: boolean;

	/** Set to 'true' to allow edit */
	@Input() allowEdit: boolean;

	/** Set to 'true' to show icon of links */
	@Input() showIcons: boolean;

	selected = new HashSet<string>();

	get color() {
		return this.configSvc.color;
	}

	get locale() {
		return this.configSvc.locale;
	}

	get attachments() {
		return (this.control !== undefined ? this.control.value as Array<AttachmentInfo> : undefined) || [];
	}

	get label() {
		return this.settings !== undefined ? this.settings.Label || this.settings.label : undefined;
	}

	ngOnInit() {
		this.settings = AppUtility.isObject(this.settings, true)
			? this.settings
			: this.control !== undefined && this.control.Extras !== undefined
				? this.control.Extras["settings"] || this.control.Extras["Settings"] || {}
				: {};

		this.handlers = AppUtility.isObject(this.handlers, true)
			? this.handlers
			: this.settings.handlers !== undefined || this.settings.Handlers !== undefined
				? this.settings.handlers || this.settings.Handlers || {}
				: {};

		this.multiple = this.multiple !== undefined
			? AppUtility.isTrue(this.multiple)
			: this.settings.multiple !== undefined || this.settings.Multiple !== undefined
				? !!(this.settings.multiple || this.settings.Multiple)
				: false;

		this.allowSelect = this.handlers.onSelect !== undefined && typeof this.handlers.onSelect === "function"
			? this.allowSelect !== undefined
				? AppUtility.isTrue(this.allowSelect)
				: this.settings.allowSelect !== undefined || this.settings.AllowSelect !== undefined
					? !!(this.settings.allowSelect || this.settings.AllowSelect)
					: false
			: false;

		this.allowDelete = this.handlers.onDelete !== undefined && typeof this.handlers.onDelete === "function"
			? this.allowDelete !== undefined
				? AppUtility.isTrue(this.allowDelete)
				: this.settings.allowDelete !== undefined || this.settings.AllowDelete !== undefined
					? !!(this.settings.allowDelete || this.settings.AllowDelete)
					: false
			: false;

		this.allowEdit = this.handlers.onEdit !== undefined && typeof this.handlers.onEdit === "function"
			? this.allowEdit !== undefined
				? AppUtility.isTrue(this.allowEdit)
				: this.settings.allowEdit !== undefined || this.settings.AllowEdit !== undefined
					? !!(this.settings.allowEdit || this.settings.AllowEdit)
					: false
			: false;

		this.showIcons = this.showIcons !== undefined
				? AppUtility.isTrue(this.showIcons)
				: this.settings.showIcons !== undefined || this.settings.ShowIcons !== undefined
					? !!(this.settings.showIcons || this.settings.ShowIcons)
					: true;
	}

	track(index: number, attachment: AttachmentInfo) {
		return `${attachment.ID}@${index}`;
	}

	copy(uri: string) {
		PlatformUtility.copyToClipboard(uri, async () => await this.appFormsSvc.showToastAsync("Copied..."));
	}

	open(uri: string) {
		PlatformUtility.openURI(uri);
	}

	onSelect(event: any, attachment: AttachmentInfo) {
		if (event.detail.checked) {
			if (!this.multiple) {
				this.selected.clear();
			}
			this.selected.add(attachment.ID);
		}
		else {
			this.selected.remove(attachment.ID);
		}
		this.handlers.onSelect(this.attachments.filter(a => this.selected.contains(a.ID)));
	}

	onEdit(event: Event, attachment: AttachmentInfo) {
		event.stopPropagation();
		this.handlers.onEdit(attachment);
	}

	onDelete(event: Event, attachment: AttachmentInfo) {
		event.stopPropagation();
		this.handlers.onDelete(attachment);
	}

}
