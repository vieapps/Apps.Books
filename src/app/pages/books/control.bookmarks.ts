import { Component, OnInit } from "@angular/core";
import { ConfigurationService } from "../../providers/configuration.service";
import { BooksService } from "../../providers/books.service";
import { UserProfile } from "../../models/user";
import { Book, Bookmark } from "../../models/book";

@Component({
	selector: "control-book-bookmarks",
	templateUrl: "./control.bookmarks.html",
	styleUrls: ["./control.bookmarks.scss"]
})
export class BookmarksControl implements OnInit {

	constructor (
		public configSvc: ConfigurationService,
		public booksSvc: BooksService
	) {
	}

	profile = new UserProfile();
	bookmarks = new Array<Bookmark>();
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

	ngOnInit() {
		if (this.configSvc.isAuthenticated) {
			this.initializeAsync();
		}
	}

	async initializeAsync() {
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
		this.profile = this.configSvc.getAccount().profile;
		this.bookmarks = this.booksSvc.bookmarks.values();
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
			? (bookmark.Chapter > 0 ? this.resources.chapter + bookmark.Chapter + " - " : "") + this.resources.position + bookmark.Position
			: `${bookmark.Chapter}#${bookmark.Position}`;
	}

	open(bookmark: Bookmark) {
		this.configSvc.navigateForward(Book.instances.getValue(bookmark.ID).routerURI);
	}

	delete(bookmark: Bookmark) {
		this.booksSvc.deleteBookmark(bookmark.ID, () => this.bookmarks = this.booksSvc.bookmarks.values());
	}

}
