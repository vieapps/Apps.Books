import { Component, OnInit } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { AppCrypto } from "@components/app.crypto";
import { AppEvents } from "@components/app.events";
import { AppUtility } from "@components/app.utility";
import { TrackingUtility } from "@components/app.utility.trackings";
import { AppFormsControl, AppFormsControlConfig, AppFormsSegment, AppFormsService } from "@components/forms.service";
import { ConfigurationService } from "@services/configuration.service";
import { AuthenticationService } from "@services/authentication.service";
import { FilesService } from "@services/files.service";
import { BooksService } from "@services/books.service";
import { Book } from "@models/book";

@Component({
	selector: "page-books-update",
	templateUrl: "./update.page.html",
	styleUrls: ["./update.page.scss"]
})

export class BooksUpdatePage implements OnInit {
	constructor(
		public configSvc: ConfigurationService,
		private appFormsSvc: AppFormsService,
		private authSvc: AuthenticationService,
		private filesSvc: FilesService,
		private booksSvc: BooksService
	) {
	}

	title = "";
	book: Book;
	update = {
		form: new FormGroup({}),
		config: undefined as Array<AppFormsControlConfig>,
		segments: {
			items: undefined as Array<AppFormsSegment>,
			default: "meta"
		},
		controls: new Array<AppFormsControl>(),
		requestOnly: true,
		category: "",
		hash: "",
	};
	button = {
		update: "Update",
		cancel: "Cancel"
	};

	ngOnInit() {
		this.update.requestOnly = !this.authSvc.isServiceModerator(this.booksSvc.name);
		this.initializeFormAsync();
	}

	async initializeFormAsync() {
		this.book = Book.get(this.configSvc.requestParams["ID"]);
		if (this.book === undefined) {
			await this.appFormsSvc.showToastAsync("Hmmmmmm....");
			await this.configSvc.navigateBackAsync();
			return;
		}

		this.title = this.update.requestOnly
			? await this.configSvc.getResourceAsync("books.update.title.request")
			: await this.configSvc.getResourceAsync("books.update.title.update");
		await this.appFormsSvc.showLoadingAsync(this.title);

		this.button = {
			update: this.update.requestOnly
				? await this.configSvc.getResourceAsync("books.update.button")
				: await this.configSvc.getResourceAsync("common.buttons.update"),
			cancel: await this.configSvc.getResourceAsync("common.buttons.cancel")
		};

		this.update.segments.items = [
			new AppFormsSegment("meta", await this.configSvc.getResourceAsync("books.update.segments.meta")),
			new AppFormsSegment("others", await this.configSvc.getResourceAsync("books.update.segments.others"))
		];

		const formConfig: Array<AppFormsControlConfig> = await this.configSvc.getDefinitionAsync(this.booksSvc.name.toLowerCase(), "book", "form-controls");
		formConfig.forEach(ctrl => ctrl.Segment = "meta");

		formConfig.push(
			{
				Name: "TOCs",
				Type: "TextArea",
				Required: this.book.TotalChapters > 1,
				Hidden: this.book.TotalChapters < 2,
				Segment: "others",
				Options: {
					Label: "{{books.info.controls.TOCs}}",
					Rows: 20
				}
			},
			{
				Name: "CoverImage",
				Type: "FilePicker",
				Segment: "others",
				Options: {
					Label: "{{books.info.controls.Cover}}",
					OnChanged: (event, formControl) => {
						const file: File = event.target.files !== undefined && event.target.files.length > 0 ? event.target.files[0] : undefined;
						if (file !== undefined) {
							this.filesSvc.readAsDataURL(
								file,
								data => formControl.setValue({ current: formControl.value.current, new: data }),
								1024000,
								async () => await this.appFormsSvc.showToastAsync("Too big...")
							);
						}
						else {
							formControl.setValue({ current: formControl.value.current, new: undefined });
						}
					},
					FilePickerOptions: {
						Accept: "image/png, image/jpeg",
						Multiple: false,
						AllowPreview: true,
						AllowDelete: true,
						OnDelete: (_, formControl) => formControl.setValue({ current: formControl.value.current, new: undefined })
					}
				}
			}
		);

		let control = formConfig.find(ctrl => ctrl.Name === "Language");
		if (control !== undefined && control.Type === "TextBox") {
			control.Type = "Select";
			control.Options = control.Options || {};
			control.Options.SelectOptions = {
				Values: this.configSvc.languages.map(language => {
					return {
						Value: language.Value.substr(0, 2),
						Label: language.Label
					};
				}),
				Interface: "popover"
			};
		}

		control = formConfig.find(ctrl => ctrl.Options !== undefined && ctrl.Options.AutoFocus);
		if (control === undefined) {
			control = formConfig.find(ctrl => ctrl.Type === "TextBox" && ctrl.Options !== undefined && !ctrl.Hidden);
			if (control !== undefined) {
				control.Options.AutoFocus = true;
			}
		}

		this.update.config = formConfig;
		await TrackingUtility.trackAsync(`${this.title} - ${this.book.Title}`, "/books/update/open");
	}

