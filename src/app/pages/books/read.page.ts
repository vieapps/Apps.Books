import * as Rx from "rxjs";
import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { registerLocaleData } from "@angular/common";
import { Content, MenuController } from "@ionic/angular";
import { AppEvents } from "../../components/app.events";
import { AppUtility } from "../../components/app.utility";
import { TrackingUtility } from "../../components/app.utility.trackings";
import { AppFormsService } from "../../components/forms.service";
import { ConfigurationService } from "../../providers/configuration.service";
import { AuthenticationService } from "../../providers/authentication.service";
import { BooksService } from "../../providers/books.service";
import { Book, Bookmark } from "../../models/book";

@Component({
	selector: "page-read-book",
	templateUrl: "./read.page.html",
	styleUrls: ["./read.page.scss"]
})
export class ReadBookPage implements OnInit, OnDestroy {
	constructor(
		public router: Router,
		public menuController: MenuController,
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public authSvc: AuthenticationService,
		public booksSvc: BooksService
	) {
		this.configSvc.locales.forEach(locale => registerLocaleData(this.configSvc.getLocaleData(locale)));
	}

	rxSubscriptions = new Array<Rx.Subscription>();
	title = "";
	book: Book;
	chapter = 0;
	scrollOffset = 0;
	options = {
		color: "",
		style: ""
	};
	actions: Array<{
		text: string,
		role: string,
		icon: string,
		handler: () => void
	}>;
	resources = {
		previous: "Previous",
		next: "Next",
		category: "Category",
		original: "Original",
		author: "Author",
		translator: "Translator",
		publisher: "Publisher",
		producer: "Producer",
		chapters: "Number of chapters",
		source: "Source"
	};
	@ViewChild(Content) contentCtrl: Content;

	get locale() {
		return this.configSvc.locale;
	}

	ngOnInit() {
		this.getReadingOptions();
		this.initializeAsync();

		AppEvents.on("App", info => {
			if ("OptionsUpdated" === info.args.Type) {
				this.getReadingOptions();
			}
		}, "OptionsEventHandlerOfReadBookPage");

		AppEvents.on("App", async info => {
			if ("LanguageChanged" === info.args.Type) {
				await Promise.all([
					this.prepareResourcesAsync(),
					this.prepareActionsAsync()
				]);
			}
		}, "LanguageChangedEventHandlerOfReadBookPage");

		AppEvents.on("Session", info => {
			if ("Updated" === info.args.Type) {
				this.prepareActionsAsync();
			}
		}, "AccountEventHandlerOfReadBookPage");

		AppEvents.on("Books", async info => {
			if ("OpenChapter" === info.args.Type && this.chapter !== info.args.Chapter) {
				this.scrollOffset = 0;
				this.chapter = info.args.Chapter || 0;
				if (this.book.Chapters[this.chapter - 1] === "") {
					await this.appFormsSvc.showLoadingAsync();
				}
				await this.goChapterAsync();
			}
		}, "OpenChapterEventHandlerOfReadBookPage");

		this.rxSubscriptions.push(this.router.events.subscribe(event => {
			if (event instanceof NavigationEnd && this.configSvc.currentUrl.startsWith(this.book.routerLink)) {
				this.configSvc.appTitle = this.book.Title + " - " + this.book.Author;
				this.jumpAsync();
			}
		}));
	}

	ngOnDestroy() {
		this.rxSubscriptions.forEach(subscription => subscription.unsubscribe());
		AppEvents.off("App", "OptionsEventHandlerOfReadBookPage");
		AppEvents.off("App", "LanguageChangedEventHandlerOfReadBookPage");
		AppEvents.off("Session", "AccountEventHandlerOfReadBookPage");
		AppEvents.off("Books", "OpenChapterEventHandlerOfReadBookPage");
	}

	onScrollEnd() {
		this.updateBookmarksAsync();
	}

	onSwipeLeft() {
		this.goNextAsync();
	}

