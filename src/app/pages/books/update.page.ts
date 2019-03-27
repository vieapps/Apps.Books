import { Component, OnInit, NgZone } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { AppCrypto } from "../../components/app.crypto";
import { AppEvents } from "../../components/app.events";
import { AppUtility } from "../../components/app.utility";
import { TrackingUtility } from "../../components/app.utility.trackings";
import { AppFormsControl, AppFormsService } from "../../components/forms.service";
import { ConfigurationService } from "../../providers/configuration.service";
import { AuthenticationService } from "../../providers/authentication.service";
import { FilesService } from "../../providers/files.service";
import { BooksService } from "../../providers/books.service";
import { Book } from "../../models/book";

@Component({
	selector: "page-books-update",
	templateUrl: "./update.page.html",
	styleUrls: ["./update.page.scss"]
})

export class BooksUpdatePage implements OnInit {
	constructor(
		public zone: NgZone,
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public authSvc: AuthenticationService,
		public filesSvc: FilesService,
		public booksSvc: BooksService
	) {
	}

	title = "";
	book: Book;
	update = {
		form: new FormGroup({}),
		controls: new Array<AppFormsControl>(),
		config: undefined as Array<any>,
		requestOnly: true,
		category: "",
		hash: "",
	};
	cover = {
		uri: undefined as string,
		image: undefined as string,
		title: "Cover",
		current: "Current",
		new: "New"
	};
	button = {
		update: "Update",
		cancel: "Cancel"
	};

	ngOnInit() {
		this.update.requestOnly = !this.authSvc.isServiceModerator(this.booksSvc.serviceName);
		this.initializeFormAsync();
	}

	async initializeFormAsync() {
		this.title = this.update.requestOnly
			? await this.configSvc.getResourceAsync("books.update.title.request")
			: await this.configSvc.getResourceAsync("books.update.title.update");
		this.button = {
			update: this.update.requestOnly
				? await this.configSvc.getResourceAsync("books.update.button")
				: await this.configSvc.getResourceAsync("common.buttons.update"),
			cancel: await this.configSvc.getResourceAsync("common.buttons.cancel")
		};
		this.cover.title = await this.configSvc.getResourceAsync("books.info.controls.Cover");
		this.cover.current = await this.configSvc.getResourceAsync("books.update.cover.current");
		this.cover.new = await this.configSvc.getResourceAsync("books.update.cover.new");
		this.book = Book.instances.getValue(this.configSvc.requestParams["ID"]);
		if (this.book === undefined) {
			await this.appFormsSvc.showToastAsync("Hmmmmmm....");
			await this.configSvc.navigateBackAsync();
		}
		else {
			const config = await this.configSvc.getDefinitionAsync(this.booksSvc.serviceName.toLowerCase(), "book", "form-controls") as Array<any>;
			const languageCtrl = config.find(control => control.Name === "Language");
			if (languageCtrl !== undefined && languageCtrl.Type === "TextBox") {
				languageCtrl.Type = "Select";
				languageCtrl.Options.SelectOptions = {
					Values: this.configSvc.languages.map(language => {
						return {
							Value: language.Value.substr(0, 2),
							Label: language.Label
						};
					})
				};
				if (config.find(control => true === control.Options.AutoFocus) === undefined) {
					config[0].Options.AutoFocus = true;
				}
				config.forEach((control, order) => control.Order = order);
				config.push({
					Name: "TOCs",
					Type: "TextArea",
					Required: this.book.TotalChapters > 1,
					Hidden: this.book.TotalChapters < 2,
					Options: {
						Type: "text",
						Label: "{{books.info.controls.TOCs}}",
						TextAreaRows: 10
					}
				});
			}
			this.update.config = config;
			this.cover.uri = AppUtility.isNotEmpty(this.book.Cover) ? this.book.Cover : undefined;
		}
	}

	onFormInitialized($event: any) {
		this.update.form.patchValue(this.book);
		this.update.form.controls["TOCs"].setValue(this.book.TOCs.join("\n"));
		this.update.category = this.book.Category;
		this.update.hash = AppCrypto.hash(this.update.form.value);
	}

	prepareCover($event: any) {
		this.cover.image = undefined;
		if ($event.target.files.length === 0) {
			return;
		}
		const fileReader = new FileReader();
		fileReader.onloadend = (loadEvent: any) => {
			this.cover.image = loadEvent.target.result;
		};
		fileReader.readAsDataURL($event.target.files[0]);
	}

	async uploadCoverAsync(onNext: () => void) {
		await this.filesSvc.uploadBase64DataAsync(
			"books",
			this.cover.image,
			data => {
				this.update.form.controls["Cover"].setValue(data.Uri);
				onNext();
			},
			error => {
				console.error("Error occurred while uploading cover image", error);
				onNext();
			},
			{
				"x-book-id": this.book.ID,
				"x-temporary": `${this.update.requestOnly}`
			}
		);
	}

	async updateBookAsync() {
		if (this.update.hash !== AppCrypto.hash(this.update.form.value)) {
			if (this.update.requestOnly) {
				await this.booksSvc.requestUpdateAsync(
					this.update.form.value,
					async () => {
						await Promise.all([
							this.appFormsSvc.hideLoadingAsync(async () => await TrackingUtility.trackAsync(this.title + " - " + this.book.Title, "books/request-update")),
							this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("books.update.messages.sent"))
						]);
						await this.configSvc.navigateBackAsync();
					},
					async error => await this.appFormsSvc.showErrorAsync(error)
				);
			}
			else {
				await this.booksSvc.updateAsync(
					this.update.form.value,
					async () => {
						await Promise.all([
							this.appFormsSvc.hideLoadingAsync(async () => await TrackingUtility.trackAsync(this.title + " - " + this.book.Title, "books/update")),
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
			await this.appFormsSvc.hideLoadingAsync(async () => await this.configSvc.navigateBackAsync());
		}
	}

	async updateAsync() {
		if (this.update.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.update.form);
		}
		else {
			await this.appFormsSvc.showLoadingAsync(this.title);
			if (this.cover.image !== undefined) {
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
			async () => await this.zone.run(async () => await this.configSvc.navigateBackAsync()),
			await this.configSvc.getResourceAsync("common.buttons.ok"),
			await this.configSvc.getResourceAsync("common.buttons.cancel")
		);
	}

}
