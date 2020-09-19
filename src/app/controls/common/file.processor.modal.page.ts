import { Subscription } from "rxjs";
import { Component, OnInit, OnDestroy, Input, ViewChild, ElementRef } from "@angular/core";
import { registerLocaleData } from "@angular/common";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { AppCrypto } from "@components/app.crypto";
import { AppUtility, HashSet } from "@components/app.utility";
import { PlatformUtility } from "@components/app.utility.platform";
import { AppFormsService } from "@components/forms.service";
import { ConfigurationService } from "@services/configuration.service";
import { FilesService, FileOptions } from "@services/files.service";
import { AttachmentInfo } from "@models/base";

@Component({
	selector: "page-files-processor",
	templateUrl: "./file.processor.modal.page.html",
	styleUrls: ["./file.processor.modal.page.scss"]
})

export class FilesProcessorModalPage implements OnInit, OnDestroy {

	constructor(
		private configSvc: ConfigurationService,
		private filesSvc: FilesService,
		private appFormsSvc: AppFormsService
	) {
		this.configSvc.locales.forEach(locale => registerLocaleData(this.configSvc.getLocaleData(locale)));
	}

	@Input() mode: string;
	@Input() private fileOptions: FileOptions;
	@Input() private attachment: AttachmentInfo;
	@Input() private handlers: { onSelect?: (attachments: AttachmentInfo[]) => void; onEdit?: (attachment: AttachmentInfo) => void; onDelete?: (attachment: AttachmentInfo) => void; predicate?: (attachment: AttachmentInfo) => boolean };
	@Input() private multiple: boolean;
	@Input() allowSelect: boolean;
	@Input() allowEdit: boolean;
	@Input() allowDelete: boolean;
	@Input() showIcons: boolean;
	@Input() accept: string;
	@ViewChild("filesSelector", { static: false }) private filesSelector: ElementRef;

	processing = false;
	attachments: Array<AttachmentInfo>;
	selected = new HashSet<string>();
	buttons = {
		select: "Select",
		cancel: "Cancel",
		update: "Update",
		upload: "Upload"
	};
	form: FormGroup;
	labels = {
		title: "",
		description: "",
		shared: "",
		tracked: "",
		filename: "",
		uri: ""
	};
	files = new Array<{ data: File; percentage: string }>();

	private hash = "";
	private subscriptions: Array<Subscription>;

	get locale() {
		return this.configSvc.locale;
	}

	get color() {
		return this.configSvc.color;
	}

	ngOnInit() {
		this.mode = AppUtility.isNotEmpty(this.mode) ? this.mode.trim().toLowerCase() : "select";
		this.handlers = this.handlers || {};
		this.multiple = this.multiple !== undefined ? AppUtility.isTrue(this.multiple) : false;
		this.allowSelect = this.handlers.onSelect !== undefined && typeof this.handlers.onSelect === "function"
			? this.allowSelect !== undefined ? AppUtility.isTrue(this.allowSelect) : false
			: false;
		this.allowDelete = this.handlers.onDelete !== undefined && typeof this.handlers.onDelete === "function"
			? this.allowDelete !== undefined ? AppUtility.isTrue(this.allowDelete) : false
			: false;
		this.allowEdit = this.handlers.onEdit !== undefined && typeof this.handlers.onEdit === "function"
			? this.allowEdit !== undefined ? AppUtility.isTrue(this.allowEdit) : false
			: false;
		this.showIcons = this.showIcons !== undefined ? AppUtility.isTrue(this.showIcons) : false;
		this.accept = AppUtility.isNotEmpty(this.accept) ? this.accept.trim().toLowerCase() : "*";
		this.initializeAsync();
	}

	ngOnDestroy() {
		if (this.subscriptions !== undefined) {
			this.subscriptions.filter(subscription => subscription !== undefined).forEach(subscription => subscription.unsubscribe());
		}
	}

