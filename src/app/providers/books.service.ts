import * as Collections from "typescript-collections";
import { List } from "linqts";
import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import { Storage } from "@ionic/storage";
import { AppRTU } from "../components/app.rtu";
import { AppEvents } from "../components/app.events";
import { AppUtility } from "../components/app.utility";
import { PlatformUtility } from "../components/app.utility.platform";
import { AppCustomCompleter } from "../components/app.completer";
import { AppPagination } from "../components/app.pagination";
import { CounterInfo } from "../models/counters";
import { StatisticBase, StatisticInfo } from "../models/statistics";
import { Book, Bookmark } from "../models/book";
import { Base as BaseService } from "./base.service";
import { ConfigurationService } from "./configuration.service";

@Injectable()
export class BooksService extends BaseService {

	constructor (
		public http: Http,
		public storage: Storage,
		public configSvc: ConfigurationService
	) {
		super(http, "Books");
		AppRTU.registerAsObjectScopeProcessor(this.Name, "Book", async message => await this.processUpdateBookMessageAsync(message));
		AppRTU.registerAsObjectScopeProcessor(this.Name, "Statistic", async message => await this.processUpdateStatisticMessageAsync(message));
		AppRTU.registerAsObjectScopeProcessor(this.Name, "Bookmarks", async message => await this.processUpdateBookmarkMessageAsync(message));
		AppRTU.registerAsServiceScopeProcessor("Scheduler", () => this.sendBookmarks());
		if (this.configSvc.isDebug) {
			AppRTU.registerAsServiceScopeProcessor(this.Name, () => {});
		}

		AppEvents.on("App", async info => {
			if ("Initialized" === info.args.Type) {
				await Promise.all([
					this.loadIntroductionsAsync(async () => await this.fetchIntroductionsAsync()),
					this.loadStatisticsAsync(),
					this.updateSearchIntoSidebarAsync()
				]);
				if (this.configSvc.isAuthenticated) {
					await this.loadBookmarksAsync();
				}
			}
		});

		AppEvents.on("Session", async info => {
			if (this.configSvc.isAuthenticated && AppRTU.isReady && "Updated" === info.args.Type) {
				await this.loadBookmarksAsync(() => this.getBookmarks());
			}}
		);

		AppEvents.on("App", async info => {
			if ("LanguageChanged" === info.args.Type) {
				PlatformUtility.setTimeout(async () => {
					this.updateSearchIntoSidebarAsync();
					if (this._reading.ID === undefined) {
						await this.updateCategoriesIntoSidebarAsync();
					}
				}, 234);
			}
			else if ("HomePageIsOpened" === info.args.Type && this._reading.ID !== undefined) {
				await this.updateCategoriesIntoSidebarAsync();
				this._reading.ID = undefined;
			}
		});

		AppEvents.on("Books", async info => {
			if ("CategoriesUpdated" === info.args.Type || "CloseBook" === info.args.Type) {
				await this.updateCategoriesIntoSidebarAsync();
				if ("CloseBook" === info.args.Type) {
					this._reading.ID = undefined;
				}
			}
		});

		AppEvents.on("Books", async info => {
			if ("OpenBook" === info.args.Type) {
				const book = Book.instances.getValue(info.args.ID);
				if (book !== undefined && book.TotalChapters > 1) {
					await this.updateReadingAsync(book, info.args.Chapter || 1);
				}
			}
		});
	}

