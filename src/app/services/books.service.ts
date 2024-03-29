import { Injectable } from "@angular/core";
import { AppStorage } from "@components/app.storage";
import { AppRTU, AppMessage } from "@components/app.apis";
import { AppEvents } from "@components/app.events";
import { AppUtility, Dictionary } from "@components/app.utility";
import { PlatformUtility } from "@components/app.utility.platform";
import { AppCustomCompleter } from "@components/app.completer";
import { AppPagination } from "@components/app.pagination";
import { CounterInfo } from "@models/counters";
import { StatisticBase, StatisticInfo } from "@models/statistics";
import { Book, Bookmark } from "@models/book";
import { Base as BaseService } from "@services/base.service";
import { ConfigurationService } from "@services/configuration.service";

@Injectable()

export class BooksService extends BaseService {

	constructor(
		private configSvc: ConfigurationService
	) {
		super("Books");
		this.initialize();
	}

	private _reading = {
		ID: undefined as string,
		Chapter: {
			Current: undefined as number,
			Previous: undefined as number
		}
	};

	private initialize() {
		AppEvents.on("App", async info => {
			if ("Initialized" === info.args.Type) {
				await this.initializeAsync(() => console.log(`[${this.name}]: The service is initialized`));
			}
			else if ("PlatformIsReady" === info.args.Type) {
				try {
					const categories = (await this.requestAsync("GET", `/assets/books/${this.configSvc.appConfig.language}/categories.json`) as Array<any>).map(s => StatisticInfo.deserialize(s));
					if (this.categories.length < 1) {
						this.categories = categories;
					}
				}
				catch { }

				try {
					const introductions = await this.requestAsync("GET", `/assets/books/${this.configSvc.appConfig.language}/introductions.json`);
					if (this.instructions[this.configSvc.appConfig.language] === undefined) {
						this.updateInstructions(introductions as { [key: string]: string; });
					}
				}
				catch { }
			}
		});
		this.registerEventHandlers();
	}

	public async initializeAsync(onNext?: () => void) {
		if ("initialized" === this.configSvc.appConfig.extras["Books-State"]) {
			console.log(`[${this.name}]: The service is initialized`);
			if (onNext !== undefined) {
				onNext();
			}
			return;
		}

		await Promise.all([
			this.loadInstructionsAsync(async () => await this.fetchInstructionsAsync()),
			this.loadStatisticsAsync(() => {
				const numberOfCategories = this.configSvc.appConfig.extras["Books-Categories"] !== undefined
					? (this.configSvc.appConfig.extras["Books-Categories"] as Array<StatisticInfo>).length
					: 0;
				let numberOfAuthors = 0;
				if (this.configSvc.appConfig.extras["Books-Authors"] !== undefined) {
					(this.configSvc.appConfig.extras["Books-Authors"] as Dictionary<string, Array<StatisticBase>>).toArray().forEach(info => numberOfAuthors += info.length);
				}
				console.log(`[${this.name}]: The statistics are loaded` + "\n- " + `Number of categories: ${numberOfCategories}` + "\n- " + `Number of authors: ${numberOfAuthors}`);
			}),
			this.updateSearchIntoSidebarAsync()
		]);

		if (this.configSvc.isAuthenticated) {
			await this.loadBookmarksAsync(() => {
				const bookmarks = this.configSvc.appConfig.extras["Books-Bookmarks"] as Dictionary<string, Bookmark>;
				console.log(`[${this.name}]: The bookmarks are loaded` + "\n- " + `Number of bookmarks: ${bookmarks !== undefined ? bookmarks.size : 0}`);
			});
		}

		this.configSvc.appConfig.extras["Books-State"] = "initialized";
		if (onNext !== undefined) {
			onNext();
		}
	}

