import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild } from "@angular/core";
import { IonList } from "@ionic/angular";
import { AppEvents } from "@components/app.events";
import { AppFormsService } from "@components/forms.service";
import { ConfigurationService } from "@services/configuration.service";
import { BooksService } from "@services/books.service";
import { UserProfile } from "@models/user";
import { Book, Bookmark } from "@models/book";

@Component({
	selector: "control-book-bookmarks",
	templateUrl: "./bookmarks.html",
	styleUrls: ["./bookmarks.scss"]
})

export class BookmarksControl implements OnInit, OnDestroy {

	constructor(
		private configSvc: ConfigurationService,
		private appFormsSvc: AppFormsService,
		private booksSvc: BooksService
	) {
	}

	/** The user profile that contains the bookmarks */
	@Input() profile: UserProfile;

	/** The event handler to run when the controls was initialized */
	@Output() init: EventEmitter<any> = new EventEmitter();

	/** The event handler to run when the control was changed */
	@Output() change = new EventEmitter<any>();

	bookmarks = new Array<Bookmark>();

	labels = {
		header: "Readings",
		footer: "Sync time:",
		chapter: "Chapter: ",
		position: "Position: ",
		buttons: {
			read: "Read",
			delete: "Delete"
		}
	};

	@ViewChild("list", { static: true }) private list: IonList;

	get color() {
		return this.configSvc.color;
	}

	get locale() {
		return this.configSvc.locale;
	}

	ngOnInit() {
		this.profile = this.profile || this.configSvc.getAccount().profile;
		Promise.all([this.initializeAsync()]).then(() => this.init.emit(this));

		AppEvents.on("App", info => {
			if ("LanguageChanged" === info.args.Type) {
				this.prepareLabelsAsync();
			}
		}, "LanguageChangedEventHandlerOfBookmarksControl");

		AppEvents.on("Session", info => {
			if ("Updated" === info.args.Type && this.configSvc.isAuthenticated) {
				this.profile = this.configSvc.getAccount().profile;
				this.prepareBookmarks();
			}
		}, "SessionEventHandlerOfBookmarksControl");

		AppEvents.on("Books", info => {
			if ("BookmarksUpdated" === info.args.Type) {
				this.prepareBookmarks();
				this.emitChanges();
			}
		}, "BookmarksUpdatedEventHandlerOfBookmarksControl");
	}

	ngOnDestroy() {
		this.list.closeSlidingItems();
		this.init.unsubscribe();
		this.change.unsubscribe();
		AppEvents.off("App", "LanguageChangedEventHandlerOfBookmarksControl");
		AppEvents.off("Session", "SessionEventHandlerOfBookmarksControl");
		AppEvents.off("Books", "BookmarksUpdatedEventHandlerOfBookmarksControl");
	}

	private async initializeAsync() {
		await this.prepareLabelsAsync();
		if (this.configSvc.isAuthenticated) {
			this.prepareBookmarks();
		}
	}

	private async prepareLabelsAsync() {
		this.labels = {
			header: await this.configSvc.getResourceAsync("books.bookmarks.header"),
			footer: await this.configSvc.getResourceAsync("books.bookmarks.footer"),
			chapter: await this.configSvc.getResourceAsync("books.bookmarks.chapter"),
			position: await this.configSvc.getResourceAsync("books.bookmarks.position"),
			buttons: {
				read: await this.configSvc.getResourceAsync("books.bookmarks.buttons.read"),
				delete: await this.configSvc.getResourceAsync("books.bookmarks.buttons.delete")
			}
		};
	}

	private prepareBookmarks() {
		this.bookmarks = this.booksSvc.bookmarks.toList().OrderByDescending(o => o.Time).ToArray();
	}

	private emitChanges() {
		this.change.emit({
			id: this.profile.ID,
			bookmarks: this.bookmarks,
			detail: {
				value: this.bookmarks
			}
		});
	}

	trackBookmark(index: number, bookmark: Bookmark) {
		return `${bookmark.ID}@${index}`;
	}

	getTitle(bookmark: Bookmark) {
		const book = Book.get(bookmark.ID);
		return book !== undefined
			? book.Title + (book.Author !== "" ? " - " + book.Author : "")
			: `${bookmark.ID}@${bookmark.Chapter}#${bookmark.Position}`;
	}

	getPosition(bookmark: Bookmark) {
		const book = Book.get(bookmark.ID);
		return book !== undefined
			? (bookmark.Chapter > 0 ? this.labels.chapter + bookmark.Chapter : "") + (bookmark.Position > 0 ?  (bookmark.Chapter > 0 ? " - " : "") + this.labels.position + bookmark.Position : "")
			: `${bookmark.Chapter}#${bookmark.Position}`;
	}

	async openAsync(bookmark: Bookmark) {
		const book = Book.get(bookmark.ID);
		if (book !== undefined) {
			await this.list.closeSlidingItems();
			await this.configSvc.navigateForwardAsync(book.routerURI);
		}
	}

	async deleteAsync(bookmark: Bookmark) {
		await this.list.closeSlidingItems();
		this.booksSvc.deleteBookmark(bookmark.ID, () => {
			this.prepareBookmarks();
			this.emitChanges();
		});
	}

	async sendAsync() {
		this.booksSvc.sendBookmarks();
		await this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("books.update.messages.sync"));
	}

}
