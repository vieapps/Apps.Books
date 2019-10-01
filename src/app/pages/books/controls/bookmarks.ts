import { List } from "linqts";
import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { IonList, IonItemSliding } from "@ionic/angular";
import { AppEvents } from "../../../components/app.events";
import { AppFormsService } from "../../../components/forms.service";
import { ConfigurationService } from "../../../services/configuration.service";
import { BooksService } from "../../../services/books.service";
import { UserProfile } from "../../../models/user";
import { Book, Bookmark } from "../../../models/book";

@Component({
	selector: "control-book-bookmarks",
	templateUrl: "./bookmarks.html",
	styleUrls: ["./bookmarks.scss"]
})

export class BookmarksControl implements OnInit, OnDestroy {

	constructor (
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public booksSvc: BooksService
	) {
	}

	bookmarks = new Array<Bookmark>();
	profile: UserProfile;
	resources = {
		header: "Readings",
		footer: "Sync time:",
		chapter: "Chapter: ",
		position: "Position: ",
		buttons: {
			read: "Read",
			delete: "Delete"
		}
	};
	@ViewChild("list", { static: true }) list: IonList;
	@ViewChild("slidingitems", { static: true }) slidingitems: IonItemSliding;

	get locale() {
		return this.configSvc.locale;
	}

	ngOnInit() {
		this.prepareResourcesAsync();

		if (this.configSvc.isAuthenticated) {
			this.profile = this.configSvc.getAccount().profile;
			this.prepareBookmarks();
		}

		AppEvents.on("App", async info => {
			if ("LanguageChanged" === info.args.Type) {
				await this.prepareResourcesAsync();
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
			}
		}, "BookmarksUpdatedEventHandlerOfBookmarksControl");
	}

	ngOnDestroy() {
		if (this.slidingitems !== undefined) {
			this.slidingitems.closeOpened();
		}
		AppEvents.off("App", "LanguageChangedEventHandlerOfBookmarksControl");
		AppEvents.off("Session", "SessionEventHandlerOfBookmarksControl");
		AppEvents.off("Books", "BookmarksUpdatedEventHandlerOfBookmarksControl");
	}

	async prepareResourcesAsync() {
		this.resources = {
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

	prepareBookmarks() {
		this.bookmarks = new List(this.booksSvc.bookmarks.values()).OrderByDescending(o => o.Time).ToArray();
	}

	trackBookmark(index: number, bookmark: Bookmark) {
		return `${bookmark.ID}@${index}`;
	}

	getTitle(bookmark: Bookmark) {
		const book = Book.instances.getValue(bookmark.ID);
		return book !== undefined
			? book.Title + (book.Author !== "" ? " - " + book.Author : "")
			: `${bookmark.ID}@${bookmark.Chapter}#${bookmark.Position}`;
	}

	getPosition(bookmark: Bookmark) {
		const book = Book.instances.getValue(bookmark.ID);
		return book !== undefined
			? (bookmark.Chapter > 0 ? this.resources.chapter + bookmark.Chapter : "") + (bookmark.Position > 0 ?  (bookmark.Chapter > 0 ? " - " : "") + this.resources.position + bookmark.Position : "")
			: `${bookmark.Chapter}#${bookmark.Position}`;
	}

	async openAsync(bookmark: Bookmark) {
		const book = Book.instances.getValue(bookmark.ID);
		if (book !== undefined) {
			await this.configSvc.navigateForwardAsync(book.routerURI);
		}
	}

	async deleteAsync(bookmark: Bookmark) {
		await this.list.closeSlidingItems();
		this.booksSvc.deleteBookmark(bookmark.ID, () => this.prepareBookmarks());
	}

	async sendAsync() {
		this.booksSvc.sendBookmarks();
		await this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("books.update.messages.sync"));
	}

}