	onFormInitialized() {
		this.update.form.patchValue(this.book);
		this.update.form.controls.TOCs.setValue(this.book.TOCs.join("\n"));
		this.update.form.controls.CoverImage.setValue({ current: AppUtility.isNotEmpty(this.book.Cover) ? this.book.Cover : undefined, new: undefined });
		this.update.category = this.book.Category;
		this.update.hash = AppCrypto.hash(this.update.form.value, value => delete value["CoverImage"]);
		this.appFormsSvc.hideLoadingAsync();
	}

	private uploadCoverAsync(onNext: () => void) {
		return this.filesSvc.uploadAsync(
			"books",
			this.update.form.controls.CoverImage.value.new,
			{
				"x-book-id": this.book.ID,
				"x-temporary": `${this.update.requestOnly}`
			},
			data => {
				this.update.form.controls.Cover.setValue(data.URI);
				onNext();
			},
			error => {
				console.error("Error occurred while uploading cover image", error);
				onNext();
			}
		);
	}

	updateBookAsync() {
		const bookInfo = this.update.form.value;
		delete bookInfo["CoverImage"];
		if (this.update.hash !== AppCrypto.hash(bookInfo)) {
			if (this.update.requestOnly) {
				return this.booksSvc.requestUpdateAsync(
					bookInfo,
					async () => {
						await Promise.all([
							this.appFormsSvc.hideLoadingAsync(async () => await TrackingUtility.trackAsync(`${this.title} - ${this.book.Title}`, "/books/update/request")),
							this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("books.update.messages.sent"))
						]);
						await this.configSvc.navigateBackAsync();
					},
					async error => await this.appFormsSvc.showErrorAsync(error)
				);
			}
			else {
				return this.booksSvc.updateAsync(
					bookInfo,
					async () => {
						await Promise.all([
							this.appFormsSvc.hideLoadingAsync(async () => await TrackingUtility.trackAsync(`${this.title} - ${this.book.Title}`, "/books/update")),
							this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("books.update.messages.success"))
						]);
						if (this.update.category !== this.update.form.value.Category) {
							AppEvents.broadcast("Books", { Type: "Moved", From: this.update.category, To: this.update.form.value.Category });
						}
						await this.configSvc.navigateBackAsync();
					},
					async error => await this.appFormsSvc.showErrorAsync(error)
				);
			}
		}
		else {
			return this.appFormsSvc.hideLoadingAsync(async () => await this.configSvc.navigateBackAsync());
		}
	}

	async updateAsync() {
		if (this.appFormsSvc.validate(this.update.form)) {
			await this.appFormsSvc.showLoadingAsync(this.title);
			if (this.update.form.controls.CoverImage.value.new !== undefined) {
				await this.uploadCoverAsync(async () => await this.updateBookAsync());
			}
			else {
				await this.updateBookAsync();
			}
		}
	}

	async cancelAsync() {
		await this.appFormsSvc.showAlertAsync(
			undefined,
			undefined,
			await this.configSvc.getResourceAsync("books.update.messages.confirm"),
			async () => await this.configSvc.navigateBackAsync(),
			await this.configSvc.getResourceAsync("common.buttons.ok"),
			await this.configSvc.getResourceAsync("common.buttons.cancel")
		);
	}

}
