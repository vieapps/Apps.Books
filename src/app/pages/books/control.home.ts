import { List } from "linqts";
import { Component, OnInit, OnDestroy, OnChanges, Input } from "@angular/core";
import { Router } from "@angular/router";
import { registerLocaleData } from "@angular/common";
import { AppUtility } from "../../components/app.utility";
import { AppEvents } from "../../components/app.events";
import { ConfigurationService } from "../../providers/configuration.service";
import { BooksService } from "../../providers/books.service";
import { Book } from "../../models/book";

@Component({
	selector: "control-book-home-screen",
	templateUrl: "./control.home.html",
	styleUrls: ["./control.home.scss"]
})

export class BookHomeScreenControl implements OnInit, OnDestroy, OnChanges {

	constructor (
		public router: Router,
		public configSvc: ConfigurationService,
		public booksSvc: BooksService
	) {
		this.configSvc.locales.forEach(locale => registerLocaleData(this.configSvc.getLocaleData(locale)));
	}

	introduction = "";
	labels = {
		latest: "Latest",
		statistics: "Statistics:",
		authors: "Authors: ",
		books: "Articles & Books: "
	};
	books: Array<Book>;

	@Input() changes: any;

	get status() {
		return this.configSvc.isReady ? this.booksSvc.status : undefined;
	}

	get locale() {
		return this.configSvc.locale;
	}

	ngOnInit() {
		if (this.configSvc.isReady) {
			this.initializeAsync();
		}
		else {
			AppEvents.on("App", info => {
				if ("Initialized" === info.args.Type) {
					this.initializeAsync();
				}
			}, "AppReadyEventHandlerOfBookHomeScreen");
		}

		AppEvents.on("App", async info => {
			if ("LanguageChanged" === info.args.Type) {
				await this.prepareResourcesAsync();
				if (this.booksSvc.introductions[this.configSvc.appConfig.language] === undefined) {
					await this.booksSvc.fetchIntroductionsAsync(() => this.updateIntroduction());
				}
				else {
					this.updateIntroduction();
				}
			}
		}, "LanguageChangedEventHandlerOfBookHomeScreen");
	}

	ngOnChanges() {
		if (this.configSvc.isReady) {
			this.updateBooks();
		}
	}

	ngOnDestroy() {
		AppEvents.off("App", "AppReadyEventHandlerOfBookHomeScreen");
		AppEvents.off("App", "LanguageChangedEventHandlerOfBookHomeScreen");
	}

	private async prepareResourcesAsync() {
		this.labels = {
			latest: await this.configSvc.getResourceAsync("books.home.latest"),
			statistics: await this.configSvc.getResourceAsync("books.home.statistics.label"),
			authors: await this.configSvc.getResourceAsync("books.home.statistics.authors"),
			books: await this.configSvc.getResourceAsync("books.home.statistics.books")
		};
	}

	async initializeAsync() {
		await this.prepareResourcesAsync();

		if (this.booksSvc.introductions === undefined || this.booksSvc.introductions[this.configSvc.appConfig.language] === undefined) {
			await this.booksSvc.fetchIntroductionsAsync(() => this.updateIntroduction());
		}
		else {
			this.updateIntroduction();
		}

		if (this.books === undefined) {
			await this.booksSvc.searchAsync({ FilterBy: {}, SortBy: {} }, () => this.updateBooks());
		}
		else {
			this.updateBooks();
		}
	}

	updateIntroduction() {
		this.introduction = (this.booksSvc.introductions[this.configSvc.appConfig.language] || {}).introduction;
	}

	updateBooks() {
		this.books = AppUtility.getTopScores(new List(Book.instances.values()).OrderByDescending(o => o.LastUpdated).Take(40).ToArray(), 12);
	}

	trackBook(index: number, book: Book) {
		return `${book.ID}@${index}`;
	}

}