	getReadingOptions() {
		this.options = {
			color: this.booksSvc.readingOptions.color,
			style: this.booksSvc.readingOptions.font + " " + this.booksSvc.readingOptions.size + " " + this.booksSvc.readingOptions.paragraph + " " + this.booksSvc.readingOptions.align
		};
	}

	async initializeAsync() {
		await this.appFormsSvc.showLoadingAsync();
		const id = this.configSvc.requestParams["ID"];
		await this.booksSvc.getAsync(id, async () => {
			this.book = Book.instances.getValue(id);
			if (this.book !== undefined) {
				this.title = this.configSvc.appTitle = this.book.Title + " - " + this.book.Author;
				await this.prepareAsync();
			}
			else {
				this.configSvc.navigateBack();
			}
		});
	}

	async prepareAsync() {
		if (this.chapter === 0) {
			const bookmark = this.booksSvc.bookmarks.getValue(this.book.ID);
			if (bookmark !== undefined) {
				this.chapter = bookmark.Chapter;
				this.scrollOffset = bookmark.Position;
			}
		}

		AppEvents.broadcast("Books", { Type: "OpenBook", ID: this.book.ID, Chapter: this.chapter });

		await Promise.all([
			this.prepareResourcesAsync(),
			this.prepareActionsAsync()
		]);

		if (this.chapter > 0) {
			await this.goChapterAsync();
		}
		else {
			this.scrollOffset = 0;
			await this.jumpAsync(async () => {
				if (this.book.TotalChapters > 1 && this.chapter < this.book.TotalChapters) {
					await this.booksSvc.fetchChapterAsync(this.book.ID, this.chapter + 1);
				}
			});
		}
	}

	async prepareResourcesAsync() {
		this.resources = {
			previous: await this.configSvc.getResourceAsync("books.read.navigate.previous"),
			next: await this.configSvc.getResourceAsync("books.read.navigate.next"),
			category: await this.configSvc.getResourceAsync("books.info.category"),
			original: await this.configSvc.getResourceAsync("books.info.original"),
			author: await this.configSvc.getResourceAsync("books.info.author"),
			translator: await this.configSvc.getResourceAsync("books.info.translator"),
			publisher: await this.configSvc.getResourceAsync("books.info.publisher"),
			producer: await this.configSvc.getResourceAsync("books.info.producer"),
			chapters: await this.configSvc.getResourceAsync("books.info.chapters"),
			source: await this.configSvc.getResourceAsync("books.info.source")
		};
	}