	public registerEventHandlers() {
		AppRTU.registerAsObjectScopeProcessor(this.name, "Book", message => this.processUpdateBookMessage(message));
		AppRTU.registerAsObjectScopeProcessor(this.name, "Statistic", async message => await this.processUpdateStatisticMessageAsync(message));
		AppRTU.registerAsObjectScopeProcessor(this.name, "Bookmarks", async message => await this.processUpdateBookmarkMessageAsync(message));
		AppRTU.registerAsServiceScopeProcessor("Scheduler", () => {
			if (this.configSvc.isAuthenticated) {
				this.sendBookmarks();
			}
		});

		AppEvents.on("App", async info => {
			if ("LanguageChanged" === info.args.Type) {
				PlatformUtility.invoke(async () => await Promise.all([
					this.updateSearchIntoSidebarAsync(),
					this._reading.ID === undefined ? this.updateCategoriesIntoSidebarAsync() : new Promise<void>(() => {})
				]), 234);
			}
			else if ("HomePageIsOpened" === info.args.Type && this._reading.ID !== undefined) {
				await this.updateCategoriesIntoSidebarAsync();
				this._reading.ID = undefined;
			}
		});

		AppEvents.on("Account", async info => {
			if ("Updated" === info.args.Type && this.configSvc.isAuthenticated) {
				await this.loadBookmarksAsync(() => this.getBookmarks());
			}
		});

		AppEvents.on("Books", async info => {
			if ("CategoriesUpdated" === info.args.Type) {
				await this.updateCategoriesIntoSidebarAsync();
			}
			else if ("OpenBook" === info.args.Type) {
				const book = Book.get(info.args.ID);
				if (book !== undefined && book.TotalChapters > 1) {
					this.updateReading(book, info.args.Chapter || 1);
				}
			}
			else if ("CloseBook" === info.args.Type && this._reading.ID !== undefined) {
				await this.updateCategoriesIntoSidebarAsync();
				this._reading.ID = undefined;
				this._reading.Chapter.Current = undefined;
				this._reading.Chapter.Previous = undefined;
			}
		});
	}

	private async updateSearchIntoSidebarAsync() {
		AppEvents.broadcast("AddSidebarItem", {
			MenuIndex: 0,
			ItemInfo: {
				title: await this.configSvc.getResourceAsync("books.list.title.search"),
				url: "/books/search",
				icon: "search"
			}
		});
	}

	private async updateCategoriesIntoSidebarAsync() {
		AppEvents.broadcast("UpdateSidebar", {
			index: 1,
			title: await this.configSvc.getResourceAsync("books.home.statistics.categories"),
			items: this.categories.map(category => {
				return {
					title: category.Name,
					url: `/books/category/${AppUtility.toANSI(category.Name, true)}`,
					queryParams: {
						"x-request": AppUtility.toBase64Url({ Category: category.Name })
					},
					detail: category.Children !== undefined && category.Children.length > 0,
					direction: "root"
				};
			})
		});
	}

	private getTOCItem(book: Book, index: number, isReading: boolean) {
		return {
			title: book.TOCs[index],
			url: book.routerLink,
			queryParams: book.routerParams,
			detail: isReading,
			onClick: () => AppEvents.broadcast("Books", { Type: "OpenChapter", ID: book.ID, Chapter: index + 1 })
		};
	}

	private updateReading(book: Book, chapter: number) {
		if (book.ID !== this._reading.ID) {
			this._reading.ID = book.ID;
			this._reading.Chapter.Previous = undefined;
			this._reading.Chapter.Current = chapter - 1;
			AppEvents.broadcast("UpdateSidebar", {
				index: 1,
				title: book.Title,
				thumbnail: book.Cover,
				items: book.TOCs.map((toc, index) => this.getTOCItem(book, index, index === this._reading.Chapter.Current))
			});
		}
		else {
			this._reading.Chapter.Previous = this._reading.Chapter.Current;
			if (this._reading.Chapter.Previous > -1) {
				AppEvents.broadcast("UpdateSidebarItem", {
					MenuIndex: 1,
					ItemIndex: this._reading.Chapter.Previous,
					ItemInfo: this.getTOCItem(book, this._reading.Chapter.Previous, false)
				});
			}
			this._reading.Chapter.Current = chapter - 1;
			AppEvents.broadcast("UpdateSidebarItem", {
				MenuIndex: 1,
				ItemIndex: this._reading.Chapter.Current,
				ItemInfo: this.getTOCItem(book, this._reading.Chapter.Current, true)
			});
		}
	}

	public get completerDataSource() {
		const convertFn = (data: any) => {
			const book = data instanceof Book ? data as Book : Book.deserialize(data);
			return {
				title: book.Title,
				description: `${book.Author} - ${book.Category}`,
				image: book.Cover,
				originalObject: book
			};
		};
		return new AppCustomCompleter(
			term => AppUtility.format(super.getSearchURI("book", this.configSvc.relatedQuery), { request: AppUtility.toBase64Url(AppPagination.buildRequest({ Query: term })) }),
			data => (data.Objects as Array<any> || []).map(o => {
				Book.update(o);
				return convertFn(o);
			}),
			convertFn
		);
	}

