import { Component, OnInit } from "@angular/core";
import { registerLocaleData } from "@angular/common";
import vi_VN from "@angular/common/locales/vi";
import en_US from "@angular/common/locales/en";
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
		registerLocaleData("vi_VN" === this.locale ? vi_VN : en_US);
	}

	profile = new UserProfile();
	bookmarks = new Array<Bookmark>();

	get locale() {
		return this.configSvc.appConfig.globalization.locale;
	}

	ngOnInit() {
		if (this.configSvc.isAuthenticated) {
			this.profile = this.configSvc.getAccount().profile;
			this.bookmarks = this.booksSvc.bookmarks.values();
		}
	}

	trackBookmark(index: number, bookmark: Bookmark) {
		return bookmark.ID;
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
			? (bookmark.Chapter > 0 ? "Chương: " + bookmark.Chapter + " - " : "") + "Vị trí: " + bookmark.Position
			: `${bookmark.Chapter}#${bookmark.Position}`;
	}

	open(bookmark: Bookmark) {
		this.configSvc.navigateForward(Book.instances.getValue(bookmark.ID).routerURI);
	}

	delete(bookmark: Bookmark) {
		this.booksSvc.deleteBookmark(bookmark.ID, () => this.bookmarks = this.booksSvc.bookmarks.values());
	}

}