	private _reading = {
		ID: undefined as string,
		Chapter: {
			Current: undefined as number,
			Previous: undefined as number
		}
	};

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
		const parent = this.configSvc.requestParams["parent"];
		AppEvents.broadcast("UpdateSidebar", {
			index: 1,
			title: await this.configSvc.getResourceAsync("books.home.statistics.categories"),
			items: this.categories.map((category, index) => {
				return {
					title: category.Name,
					url: `/books/list-by-category/${AppUtility.toANSI(category.Name, true)}`,
					queryParams: {
						"x-request": AppUtility.toBase64Url({
							Category: category.Name,
							Index: index,
							Parent: parent
						})
					},
					detail: category.Children !== undefined && category.Children.length > 0
				};
			})
		});
	}

	public get searchURI() {
		return `books/book/search?${this.configSvc.relatedQuery}&x-request=`;
	}

	public get completerDataSource() {
		return new AppCustomCompleter(
			term => this.searchURI + AppUtility.toBase64Url(AppPagination.buildRequest({ Query: term })),
			data => (data.Objects as Array<any> || []).map(o => {
				const book = Book.deserialize(o);
				return {
					title: book.Title,
					description: book.Category,
					image: book.Cover,
					originalObject: book
				};
			})
		);
	}

	public async searchAsync(request: any, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.searchAsync(
			this.searchURI,
			request,
			AppUtility.isNotNull(onNext)
				? data => {
					if (data !== undefined) {
						(data.Objects as Array<any> || []).forEach(o => Book.update(o));
					}
					onNext(data);
				}
				: undefined,
			error => {
				console.error(this.getErrorMessage("Error occurred while searching", error));
				if (onError !== undefined) {
					onError(error);
				}
			}
		);
	}

	public async getAsync(id: string, onNext?: (data?: any) => void, onError?: (error?: any) => void, dontUpdateCounter?: boolean) {
		const book = Book.instances.getValue(id);
		if (book !== undefined && (book.TOCs.length > 0 || book.Body !== "")) {
			if (AppUtility.isFalse(dontUpdateCounter)) {
				this.increaseCounters(id);
			}
			if (onNext !== undefined) {
				onNext();
			}
		}
		else {
			await super.readAsync(
				`books/book/${id}`,
				data => {
					Book.update(data);
					if (AppUtility.isFalse(dontUpdateCounter)) {
						this.increaseCounters(id);
					}
					if (onNext !== undefined) {
						onNext(data);
					}
				},
				error => {
					console.error(this.getErrorMessage("Error occurred while reading", error));
					if (onError !== undefined) {
						onError(error);
					}
				}
			);
		}
	}

	public async getChapterAsync(id: string, chapter: number, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const book = Book.instances.getValue(id);
		if (book === undefined || book.TOCs.length < 1) {
			if (onError !== undefined) {
				onError();
			}
		}
		else if (chapter < 1 || chapter > book.Chapters.length || book.Chapters[chapter - 1] !== "") {
			if (onNext !== undefined) {
				onNext();
			}
		}
		else {
			await super.readAsync(
				`books/book/${id}?chapter=${chapter}`,
				data => {
					this.updateChapter(data);
					this.increaseCounters(id);
					if (onNext !== undefined) {
						onNext(data);
					}
				},
				error => {
					console.error(this.getErrorMessage("Error occurred while reading a chapter", error));
					if (onError !== undefined) {
						onError(error);
					}
				}
			);
		}
	}

	public async fetchChapterAsync(id: string, chapter: number, onCompleted?: () => void) {
		const book = Book.instances.getValue(id);
		while (chapter < book.TotalChapters && book.Chapters[chapter - 1] !== "") {
			chapter += 1;
		}
		if (book.Chapters[chapter - 1] === "") {
			super.send({
				ServiceName: this.Name,
				ObjectName: "book",
				Verb: "GET",
				Query: {
					"object-identity": "chapter",
					"id": id,
					"chapter": chapter
				},
				Header: undefined,
				Body: undefined,
				Extra: undefined
			}, data => this.updateChapter(data));
		}
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	private updateChapter(data: any) {
		const book = Book.instances.getValue(data.ID);
		if (book !== undefined) {
			book.Chapters[data.Chapter - 1] = data.Content;
			this.increaseCounters(data.ID, "view");
		}
}

	public increaseCounters(id: string, action?: string, onCompleted?: () => void) {
		if (Book.instances.containsKey(id)) {
			super.send({
				ServiceName: this.Name,
				ObjectName: "book",
				Verb: "GET",
				Query: {
					"object-identity": "counters",
					"id": id,
					"action": action || "view"
				},
				Header: undefined,
				Body: undefined,
				Extra: undefined
			}, data => this.updateCounters(data));
		}
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	public updateCounters(data: any, onCompleted?: () => void) {
		const book = AppUtility.isObject(data, true)
			? Book.instances.getValue(data.ID)
			: undefined;
		if (book !== undefined && AppUtility.isArray(data.Counters)) {
			(data.Counters as Array<any>).forEach(c => book.Counters.setValue(c.Type, CounterInfo.deserialize(c)));
			AppEvents.broadcast("Books", { Type: "StatisticsUpdated", ID: book.ID });
		}
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	public generateFiles(id: string) {
		if (Book.instances.containsKey(id)) {
			super.send({
				ServiceName: this.Name,
				ObjectName: "book",
				Verb: "GET",
				Query: {
					"object-identity": "files",
					"id": id
				},
				Header: undefined,
				Body: undefined,
				Extra: undefined
			}, data => this.updateFiles(data));
		}
	}

	private updateFiles(data: any) {
		const book = data.ID !== undefined
			? Book.instances.getValue(data.ID)
			: undefined;
		if (book !== undefined && AppUtility.isObject(data.Files, true)) {
			book.Files = data.Files;
			AppEvents.broadcast("Books", { Type: "FilesUpdated", ID: book.ID });
		}
	}

	public async requestUpdateAsync(body: any, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.createAsync(
			`books/book/${body.ID}`,
			body,
			onNext,
			error => {
				console.error(this.getErrorMessage("Error occurred while requesting to update", error));
				if (onError !== undefined) {
					onError(error);
				}
			}
		);
	}

	public async updateAsync(body: any, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.updateAsync(
			`books/book/${body.ID}`,
			body,
			onNext,
			error => {
				console.error(this.getErrorMessage("Error occurred while updating", error));
				if (onError !== undefined) {
					onError(error);
				}
			}
	);
	}

	public async deleteAsync(id: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await super.deleteAsync(
			`books/book/${id}`,
			data => {
				Book.instances.remove(id);
				if (onNext !== undefined) {
					onNext(data);
				}
			},
			error => {
				console.error(this.getErrorMessage("Error occurred while deleting", error));
				if (onError !== undefined) {
					onError(error);
				}
			}
		);
	}

	private async processUpdateBookMessageAsync(message: { Type: { Service: string, Object: string, Event: string }, Data: any }) {
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
				AppEvents.broadcast("Books", { Type: "Deleted", Data: message.Data });
				break;
			default:
				Book.update(message.Data);
				AppEvents.broadcast("Books", { Type: "Updated", Data: message.Data });
				break;
		}
	}

	public get introductions() {
		this.configSvc.appConfig.extras["Books-Introductions"] = this.configSvc.appConfig.extras["Books-Introductions"] || {};
		return this.configSvc.appConfig.extras["Books-Introductions"] as { [key: string]: { [key: string]: string } };
	}

	private async loadIntroductionsAsync(onCompleted?: () => void) {
		this.configSvc.appConfig.extras["Books-Introductions"] = await this.storage.get("VIEApps-Books-Introductions") || this.introductions;
		if (this.introductions !== undefined) {
			AppEvents.broadcast("Books", { Type: "InstroductionsUpdated", Data: this.introductions });
		}
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	private async storeIntroductionsAsync(onCompleted?: () => void) {
		await this.storage.set("VIEApps-Books-Introductions", this.introductions);
		AppEvents.broadcast("Books", { Type: "InstroductionsUpdated", Data: this.introductions });
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	public async fetchIntroductionsAsync(onCompleted?: () => void) {
		await super.readAsync(
			`statics/services/${this.Name.toLowerCase()}/${this.configSvc.appConfig.language}.json`,
			async data => {
				this.configSvc.appConfig.extras["Books-Introductions"][this.configSvc.appConfig.language] = data;
				await this.storeIntroductionsAsync(onCompleted);
			},
			error => {
				this.showError("Error occurred while reading introductions", error);
				if (onCompleted !== undefined) {
					onCompleted();
				}
			}
		);
	}

	public get categories() {
		return this.configSvc.appConfig.extras["Books-Categories"] !== undefined
			? this.configSvc.appConfig.extras["Books-Categories"] as Array<StatisticInfo>
			: new Array<StatisticInfo>();
	}

	private async loadCategoriesAsync(onCompleted?: (categories?: Array<StatisticInfo>) => void) {
		const categories = (await this.storage.get("VIEApps-Books-Categories") as Array<any> || []).map(s => StatisticInfo.deserialize(s));
		this.configSvc.appConfig.extras["Books-Categories"] = categories;
		if (categories.length > 0) {
			AppEvents.broadcast("Books", { Type: "CategoriesUpdated", Data: categories });
		}
		if (onCompleted !== undefined) {
			onCompleted(categories);
		}
	}

	private async storeCategoriesAsync(onCompleted?: (categories?: Array<StatisticInfo>) => void) {
		await this.storage.set("VIEApps-Books-Categories", this.categories);
		AppEvents.broadcast("Books", { Type: "CategoriesUpdated", Data: this.categories });
		if (onCompleted !== undefined) {
			onCompleted(this.categories);
		}
	}

	public get authors() {
		return this.configSvc.appConfig.extras["Books-Authors"] !== undefined
			? this.configSvc.appConfig.extras["Books-Authors"] as Collections.Dictionary<string, Array<StatisticBase>>
			: new Collections.Dictionary<string, Array<StatisticBase>>();
	}

	private async loadAuthorsAsync(onCompleted?: (authors?: Collections.Dictionary<string, Array<StatisticBase>>) => void) {
		const authors = new Collections.Dictionary<string, Array<StatisticBase>>();
		AppUtility.getChars().forEach(async char => {
			const authours = (await this.storage.get(`VIEApps-Books-Authors-${char}`) as Array<any> || []).map(s => StatisticBase.deserialize(s));
			authors.setValue(char, authours);
		});
		this.configSvc.appConfig.extras["Books-Authors"] = authors;
		if (this.authors.size() > 0) {
			AppEvents.broadcast("Books", { Type: "AuthorsUpdated", Data: authors });
		}
		if (onCompleted !== undefined) {
			onCompleted(this.authors);
		}
	}

	private async storeAuthorsAsync(onCompleted?: (authors?: Collections.Dictionary<string, Array<StatisticBase>>) => void) {
		const authors = this.authors;
		await Promise.all(AppUtility.getChars().map(char => this.storage.set(`VIEApps-Books-Authors-${char}`, authors.getValue(char) || [])));
		AppEvents.broadcast("Books", { Type: "AuthorsUpdated", Data: authors });
		if (onCompleted !== undefined) {
			onCompleted(this.authors);
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

	private async loadStatisticsAsync() {
		await Promise.all([
			this.loadCategoriesAsync(),
			this.loadAuthorsAsync()
		]);
		AppRTU.send({
			ServiceName: "books",
			ObjectName: "statistic",
			Verb: "GET",
			Query: {
				"object-identity": "all"
			},
			Header: undefined,
			Body: undefined,
			Extra: undefined
		});
	}

	private async processUpdateStatisticMessageAsync(message: { Type: { Service: string, Object: string, Event: string }, Data: any }) {
		switch (message.Type.Event) {
			case "Categories":
				this.configSvc.appConfig.extras["Books-Categories"] = (message.Data.Objects as Array<any>).map(s => StatisticInfo.deserialize(s));
				await this.storeCategoriesAsync();
				break;

			case "Authors":
				const authors = this.authors;
				authors.setValue(message.Data.Char, (message.Data.Objects as Array<any>).map(s => StatisticBase.deserialize(s)));
				this.configSvc.appConfig.extras["Books-Authors"] = authors;
				await this.storeAuthorsAsync();
				break;

			case "Status":
				this.configSvc.appConfig.extras["Books-Status"] = (message.Data.Objects as Array<any>).map(s => StatisticBase.deserialize(s));
				break;

			case "All":
				break;

			default:
				console.warn(this.getLogMessage("Got an update message"), message);
				break;
		}
	}

	public get readingOptions() {
		this.configSvc.appConfig.options.extras["Books"] =
			this.configSvc.appConfig.options.extras["Books"] || {
				font: "default",
				size: "normal",
				color: "white",
				paragraph: "one",
				align: "align-left"
			};
		return this.configSvc.appConfig.options.extras["Books"] as { font: string, size: string, color: string, paragraph: string, align: string };
	}

	public get bookmarks() {
		return this.configSvc.appConfig.extras["Books-Bookmarks"] !== undefined
			? this.configSvc.appConfig.extras["Books-Bookmarks"] as Collections.Dictionary<string, Bookmark>
			: new Collections.Dictionary<string, Bookmark>();
	}

	private async loadBookmarksAsync(onCompleted?: () => void) {
		const bookmarks = new Collections.Dictionary<string, Bookmark>();
		(await this.storage.get("VIEApps-Books-Bookmarks") as Array<any> || []).forEach(data => {
			const bookmark = Bookmark.deserialize(data);
			bookmarks.setValue(bookmark.ID, bookmark);
		});
		this.configSvc.appConfig.extras["Books-Bookmarks"] = bookmarks;
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	private async storeBookmarksAsync(onCompleted?: () => void) {
		await this.storage.set("VIEApps-Books-Bookmarks", this.bookmarks.values());
		AppEvents.broadcast("Books", { Type: "BookmarksUpdated", Data: this.bookmarks });
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	public async updateBookmarksAsync(id: string, chapter: number, position: number, onCompleted?: () => void) {
		const bookmark = this.bookmarks.getValue(id) || new Bookmark();
		bookmark.ID = id;
		bookmark.Chapter = chapter;
		bookmark.Position = position;
		bookmark.Time = new Date();
		this.bookmarks.setValue(bookmark.ID, bookmark);
		await this.storeBookmarksAsync(onCompleted);
	}

	private getBookmarks(onCompleted?: () => void) {
		AppRTU.send({
			ServiceName: "books",
			ObjectName: "bookmarks",
			Verb: "GET",
			Query: undefined,
			Header: undefined,
			Body: undefined,
			Extra: undefined
		});
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	private sendBookmarks(onCompleted?: () => void) {
		if (this.configSvc.isAuthenticated) {
			AppRTU.send({
				ServiceName: "books",
				ObjectName: "bookmarks",
				Verb: "POST",
				Query: undefined,
				Header: undefined,
				Body: new List(this.bookmarks.values()).OrderByDescending(b => b.Time).Take(30).ToArray(),
				Extra: undefined
			});
			if (onCompleted !== undefined) {
				onCompleted();
			}
		}
	}

	private async syncBookmarksAsync(data: any, onCompleted?: () => void) {
		if (this.configSvc.getAccount().profile !== undefined) {
			this.configSvc.getAccount().profile.LastSync = new Date();
		}
		if (AppUtility.isTrue(data.Sync)) {
			this.bookmarks.clear();
		}
		(data.Objects as Array<any> || []).forEach(b => {
			const bookmark = Bookmark.deserialize(b);
			if (!this.bookmarks.containsKey(bookmark.ID)) {
				this.bookmarks.setValue(bookmark.ID, bookmark);
			}
			else if (bookmark.Time > this.bookmarks.getValue(bookmark.ID).Time) {
				this.bookmarks.setValue(bookmark.ID, bookmark);
			}
		});

		this.bookmarks.values().forEach((bookmark, index)  => {
			PlatformUtility.setTimeout(() => {
				if (!Book.instances.containsKey(bookmark.ID)) {
					AppRTU.send({
						ServiceName: "books",
						ObjectName: "book",
						Verb: "GET",
						Query: {
							"object-identity": bookmark.ID
						},
						Header: undefined,
						Body: undefined,
						Extra: undefined
					});
				}
			}, 456 + (index * 10));
		});

		await this.storeBookmarksAsync(onCompleted);
	}

	public deleteBookmark(id: string, onCompleted?: () => void) {
		AppRTU.send({
			ServiceName: "books",
			ObjectName: "bookmarks",
			Verb: "DELETE",
			Query: {
				"object-identity": id
			},
			Header: undefined,
			Body: undefined,
			Extra: undefined
		});
		this.bookmarks.remove(id);
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	private async processUpdateBookmarkMessageAsync(message: { Type: { Service: string, Object: string, Event: string }, Data: any }) {
		if (this.configSvc.isAuthenticated && this.configSvc.getAccount().id === message.Data.ID) {
			await this.syncBookmarksAsync(message.Data);
		}
	}

	public sendRequestToCrawl(url: string) {
		super.send({
			ServiceName: "books",
			ObjectName: "crawl",
			Verb: "GET",
			Query: {
				url: url
			},
			Header: undefined,
			Body: undefined,
			Extra: undefined
		});
	}

	public sendRequestToReCrawl(id: string, url: string, mode: string) {
		super.send({
			ServiceName: "books",
			ObjectName: "book",
			Verb: "GET",
			Query: {
				"object-identity": "recrawl",
				"id": id,
				"url": url,
				"full": "full" === mode
			},
			Header: undefined,
			Body: undefined,
			Extra: undefined
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

	private async updateReadingAsync(book: Book, chapter: number) {
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

}