	public search(request: any, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return super.search(
			super.getSearchURI("book", this.configSvc.relatedQuery),
			request,
			data => {
				if (data !== undefined && AppUtility.isArray(data.Objects, true)) {
					(data.Objects as Array<any>).forEach(o => Book.update(o));
				}
				if (onNext !== undefined) {
					onNext(data);
				}
			},
			error => {
				console.error(super.getErrorMessage("Error occurred while searching", error));
				if (onError !== undefined) {
					onError(error);
				}
			}
		);
	}

	public searchAsync(request: any, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return super.searchAsync(
			super.getSearchURI("book", this.configSvc.relatedQuery),
			request,
			data => {
				if (data !== undefined && AppUtility.isArray(data.Objects, true)) {
					(data.Objects as Array<any>).forEach(o => Book.update(o));
				}
				if (onNext !== undefined) {
					onNext(data);
				}
			},
			error => {
				console.error(super.getErrorMessage("Error occurred while searching", error));
				if (onError !== undefined) {
					onError(error);
				}
			}
		);
	}

	public getAsync(id: string, onNext?: (data?: any) => void, onError?: (error?: any) => void, dontUpdateCounter: boolean = false) {
		const book = Book.get(id);
		return book !== undefined && (book.TOCs.length > 0 || AppUtility.isNotEmpty(book.Body))
			? new Promise<void>(() => {
					if (!dontUpdateCounter) {
						this.increaseCounters(id);
					}
					if (onNext !== undefined) {
						onNext();
					}
				})
			: super.readAsync(
					super.getURI("book", id),
					data => {
						Book.update(data);
						if (!dontUpdateCounter) {
							this.increaseCounters(id);
						}
						if (onNext !== undefined) {
							onNext(data);
						}
					},
					error => {
						console.error(super.getErrorMessage("Error occurred while reading", error));
						if (onError !== undefined) {
							onError(error);
						}
					}
				);
	}

	public getChapter(id: string, chapter: number, onNext?: () => void) {
		const book = Book.get(id);
		while (chapter <= book.TotalChapters && book.Chapters[chapter - 1] !== "") {
			chapter++;
		}
		if (chapter <= book.TotalChapters) {
			if (book.Chapters[chapter - 1] === "" || book.Chapters[chapter - 1].startsWith("https://") || book.Chapters[chapter - 1].startsWith("http://")) {
				super.send({
					ServiceName: this.name,
					ObjectName: "book",
					Query: {
						"object-identity": "chapter",
						"id": id,
						"chapter": chapter + ""
					}
				}, data => this.updateChapter(data));
			}
			this.increaseCounters(id, "view", onNext);
		}
		else if (onNext !== undefined) {
			onNext();
		}
	}

	public getChapterAsync(id: string, chapter: number, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const book = Book.get(id);
		if (book === undefined || book.TOCs.length < 1) {
			return new Promise<void>(onNext !== undefined ? () => onNext() : () => {});
		}
		else if (chapter < 1 || chapter > book.Chapters.length || book.Chapters[chapter - 1] !== "") {
			return new Promise<void>(onNext !== undefined ? () => onNext() : () => {});
		}
		else {
			return super.readAsync(
				super.getURI("book", id, `chapter=${chapter}`),
				data => {
					this.updateChapter(data);
					this.increaseCounters(id, "view", onNext);
				},
				error => {
					console.error(super.getErrorMessage("Error occurred while reading a chapter", error));
					if (onError !== undefined) {
						onError(error);
					}
				}
			);
		}
	}

	private updateChapter(data: any) {
		const book = Book.get(data.ID);
		if (book !== undefined) {
			book.Chapters[data.Chapter - 1] = data.Content;
		}
	}

	public increaseCounters(id: string, action?: string, onNext?: (data?: any) => void) {
		if (Book.instances.contains(id)) {
			super.send({
				ServiceName: this.name,
				ObjectName: "book",
				Verb: "GET",
				Query: {
					"object-identity": "counters",
					"id": id,
					"action": action || "view"
				}
			}, data => this.updateCounters(data, onNext));
		}
		else if (onNext !== undefined) {
			onNext();
		}
	}

