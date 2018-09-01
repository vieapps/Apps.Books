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
		AppRTU.registerAsServiceScopeProcessor(this.Name, message => {});
		AppRTU.registerAsObjectScopeProcessor(this.Name, "Book", async message => await this.processUpdateBookMessageAsync(message));
		AppRTU.registerAsObjectScopeProcessor(this.Name, "Statistic", async message => await this.processUpdateStatisticMessageAsync(message));
		AppRTU.registerAsObjectScopeProcessor(this.Name, "Bookmarks", async message => await this.processUpdateBookmarkMessageAsync(message));
		AppRTU.registerAsServiceScopeProcessor("Scheduler", message => this.sendBookmarks());

		AppEvents.on("AppIsInitialized", async info => {
			await Promise.all([
				this.loadIntroductionsAsync(async () => {
					await this.fetchIntroductionsAsync();
				}),
				this.loadStatisticsAsync(),
				this.loadReadingOptionsAsync()
			]);
			if (this.configSvc.isAuthenticated) {
				await this.loadBookmarksAsync();
			}
		});

		AppEvents.on("Session", info => {
			if (this.configSvc.isAuthenticated && AppRTU.isReady && "Updated" === info.args["Type"]) {
				this.getBookmarks();
			}}
		);

		AppEvents.on("Books", info => {
			if ("CategoriesUpdated" === info.args["Type"]) {
				const parent = this.configSvc.requestParams["parent"];
				AppEvents.broadcast("UpdateSidebar", {
					index: 1,
					title: "Thể loại",
					items: this.categories.map((category, index) => {
						return {
							title: category.Name,
							url: `/list-books/${index}`,
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
		});
	}

	public getSearchURI(request: any) {
		return "books/book/search?x-request=" + AppUtility.toBase64Url(request) + "&" + this.configSvc.relatedQuery;
	}

	public get completerDataSource() {
		return new AppCustomCompleter(
			term => this.getSearchURI(AppPagination.buildRequest({ Query: term })),
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
			this.getSearchURI(request),
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
			if (!AppUtility.isTrue(dontUpdateCounter)) {
				this.updateCounters(id);
			}
			if (onNext !== undefined) {
				onNext();
			}
		}
		else {
			const path = `books/book/${id}`;
			await this.readAsync(
				path,
				data => {
					Book.update(data);
					if (!AppUtility.isTrue(dontUpdateCounter)) {
						this.updateCounters(id);
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
			const path = `books/book/${id}?chapter=${chapter}`;
			await this.readAsync(
				path,
				data => {
					book.Chapters[chapter - 1] = data.Content;
					this.updateCounters(id);
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
			this.send({
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
			}, data => book.Chapters[chapter - 1] = data.Content);
		}
		if (chapter <= book.TotalChapters) {
			this.updateCounters(id, "View", onCompleted);
		}
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	private updateChapter(data: any) {
		const book = Book.instances.getValue(data.ID);
		if (book !== undefined) {
			book.Chapters[data.Chapter - 1] = data.Content;
		}
}

	public updateCounters(id: string, action?: string, onCompleted?: () => void) {
		if (Book.instances.containsKey(id)) {
			this.send({
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
			});
		}
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	public setCounters(info: any, onCompleted?: () => void) {
		const book = AppUtility.isObject(info, true)
			? Book.instances.getValue(info.ID)
			: undefined;

		if (book !== undefined && AppUtility.isArray(info.Counters)) {
			(info.Counters as Array<any>).forEach(c => book.Counters.setValue(c.Type, CounterInfo.deserialize(c)));
			AppEvents.broadcast("Book", { Type: "StatisticsUpdated", ID: book.ID });
		}
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	public generateFiles(id: string) {
		if (Book.instances.containsKey(id)) {
			this.send({
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
			});
		}
	}

	private updateFiles(data: any) {
		const book = data.ID !== undefined
			? Book.instances.getValue(data.ID)
			: undefined;
		if (book !== undefined && AppUtility.isObject(data.Files, true)) {
			book.Files = data.Files;
			AppEvents.broadcast("Book", { Type: "FilesUpdated", ID: book.ID });
		}
	}

	public async requestUpdateAsync(body: any, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		const path = `books/book/${body.ID}`;
		await super.createAsync(
			path,
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
		const path = `books/book/${body.ID}`;
		await super.updateAsync(
			path,
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
		const path = `books/book/${id}`;
		await super.deleteAsync(
			path,
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
				this.setCounters(message.Data);
				break;
			case "Chapter":
				this.updateChapter(message.Data);
				break;
			case "Files":
				this.updateFiles(message.Data);
				break;
			case "Delete":
				Book.instances.remove(message.Data.ID);
				AppEvents.broadcast("Book", { Type: "Deleted", Data: message.Data });
				break;
			default:
				Book.update(message.Data);
				AppEvents.broadcast("Book", { Type: "Updated", Data: message.Data });
				break;
		}
	}

	public get introductions() {
		return this.configSvc.appConfig.extras["Book-Introductions"] as { [key: string]: string };
	}

	private async loadIntroductionsAsync(onCompleted?: () => void) {
		this.configSvc.appConfig.extras["Book-Introductions"] = await this.storage.get("VIEApps-Book-Introductions") || this.introductions;
		if (this.introductions !== undefined) {
			AppEvents.broadcast("Books", { Type: "InstroductionsUpdated", Data: this.introductions });
		}
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	private async storeIntroductionsAsync(onCompleted?: () => void) {
		await this.storage.set("VIEApps-Book-Introductions", this.introductions);
		AppEvents.broadcast("Books", { Type: "InstroductionsUpdated", Data: this.introductions });
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	private async fetchIntroductionsAsync(onCompleted?: () => void) {
		const path = "statics/services/books.json";
		await this.readAsync(
			path,
			async data => {
				this.configSvc.appConfig.extras["Book-Introductions"] = data;
				await this.storeIntroductionsAsync(onCompleted);
			},
			error => this.showError("Error occurred while reading introductions", error)
		);
	}

	public get categories() {
		return this.configSvc.appConfig.extras["Book-Categories"] !== undefined
			? this.configSvc.appConfig.extras["Book-Categories"] as Array<StatisticInfo>
			: new Array<StatisticInfo>();
	}

	private async loadCategoriesAsync(onCompleted?: (categories?: Array<StatisticInfo>) => void) {
		const categories = (await this.storage.get("VIEApps-Book-Categories") as Array<any> || []).map(s => StatisticInfo.deserialize(s));
		this.configSvc.appConfig.extras["Book-Categories"] = categories;
		if (categories.length > 0) {
			AppEvents.broadcast("Books", { Type: "CategoriesUpdated", Data: categories });
		}
		if (onCompleted !== undefined) {
			onCompleted(categories);
		}
	}

	private async storeCategoriesAsync(onCompleted?: (categories?: Array<StatisticInfo>) => void) {
		await this.storage.set("VIEApps-Book-Categories", this.categories);
		AppEvents.broadcast("Books", { Type: "CategoriesUpdated", Data: this.categories });
		if (onCompleted !== undefined) {
			onCompleted(this.categories);
		}
	}

	public get authors() {
		return this.configSvc.appConfig.extras["Book-Authors"] !== undefined
			? this.configSvc.appConfig.extras["Book-Authors"] as Collections.Dictionary<string, Array<StatisticBase>>
			: new Collections.Dictionary<string, Array<StatisticBase>>();
	}

	private async loadAuthorsAsync(onCompleted?: (authors?: Collections.Dictionary<string, Array<StatisticBase>>) => void) {
		const authors = new Collections.Dictionary<string, Array<StatisticBase>>();
		AppUtility.getChars().forEach(async char => {
			const authours = (await this.storage.get(`VIEApps-Book-Authors-${char}`) as Array<any> || []).map(s => StatisticBase.deserialize(s));
			authors.setValue(char, authours);
		});
		this.configSvc.appConfig.extras["Book-Authors"] = authors;
		if (this.authors.size() > 0) {
			AppEvents.broadcast("Books", { Type: "AuthorsUpdated", Data: this.authors });
		}
		if (onCompleted !== undefined) {
			onCompleted(this.authors);
		}
	}

	private async storeAuthorsAsync(onCompleted?: (authors?: Collections.Dictionary<string, Array<StatisticBase>>) => void) {
		const authors = this.authors;
		await Promise.all(AppUtility.getChars().map(char => this.storage.set(`VIEApps-Book-Authors-${char}`, authors.getValue(char) || [])));
		AppEvents.broadcast("Books", { Type: "AuthorsUpdated", Data: this.authors });
		if (onCompleted !== undefined) {
			onCompleted(this.authors);
		}
	}

	public get status() {
		const status = this.configSvc.appConfig.extras["Book-Status"] !== undefined
			? this.configSvc.appConfig.extras["Book-Status"] as Array<StatisticBase>
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
				this.configSvc.appConfig.extras["Book-Categories"] = (message.Data.Objects as Array<any>).map(s => StatisticInfo.deserialize(s));
				await this.storeCategoriesAsync();
				break;

			case "Authors":
				const authors = this.authors;
				authors.setValue(message.Data.Char, (message.Data.Objects as Array<any>).map(s => StatisticBase.deserialize(s)));
				this.configSvc.appConfig.extras["Book-Authors"] = authors;
				await this.storeAuthorsAsync();
				break;

			case "Status":
				this.configSvc.appConfig.extras["Book-Status"] = (message.Data.Objects as Array<any>).map(s => StatisticBase.deserialize(s));
				break;

			default:
				console.warn(this.getLogMessage("Got an update message"), message);
				break;
		}
	}

	public get readingOptions() {
		return this.configSvc.appConfig.extras["Book-ReadingOptions"] !== undefined
			? this.configSvc.appConfig.extras["Book-ReadingOptions"] as { font: string, size: string, color: string, paragraph: string, align: string }
			: {
					font: "default",
					size: "normal",
					color: "white",
					paragraph: "one",
					align: "align-left"
				};
	}

	private async loadReadingOptionsAsync(onCompleted?: () => void) {
		this.configSvc.appConfig.extras["Book-ReadingOptions"] = await this.storage.get("VIEApps-Reading-Options") || this.readingOptions;
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	public async storeReadingOptionsAsync(onCompleted?: () => void) {
		await this.storage.set("VIEApps-Reading-Options", this.readingOptions);
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	public get bookmarks() {
		return this.configSvc.appConfig.extras["Book-Bookmarks"] !== undefined
			? this.configSvc.appConfig.extras["Book-Bookmarks"] as Collections.Dictionary<string, Bookmark>
			: new Collections.Dictionary<string, Bookmark>();
	}

	private async loadBookmarksAsync(onCompleted?: () => void) {
		const bookmarks = new Collections.Dictionary<string, Bookmark>();
		(await this.storage.get("VIEApps-Book-Bookmarks") as Array<any> || []).forEach(data => {
			const bookmark = Bookmark.deserialize(data);
			bookmarks.setValue(bookmark.ID, bookmark);
		});
		this.configSvc.appConfig.extras["Book-Bookmarks"] = bookmarks;
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	private async storeBookmarksAsync(onCompleted?: () => void) {
		await this.storage.set("VIEApps-Book-Bookmarks", this.bookmarks.values());
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	public async updateBookmarksAsync(id: string, chapter: number, offset: number, onCompleted?: () => void) {
		const bookmark = new Bookmark();
		bookmark.ID = id;
		bookmark.Chapter = chapter;
		bookmark.Position = offset;
		this.bookmarks.setValue(bookmark.ID, bookmark);
		await this.storeBookmarksAsync(onCompleted);
		if (onCompleted !== undefined) {
			onCompleted();
		}
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

	private syncBookmarks(data: any, onCompleted?: () => void) {
		if (this.configSvc.isAuthenticated) {
			this.configSvc.getAccount().profile.LastSync = new Date();
		}

		if (AppUtility.isTrue(data.Sync)) {
			this.bookmarks.clear();
		}

		(data.Objects as Array<any>).forEach(b => {
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
				if (!Book.instances.getValue(bookmark.ID)) {
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

		PlatformUtility.setTimeout(async () => {
			AppEvents.broadcast("Book", { Type: "BookmarksUpdated" });
			AppEvents.broadcast("BookmarksAreUpdated");
			await this.storeBookmarksAsync(onCompleted);
		});
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
			await this.syncBookmarks(message.Data);
		}
	}

}
