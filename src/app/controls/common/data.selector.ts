import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from "@angular/core";
import { AppUtility, HashSet } from "@components/app.utility";
import { AppFormsControl, AppFormsService, AppFormsLookupValue } from "@components/forms.service";
import { ConfigurationService } from "@services/configuration.service";

@Component({
	selector: "control-data-selector",
	templateUrl: "./data.selector.html",
	styleUrls: ["./data.selector.scss"]
})

export class DataSelectorControl implements OnInit, OnDestroy {

	constructor(
		public configSvc: ConfigurationService,
		private appFormsSvc: AppFormsService
	) {
	}

	/** The form control that contains this control */
	@Input() private control: AppFormsControl;

	/** The current items for displying */
	@Input() items: Array<AppFormsLookupValue>;

	/** The resources of header, delete confirmation and buttons */
	@Input() resources: { header: string; confirm: string; ok: string; cancel: string; };

	/** The handlers to process the request on add/delete */
	@Input() private handlers: { add: () => void; delete: (selected: Array<string>) => void; };

	/** Set to 'true' to allow select multiple item */
	@Input() private multiple: boolean;

	/** The settings (allow add/delete, show show item's image/description, position of desscription) */
	@Input() private settings: { [key: string]: any };

	/** The event handler to run when the controls was initialized */
	@Output() init = new EventEmitter<DataSelectorControl>();

	private _allowAdd: boolean;
	private _allowDelete: boolean;
	private _showImage: boolean;
	private _showDescription: boolean;
	private _descriptionAtRight: boolean;
	private _selected = new HashSet<string>();

	get disabled() {
		return this._selected.size < 1;
	}

	get allowAdd() {
		return this._allowAdd;
	}

	get allowDelete() {
		return this._allowDelete;
	}

	get showImage() {
		return this._showImage;
	}

	get showDescription() {
		return this._showDescription;
	}

	get descriptionAtRight() {
		return this._descriptionAtRight;
	}

	ngOnInit() {
		this.items = this.items || [];

		this.resources = this.resources || {
			header: undefined,
			confirm: "Are you sure?",
			ok: "OK",
			cancel: "Cancel"
		};

		this.multiple = this.multiple !== undefined ? AppUtility.isTrue(this.multiple) : true;

		this.settings = AppUtility.isObject(this.settings, true)
			? this.settings
			: this.control !== undefined && this.control.Extras !== undefined
				? this.control.Extras["Settings"] || this.control.Extras["settings"] || {}
				: {};

		this._allowAdd = this.settings.AllowAdd !== undefined || this.settings.allowAdd !== undefined
			? !!(this.settings.AllowAdd || this.settings.allowAdd)
			: true;

		this._allowDelete = this.settings.AllowDelete !== undefined || this.settings.allowDelete !== undefined
			? !!(this.settings.AllowDelete || this.settings.allowDelete)
			: true;

		this._showImage = this.settings.ShowImage !== undefined || this.settings.showImage !== undefined
			? !!(this.settings.ShowImage || this.settings.showImage)
			: false;

		this._showDescription = this.settings.ShowDescription !== undefined || this.settings.showDescription !== undefined
			? !!(this.settings.ShowDescription || this.settings.showDescription)
			: false;

		this._descriptionAtRight = this.settings.DescriptionAtRight !== undefined || this.settings.descriptionAtRight !== undefined
			? !!(this.settings.DescriptionAtRight || this.settings.descriptionAtRight)
			: false;

		this.init.emit(this);
	}

	ngOnDestroy() {
		this.init.unsubscribe();
	}

	track(index: number, item: AppFormsLookupValue) {
		return `${item.Value}@${index}`;
	}

	checked(value: string) {
		return this._selected.contains(value);
	}

	select(event: any, value: string) {
		if (event.detail.checked) {
			if (!this.multiple) {
				this._selected.clear();
			}
			this._selected.add(value);
		}
		else {
			this._selected.remove(value);
		}
	}

	add() {
		if (this.handlers !== undefined && this.handlers.add !== undefined && typeof this.handlers.add === "function") {
			this.handlers.add();
		}
	}

	delete() {
		if (this.handlers !== undefined && this.handlers.delete !== undefined && typeof this.handlers.delete === "function") {
			this.appFormsSvc.showAlertAsync(
				undefined,
				undefined,
				this.resources.confirm,
				() => {
					this.handlers.delete(this._selected.toArray());
					this._selected.clear();
				},
				this.resources.ok,
				this.resources.cancel
			);
		}
	}

}