	private updateCounters(data: any, onNext?: (data?: any) => void) {
		const book = AppUtility.isObject(data, true)
			? Book.get(data.ID)
			: undefined;
		if (book !== undefined && AppUtility.isArray(data.Counters, true)) {
			(data.Counters as Array<any>).forEach(c => book.Counters.set(c.Type, CounterInfo.deserialize(c)));
			AppEvents.broadcast("Books", { Type: "StatisticsUpdated", ID: book.ID });
		}
		if (onNext !== undefined) {
			onNext(data);
		}
	}

	public generateFiles(id: string) {
		if (Book.instances.contains(id)) {
			super.send({
				ServiceName: this.name,
				ObjectName: "book",
				Verb: "GET",
				Query: {
					"object-identity": "files",
					"id": id
				}
			}, data => this.updateFiles(data));
		}
	}

	private updateFiles(data: any) {
		const book = data.ID !== undefined
			? Book.get(data.ID)
			: undefined;
		if (book !== undefined && AppUtility.isObject(data.Files, true)) {
			book.Files = data.Files;
			AppEvents.broadcast("Books", { Type: "FilesUpdated", ID: book.ID });
		}
	}

	public requestUpdateAsync(body: any, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return super.createAsync(
			super.getURI("book", body.ID),
			body,
			onNext,
			error => {
				console.error(super.getErrorMessage("Error occurred while requesting to update", error));
				if (onError !== undefined) {
					onError(error);
				}
			}
		);
	}

	public async updateAsync(body: any, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.updateAsync(
			super.getURI("book", body.ID),
			body,
			onNext,
			error => {
				console.error(super.getErrorMessage("Error occurred while updating", error));
				if (onError !== undefined) {
					onError(error);
				}
			}
	);
	}

	public async deleteAsync(id: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.deleteAsync(
			super.getURI("book", id),
			data => {
				Book.instances.remove(id);
				if (onNext !== undefined) {
					onNext(data);
				}
			},
			error => {
				console.error(super.getErrorMessage("Error occurred while deleting", error));
				if (onError !== undefined) {
					onError(error);
				}
			}
		);
	}

	private processUpdateBookMessage(message: AppMessage) {
		switch (message.Type.Event) {
			case "Counters":
				this.updateCounters(message.Data);
				break;
			case "Chapter":
				this.updateChapter(message.Data);
				break;
			case "Files":
				this.updateFiles(message.Data);
				break;
			case "Delete":
				Book.instances.remove(message.Data.ID);
				AppEvents.broadcast("Books", { Type: "Deleted", ID: message.Data.ID, Category: message.Data.Category, Author: message.Data.Author });
				break;
			default:
				if (AppUtility.isNotEmpty(message.Data.ID)) {
					Book.update(message.Data);
					AppEvents.broadcast("Books", { Type: "Updated", ID: message.Data.ID });
				}
				else if (this.configSvc.isDebug) {
					console.warn(super.getLogMessage("Got an update"), message);
				}
				break;
		}
	}

	public get instructions(): { [key: string]: { [key: string]: string } } {
		return this.configSvc.appConfig.extras["Books-Instructions"] || {};
	}

	private updateInstructions(instructions: { [key: string]: string }) {
		const introductions = this.instructions;
		if (instructions !== undefined) {
			introductions[this.configSvc.appConfig.language] = instructions;
			AppEvents.broadcast("Books", { Type: "InstructionsUpdated" });
		}
		this.configSvc.appConfig.extras["Books-Instructions"] = introductions;
	}

	private async loadInstructionsAsync(onNext?: () => void) {
		this.updateInstructions(await AppStorage.getAsync("Books-Instructions"));
		if (onNext !== undefined) {
			onNext();
		}
	}

	private async storeInstructionsAsync(onNext?: () => void) {
		await AppStorage.setAsync("Books-Instructions", this.instructions);
		if (onNext !== undefined) {
			onNext();
		}
	}

	public async fetchInstructionsAsync(onNext?: () => void) {
		await this.configSvc.getInstructionsAsync(
			this.name,
			this.configSvc.appConfig.language,
			async instructions => {
				this.updateInstructions(instructions);
				await this.storeInstructionsAsync(onNext);
			},
			error => this.showError("Error occurred while reading instructions", error)
		);
	}

	public get categories(): Array<StatisticInfo> {
		return this.configSvc.appConfig.extras["Books-Categories"] || [];
	}