	async prepareActionsAsync() {
		this.actions = [
			this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("books.read.actions.author"), "bookmarks", () => this.configSvc.navigateForward("/books/list-by-author/" + AppUtility.toANSI(this.book.Author, true) + "?x-request=" + AppUtility.toBase64Url({ Author: this.book.Author }))),
			this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("books.read.actions.info"), "information-circle", () => this.openInfo()),
			this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("books.read.actions.toc"), "list", () => this.openTOCs()),
			this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("books.read.actions.options"), "options", () => this.openOptions())
		];

		if (this.authSvc.isServiceModerator()) {
			[
				this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("books.read.actions.crawl"), "build", async () => await this.showCrawlAsync()),
				this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("common.buttons.update"), "create", () => this.configSvc.navigateForward(this.book.routerURI.replace("/read/", "/update/"))),
				this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("common.buttons.delete"), "trash", async () => this.deleteAsync())
			].forEach(action => this.actions.push(action));
		}
	}

	async showActionsAsync() {
		await this.appFormsSvc.showActionSheetAsync(this.actions);
	}

	async showCrawlAsync() {
		await this.appFormsSvc.showAlertAsync(
			await this.configSvc.getResourceAsync("books.crawl.header"),
			undefined,
			undefined,
			async data => {
				if (AppUtility.isNotEmpty(data.SourceUrl)) {
					this.booksSvc.sendRequestToReCrawl(this.book.ID, this.book.SourceUrl, data);
					await this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("books.crawl.message"), 2000);
				}
			},
			await this.configSvc.getResourceAsync("books.crawl.button"),
			await this.configSvc.getResourceAsync("common.buttons.cancel"),
			[
				{
					type: "radio",
					label: await this.configSvc.getResourceAsync("books.crawl.mode.full"),
					value: "full",
					checked: this.book.SourceUrl === ""
				},
				{
					type: "radio",
					label: await this.configSvc.getResourceAsync("books.crawl.mode.missing"),
					value: "missing",
					checked: this.book.SourceUrl !== ""
				}
			]
		);
	}

	async goChapterAsync() {
		if (this.book.Chapters[this.chapter - 1] === "") {
			await this.booksSvc.getChapterAsync(
				this.book.ID,
				this.chapter,
				async () => await this.jumpAsync(async () => await this.booksSvc.fetchChapterAsync(this.book.ID, this.chapter + 1)),
				async error => await this.appFormsSvc.showErrorAsync(error)
			);
		}
		else {
			await this.jumpAsync(async () => await this.booksSvc.fetchChapterAsync(this.book.ID, this.chapter + 1));
		}
	}

	async goPreviousAsync() {
		if (this.chapter > 0 && this.book.TotalChapters > 1) {
			this.chapter--;
			this.scrollOffset = 0;
			await this.goChapterAsync();
		}
		else {
			console.log("Go Previous Book");
		}
	}

	async goNextAsync() {
		if (this.chapter < this.book.TotalChapters) {
			this.chapter++;
			this.scrollOffset = 0;
			if (this.book.Chapters[this.chapter - 1] === "") {
				await this.appFormsSvc.showLoadingAsync();
			}
			await this.goChapterAsync();
		}
		else {
			console.log("Go Next Book");
		}
	}

	async jumpAsync(onNext?: () => void) {
		if (this.book.TotalChapters > 1) {
			AppEvents.broadcast("Books", { Type: "OpenBook", ID: this.book.ID, Chapter: this.chapter });
		}
		if (this.scrollOffset > 0) {
			await this.contentCtrl.scrollByPoint(0, this.scrollOffset, 567);
		}
		else {
			await this.contentCtrl.scrollToTop(567);
		}
		await this.appFormsSvc.hideLoadingAsync(async () => {
			await TrackingUtility.trackAsync(this.title, this.book.routerLink);
			if (onNext !== undefined) {
				onNext();
			}
		});
	}

	async updateBookmarksAsync() {
		const scrollElement = await this.contentCtrl.getScrollElement();
		this.scrollOffset = scrollElement.scrollTop;
		const bookmark = this.booksSvc.bookmarks.getValue(this.book.ID) || new Bookmark();
		bookmark.ID = this.book.ID;
		bookmark.Chapter = this.chapter;
		bookmark.Position = this.scrollOffset;
		bookmark.Time = new Date();
		this.booksSvc.bookmarks.setValue(bookmark.ID, bookmark);
	}

	async deleteAsync() {
		await this.appFormsSvc.showAlertAsync(
			await this.configSvc.getResourceAsync("common.buttons.delete"),
			undefined,
			await this.configSvc.getResourceAsync("books.read.delete.confirm"),
			async () => await this.booksSvc.deleteAsync(
				this.book.ID,
				async () => {
					this.booksSvc.bookmarks.remove(this.book.ID);
					this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("books.read.delete.message"));
					this.configSvc.navigateBack();
				},
				error => this.appFormsSvc.showErrorAsync(error)
			),
			await this.configSvc.getResourceAsync("common.buttons.ok"),
			await this.configSvc.getResourceAsync("common.buttons.cancel")
		);
	}

	openTOCs() {
		this.menuController.open();
	}

	openInfo() {
		this.configSvc.navigateForward(this.book.routerURI.replace("/read/", "/info/"));
	}

	openOptions() {
		this.configSvc.navigateForward("/books/options");
	}

	close() {
		if (this.book.TotalChapters > 1) {
			AppEvents.broadcast("Books", { Type: "CloseBook", ID: this.book.ID, Chapter: this.chapter });
		}
		this.configSvc.navigateBack();
	}

}