	async initializeAsync() {
		this.buttons = {
			select: await this.configSvc.getResourceAsync("common.buttons.select"),
			cancel: await this.configSvc.getResourceAsync("common.buttons.cancel"),
			update: await this.configSvc.getResourceAsync("common.buttons.update"),
			upload: await this.configSvc.getResourceAsync("common.buttons.upload")
		};
		if (this.mode === "edit") {
			this.initializeUpdateFormAsync();
		}
		else if (this.mode === "select") {
			await this.appFormsSvc.showLoadingAsync();
			await this.filesSvc.searchAttachmentsAsync(this.fileOptions, async attachments => {
				this.attachments = this.handlers.predicate !== undefined ? attachments.filter(this.handlers.predicate) : attachments;
				await this.appFormsSvc.hideLoadingAsync();
			});
		}
	}

	track(index: number, attachment: AttachmentInfo) {
		return `${attachment.ID}@${index}`;
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

	closeAsync(ids?: Array<string>) {
		return this.mode === "select"
			? ids === undefined || ids.length > 0
				? this.appFormsSvc.hideModalAsync(ids === undefined ? undefined : this.attachments.filter(attachment => ids.indexOf(attachment.ID) > -1))
				: new Promise<void>(() => {})
			: this.appFormsSvc.hideModalAsync();
	}

	private async initializeUpdateFormAsync() {
		this.labels = {
			title: await this.appFormsSvc.getResourceAsync("files.attachments.controls.title"),
			description: await this.appFormsSvc.getResourceAsync("files.attachments.controls.description"),
			shared: await this.appFormsSvc.getResourceAsync("files.attachments.controls.shared"),
			tracked: await this.appFormsSvc.getResourceAsync("files.attachments.controls.tracked"),
			filename: await this.appFormsSvc.getResourceAsync("files.attachments.controls.filename"),
			uri: await this.appFormsSvc.getResourceAsync("files.attachments.controls.uri")
		};
		this.form = new FormGroup({
			Title: new FormControl(this.attachment.Title, [Validators.required, Validators.maxLength(250)]),
			Description: new FormControl(this.attachment.Description, [Validators.maxLength(1000)]),
			IsShared: new FormControl(this.attachment.IsShared),
			IsTracked: new FormControl(this.attachment.IsTracked),
			Filename: new FormControl(this.attachment.Filename),
			URI: new FormControl(this.attachment.URIs.Direct)
		});
		this.hash = AppCrypto.hash(this.form.value);
	}

	async updateAsync() {
		if (this.hash === AppCrypto.hash(this.form.value)) {
			await this.appFormsSvc.hideModalAsync();
		}
		else {
			this.processing = true;
			const attachment = AppUtility.clone(this.attachment);
			attachment.Title = this.form.value.Title;
			attachment.Description = this.form.value.Description;
			attachment.IsShared = this.form.value.IsShared;
			attachment.IsTracked = this.form.value.IsTracked;
			await this.filesSvc.updateAttachmentAsync(
				attachment,
				async _ => await this.appFormsSvc.hideModalAsync(),
				async error => {
					await this.appFormsSvc.showErrorAsync(error);
					this.processing = false;
				}
			);
		}
	}

	trackFile(index: number, file: File) {
		return `${file.name}@${index}`;
	}

	onSelectFiles(event: any) {
		for (let index = 0; index < event.target.files.length; index++) {
			this.files.push({ data: event.target.files[index], percentage: "0%" });
		}
		this.filesSelector.nativeElement.value = "";
	}

	onDeleteQueuedFile(event: Event, index: number) {
		event.stopPropagation();
		AppUtility.removeAt(this.files, index);
	}

	uploadFiles() {
		if (this.files.length > 0) {
			this.processing = true;
			this.subscriptions = [];
			this.files.forEach((file, index) => this.subscriptions.push(this.filesSvc.uploadFile(
				this.filesSvc.getFormData(file.data),
				this.fileOptions,
				_ => PlatformUtility.invoke(() => {
					if (this.subscriptions !== undefined && this.subscriptions.length > index && this.subscriptions[index] !== undefined) {
						this.subscriptions[index].unsubscribe();
						this.subscriptions[index] = undefined;
					}
					if (this.subscriptions === undefined || this.subscriptions.find(subscription => subscription !== undefined) === undefined) {
						this.subscriptions = undefined;
						this.appFormsSvc.hideModalAsync();
					}
				}, 13),
				async error => {
					await this.appFormsSvc.showErrorAsync(error);
					this.processing = false;
				},
				percentage => this.files[index].percentage = percentage
			)));
		}
	}

}