	public set categories(value: Array<StatisticInfo>) {
		if (value !== undefined && value.length > 0) {
			this.configSvc.appConfig.extras["Books-Categories"] = value;
			AppEvents.broadcast("Books", { Type: "CategoriesUpdated" });
		}
	}

	private async loadCategoriesAsync(onNext?: (categories?: Array<StatisticInfo>) => void) {
		this.categories = (await AppStorage.getAsync("Books-Categories") as Array<any> || []).map(s => StatisticInfo.deserialize(s));
		if (onNext !== undefined) {
			onNext(this.categories);
		}
	}

	private async storeCategoriesAsync(onNext?: (categories?: Array<StatisticInfo>) => void) {
		await AppStorage.setAsync("Books-Categories", this.categories);
		if (onNext !== undefined) {
			onNext(this.categories);
		}
	}

	public get authors(): Dictionary<string, Array<StatisticBase>> {
		return this.configSvc.appConfig.extras["Books-Authors"] || new Dictionary<string, Array<StatisticBase>>();
	}

	private async loadAuthorsAsync(onNext?: (authors?: Dictionary<string, Array<StatisticBase>>) => void) {
		const authors = new Dictionary<string, Array<StatisticBase>>();
		await Promise.all(AppUtility.getChars().map(async char => {
			const authours = (await AppStorage.getAsync(`Books-Authors-${char}`) as Array<any> || []).map(s => StatisticBase.deserialize(s));
			authors.set(char, authours);
		}));
		this.configSvc.appConfig.extras["Books-Authors"] = authors;
		if (this.authors.size > 0) {
			AppEvents.broadcast("Books", { Type: "AuthorsUpdated", Data: authors });
		}
		if (onNext !== undefined) {
			onNext(this.authors);
		}
	}

	private async storeAuthorsAsync(onNext?: (authors?: Dictionary<string, Array<StatisticBase>>) => void) {
		const authors = this.authors;
		await Promise.all(AppUtility.getChars().map(char => AppStorage.setAsync(`Books-Authors-${char}`, authors.get(char) || [])));
		AppEvents.broadcast("Books", { Type: "AuthorsUpdated", Data: authors });
		if (onNext !== undefined) {
			onNext(this.authors);
		}
	}

	public get status() {
		const status = this.configSvc.appConfig.extras["Books-Status"] !== undefined
			? this.configSvc.appConfig.extras["Books-Status"] as Array<StatisticBase>
			: new Array<StatisticBase>();
		return {
			Books: (status.find(s => s.Name === "Books") || new StatisticBase()).Counters,
			Authors: (status.find(s => s.Name === "Authors") || new StatisticBase()).Counters
		};
	}

	private async loadStatisticsAsync(onNext?: () => void) {
		await Promise.all([
			this.loadCategoriesAsync(),
			this.loadAuthorsAsync()
		]).then(() => {
			super.send({
				ServiceName: this.name,
				ObjectName: "statistic",
				Query: {
					"object-identity": "all"
				}
			});
			if (onNext !== undefined) {
				onNext();
			}
		});
	}

	private processUpdateStatisticMessageAsync(message: AppMessage) {
		switch (message.Type.Event) {
			case "Categories":
				this.categories = (message.Data.Objects as Array<any>).map(s => StatisticInfo.deserialize(s));
				return this.storeCategoriesAsync();

			case "Authors":
				const authors = this.authors;
				authors.set(message.Data.Char, (message.Data.Objects as Array<any>).map(s => StatisticBase.deserialize(s)));
				this.configSvc.appConfig.extras["Books-Authors"] = authors;
				return this.storeAuthorsAsync();

			case "Status":
				return new Promise<void>(() => this.configSvc.appConfig.extras["Books-Status"] = (message.Data.Objects as Array<any>).map(s => StatisticBase.deserialize(s)));

			default:
				return new Promise<void>(message.Type.Event === "All" ? () => {} : () => console.warn(super.getLogMessage("Got an update message"), message));
		}
	}

	public get readingOptions() {
		this.configSvc.appConfig.options.extras[this.name] =
			this.configSvc.appConfig.options.extras[this.name] || {
				font: "default",
				size: "normal",
				color: "white",
				paragraph: "one",
				align: "align-left"
			};
		return this.configSvc.appConfig.options.extras[this.name] as { font: string, size: string, color: string, paragraph: string, align: string };
	}

