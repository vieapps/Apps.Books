import { Subscription } from "rxjs";
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
import { Book } from "../../models/book";

@Component({
	selector: "page-book-read",
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

	rxSubscription: Subscription;
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
		source: "Source",
		chapters: "Number of chapters"
	};
	@ViewChild(Content) contentCtrl: Content;

	get locale() {
		return this.configSvc.locale;
	}

	get canShowMore() {
		return this.configSvc.screenWidth > 767;
	}

	ngOnInit() {
		this.getReadingOptions();
		this.initializeAsync();

		AppEvents.on("App", async info => {
			if ("OptionsUpdated" === info.args.Type) {
				this.getReadingOptions();
			}
			else if ("LanguageChanged" === info.args.Type) {
				await Promise.all([
					this.prepareResourcesAsync(),
					this.prepareActionsAsync()
				]);
			}
		}, "AppEventHandlersOfReadBookPage");

		AppEvents.on("Session", async info => {
			if ("Updated" === info.args.Type) {
				await this.prepareActionsAsync();
			}
		}, "AppEventHandlersOfReadBookPage");

		AppEvents.on("Books", async info => {
			if ("OpenChapter" === info.args.Type && this.chapter !== info.args.Chapter) {
				this.scrollOffset = 0;
				this.chapter = info.args.Chapter || 0;
				if (this.book.Chapters[this.chapter - 1] === "") {
					await this.appFormsSvc.showLoadingAsync();
				}
				await this.goChapterAsync();
			}
			else if ("Deleted" === info.args.Type && this.book.ID === info.args.ID) {
				await this.closeAsync();
			}
		}, "BookEventHandlersOfReadBookPage");

		this.rxSubscription = this.router.events.subscribe(async event => {
			if (event instanceof NavigationEnd && this.configSvc.currentUrl.startsWith(this.book.routerLink)) {
				this.configSvc.appTitle = this.book.Title + " - " + this.book.Author;
				await this.scrollAsync();
			}
		});
	}

	ngOnDestroy() {
		AppEvents.off("App", "AppEventHandlersOfReadBookPage");
		AppEvents.off("Session", "AppEventHandlersOfReadBookPage");
		AppEvents.off("Books", "BookEventHandlersOfReadBookPage");
		this.rxSubscription.unsubscribe();
	}

	getReadingOptions() {
		this.options = {
			color: this.booksSvc.readingOptions.color,
			style: this.booksSvc.readingOptions.font + " " + this.booksSvc.readingOptions.size + " " + this.booksSvc.readingOptions.paragraph + " " + this.booksSvc.readingOptions.align
		};
	}

	async onScrollEndAsync() {
		this.scrollOffset = (await this.contentCtrl.getScrollElement()).scrollTop;
		await this.booksSvc.updateBookmarkAsync(this.book.ID, this.chapter, this.scrollOffset);
	}

	async onSwipeLeftAsync() {
		await this.goNextAsync();
	}

	async onSwipeRightAsync() {
		await this.openTOCsAsync();
	}

	async initializeAsync() {
		await this.appFormsSvc.showLoadingAsync();
		const id = this.configSvc.requestParams["ID"];
		await this.booksSvc.getAsync(
			id,
			async () => {
				this.book = Book.instances.getValue(id);
				if (this.book !== undefined) {
					this.title = this.configSvc.appTitle = this.book.Title + " - " + this.book.Author;
					await this.prepareAsync();
				}
				else {
					await this.appFormsSvc.hideLoadingAsync(async () => await this.configSvc.navigateBackAsync());
				}
			},
			async error => await this.appFormsSvc.showErrorAsync(error)
		);
	}

	async prepareAsync() {
		await Promise.all([
			this.prepareResourcesAsync(),
			this.prepareActionsAsync()
		]);

		if (this.chapter === 0) {
			const bookmark = this.booksSvc.bookmarks.getValue(this.book.ID);
			if (bookmark !== undefined) {
				this.chapter = bookmark.Chapter;
				this.scrollOffset = bookmark.Position;
			}
		}

		AppEvents.broadcast("Books", { Type: "OpenBook", ID: this.book.ID, Chapter: this.chapter });

		if (this.chapter > 0) {
			await this.goChapterAsync();
		}
		else {
			this.scrollOffset = 0;
			await this.scrollAsync(async () => {
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
			category: await this.configSvc.getResourceAsync("books.info.controls.Category"),
			original: await this.configSvc.getResourceAsync("books.info.controls.Original"),
			author: await this.configSvc.getResourceAsync("books.info.controls.Author"),
			translator: await this.configSvc.getResourceAsync("books.info.controls.Translator"),
			publisher: await this.configSvc.getResourceAsync("books.info.controls.Publisher"),
			producer: await this.configSvc.getResourceAsync("books.info.controls.Producer"),
			source: await this.configSvc.getResourceAsync("books.info.controls.Source"),
			chapters: await this.configSvc.getResourceAsync("books.info.chapters")
		};
	}

	async prepareActionsAsync() {
		this.actions = [
			this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("books.read.actions.author"), "bookmarks", async () => this.openAuthorAsync()),
			this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("books.read.actions.info"), "information-circle", async () => this.openInfoAsync()),
			this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("books.read.actions.toc"), "list", async () => this.openTOCsAsync()),
			this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("books.read.actions.options"), "options", async () => this.openOptionsAsync())
		];

		if (this.book !== undefined && this.book.TotalChapters < 2) {
			AppUtility.removeAt(this.actions, 2);
		}

		if (this.authSvc.isServiceModerator(this.booksSvc.serviceName)) {
			[
				this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("books.read.actions.crawl"), "build", async () => await this.openRecrawlAsync()),
				this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("common.buttons.update"), "create", async () => await this.openUpdateAsync()),
				this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("common.buttons.delete"), "trash", async () => this.deleteAsync())
			].forEach(action => this.actions.push(action));
		}
	}

	async showActionsAsync() {
		await this.appFormsSvc.showActionSheetAsync(this.actions);
	}

	async goChapterAsync(direction: string = "next") {
		if (this.book.Chapters[this.chapter - 1] === "") {
			await this.appFormsSvc.showLoadingAsync();
			await this.booksSvc.getChapterAsync(
				this.book.ID,
				this.chapter,
				async () => await this.scrollAsync(async () => await this.booksSvc.fetchChapterAsync(this.book.ID, direction === "previous" ? this.chapter - 1 : this.chapter + 1)),
				async error => await this.appFormsSvc.showErrorAsync(error)
			);
		}
		else {
			await this.scrollAsync(async () => await this.booksSvc.fetchChapterAsync(this.book.ID, this.chapter + 1));
		}
	}

	async goPreviousAsync() {
		if (this.book.TotalChapters < 2) {
			const books = Book.instances.values().filter(book => book.Category === this.book.Category);
			const index = books.findIndex(book => book.ID === this.book.ID);
			if (index > 0) {
				await this.configSvc.navigateForwardAsync(books[index - 1].routerURI);
			}
		}
		else if (this.chapter > 0) {
			this.chapter--;
			this.scrollOffset = 0;
			await this.goChapterAsync("previous");
		}
	}

	async goNextAsync() {
		if (this.book.TotalChapters < 2) {
			const books = Book.instances.values().filter(book => book.Category === this.book.Category);
			const index = books.findIndex(book => book.ID === this.book.ID);
			if (index > -1 && index < books.length - 2) {
				await this.configSvc.navigateForwardAsync(books[index + 1].routerURI);
			}
		}
		else if (this.chapter < this.book.TotalChapters) {
			this.chapter++;
			this.scrollOffset = 0;
			await this.goChapterAsync();
		}
	}

	async scrollAsync(onNext?: () => void) {
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

	async deleteAsync() {
		await this.appFormsSvc.showAlertAsync(
			await this.configSvc.getResourceAsync("common.buttons.delete"),
			undefined,
			await this.configSvc.getResourceAsync("books.read.delete.confirm"),
			async () => await this.booksSvc.deleteAsync(
				this.book.ID,
				async () => this.booksSvc.deleteBookmark(this.book.ID, async () => await this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("books.read.delete.message", { title: this.book.Title }))),
				async error => await this.appFormsSvc.showErrorAsync(error)
			),
			await this.configSvc.getResourceAsync("common.buttons.ok"),
			await this.configSvc.getResourceAsync("common.buttons.cancel")
		);
	}

	async openAuthorAsync() {
		await this.configSvc.navigateForwardAsync("/books/list-by-author/" + AppUtility.toANSI(this.book.Author, true) + "?x-request=" + AppUtility.toBase64Url({ Author: this.book.Author }));
	}

	async openTOCsAsync() {
		await this.menuController.open();
	}

	async openInfoAsync() {
		await this.configSvc.navigateForwardAsync(this.book.routerURI.replace("/read/", "/info/"));
	}

	async openOptionsAsync() {
		await this.configSvc.navigateForwardAsync("/books/options");
	}

	async openRecrawlAsync() {
		await this.appFormsSvc.showAlertAsync(
			await this.configSvc.getResourceAsync("books.crawl.header"),
			undefined,
			undefined,
			async mode => {
				this.booksSvc.sendRequestToReCrawl(this.book.ID, this.book.SourceUrl, mode);
				await this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("books.crawl.message"), 2000);
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

	async openUpdateAsync() {
		await this.configSvc.navigateForwardAsync(this.book.routerURI.replace("/read/", "/update/"));
	}

	async closeAsync() {
		if (this.book.TotalChapters > 1) {
			AppEvents.broadcast("Books", { Type: "CloseBook", ID: this.book.ID });
		}
		await this.configSvc.navigateBackAsync();
	}

}