	public get bookmarks() {
		this.configSvc.appConfig.extras["Books-Bookmarks"] = this.configSvc.appConfig.extras["Books-Bookmarks"] || new Dictionary<string, Bookmark>();
		return this.configSvc.appConfig.extras["Books-Bookmarks"] as Dictionary<string, Bookmark>;
	}

	private async loadBookmarksAsync(onNext?: () => void) {
		const bookmarks = new Dictionary<string, Bookmark>();
		(await AppStorage.getAsync("Books-Bookmarks") as Array<any> || []).forEach(data => {
			const bookmark = Bookmark.deserialize(data);
			bookmarks.set(bookmark.ID, bookmark);
		});
		this.configSvc.appConfig.extras["Books-Bookmarks"] = bookmarks;
		if (onNext !== undefined) {
			onNext();
		}
	}

	private async storeBookmarksAsync(onNext?: () => void) {
		await AppStorage.setAsync("Books-Bookmarks", this.bookmarks.values());
		AppEvents.broadcast("Books", { Type: "BookmarksUpdated" });
		if (onNext !== undefined) {
			onNext();
		}
	}

	private getBookmarks(onNext?: () => void) {
		super.send({
			ServiceName: this.name,
			ObjectName: "bookmarks"
		});
		if (onNext !== undefined) {
			onNext();
		}
	}

	public sendBookmarks(onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		super.send({
			ServiceName: this.name,
			ObjectName: "bookmarks",
			Verb: "POST",
			Body: this.bookmarks.toList().OrderByDescending(b => b.Time).Take(30).ToArray()
		}, onNext, onError);
	}

	private async updateBookmarksAsync(data: any, onNext?: () => void) {
		if (AppUtility.isTrue(data.Sync)) {
			this.bookmarks.clear();
		}
		(data.Objects as Array<any> || []).forEach(b => {
			const bookmark = Bookmark.deserialize(b);
			if (!this.bookmarks.contains(bookmark.ID)) {
				this.bookmarks.set(bookmark.ID, bookmark);
			}
			else if (bookmark.Time > this.bookmarks.get(bookmark.ID).Time) {
				this.bookmarks.set(bookmark.ID, bookmark);
			}
		});
		await this.storeBookmarksAsync(onNext);

		this.bookmarks.toArray(bookmark => !Book.instances.contains(bookmark.ID)).forEach(bookmark => super.send({
			ServiceName: this.name,
			ObjectName: "book",
			Query: {
				"object-identity": bookmark.ID
			}
		}));
	}

	public updateBookmarkAsync(id: string, chapter: number, position: number, onNext?: () => void) {
		const bookmark = this.bookmarks.get(id) || new Bookmark();
		bookmark.ID = id;
		bookmark.Chapter = chapter;
		bookmark.Position = position;
		bookmark.Time = new Date();
		this.bookmarks.set(bookmark.ID, bookmark);
		return this.storeBookmarksAsync(onNext);
	}

	public deleteBookmark(id: string, onNext?: () => void) {
		super.send({
			ServiceName: this.name,
			ObjectName: "bookmarks",
			Verb: "DELETE",
			Query: {
				"object-identity": id
			}
		});
		this.bookmarks.remove(id);
		if (onNext !== undefined) {
			onNext();
		}
	}

	private async processUpdateBookmarkMessageAsync(message: AppMessage) {
		if (!this.configSvc.isAuthenticated || this.configSvc.getAccount().id !== message.Data.ID) {
			return;
		}
		if (this.configSvc.getAccount().profile !== undefined) {
			this.configSvc.getAccount().profile.LastSync = new Date();
		}
		if ("Delete" === message.Type.Event) {
			this.bookmarks.remove(message.Data.ID);
			await this.storeBookmarksAsync();
		}
		else {
			await this.updateBookmarksAsync(message.Data);
		}
	}

	public sendRequestToCrawl(url: string, onNext?: () => void) {
		super.send({
			ServiceName: this.name,
			ObjectName: "crawl",
			Query: {
				url: url
			}
		});
		if (onNext !== undefined) {
			onNext();
		}
	}

	public sendRequestToReCrawl(id: string, url: string, mode: string) {
		super.send({
			ServiceName: this.name,
			ObjectName: "book",
			Query: {
				"object-identity": "recrawl",
				"id": id,
				"url": url,
				"full": ("full" === mode) + ""
			}
		});
	}

}
