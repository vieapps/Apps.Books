import { List } from "linqts";
import { AppUtility, Dictionary } from "@components/app.utility";
import { Base as BaseModel } from "@models/base";
import { RatingPoint } from "@models/rating.point";
import { CounterInfo } from "@models/counters";

export class Book extends BaseModel {

	constructor() {
		super();
		delete this["Privileges"];
		delete this["OriginalPrivileges"];
	}

	/** All instances of book */
	public static instances = new Dictionary<string, Book>();

	ID = "";
	Title = "";
	Author = "";
	Translator = "";
	Category = "";
	Original = "";
	Publisher = "";
	Producer = "";
	Language = "vi";
	Status = "";
	Cover = "";
	Tags = "";
	Source = "";
	SourceUrl = "";
	Contributor = "";
	TotalChapters = 0;
	Counters: Dictionary<string, CounterInfo> = undefined;
	RatingPoints: Dictionary<string, RatingPoint> = undefined;
	LastUpdated = new Date();

	TOCs = new Array<string>();
	Chapters = new Array<string>();
	Body = "";
	Files = {
		Epub: {
			Size: "generating...",
			Url: ""
		},
		Mobi: {
			Size: "generating...",
			Url: ""
		}
	};

	ansiTitle = "";

	/** Deserializes data to object */
	public static deserialize(json: any, book?: Book) {
		book = book || new Book();
		book.copy(json, data => {
			book.Counters = new Dictionary<string, CounterInfo>();
			(data.Counters as Array<any>).forEach(obj => book.Counters.set(obj.Type, CounterInfo.deserialize(obj)));

			book.RatingPoints = new Dictionary<string, RatingPoint>();
			(data.RatingPoints as Array<any>).forEach(obj => book.RatingPoints.set(obj.Type, RatingPoint.deserialize(obj)));

			book.Chapters = book.TotalChapters > 1 && (book.Chapters === undefined || book.Chapters.length < 1)
				? book.TOCs.map(_ => "")
				: book.Chapters;

			book.ansiTitle = AppUtility.toANSI(`${book.Title} ${book.Author}`).toLowerCase();
			book.routerParams["x-request"] = AppUtility.toBase64Url({ Service: "books", Object: "book", ID: book.ID });

			delete book["Privileges"];
			delete book["OriginalPrivileges"];
		});
		return book;
	}

	/** Gets by identity */
	public static get(id: string) {
		return id !== undefined
			? this.instances.get(id)
			: undefined;
	}


	/** Sets by identity */
	public static set(book: Book) {
		return book !== undefined ? this.instances.add(book.ID, book) : book;
	}

	/** Updates into dictionary */
	public static update(data: any) {
		return AppUtility.isObject(data, true)
			? this.set(data instanceof Book ? data as Book : this.deserialize(data, this.get(data.ID)))
			: undefined;
	}

	/** Checks to see the dictionary is contains the object by identity or not */
	public static contains(id: string) {
		return id !== undefined && this.instances.contains(id);
	}

	/** Converts the array of objects to list */
	public static toList(objects: Array<any>) {
		return new List(objects.map(obj => this.get(obj.ID) || this.deserialize(obj, this.get(obj.ID))));
	}

	public get routerLink() {
		return `/books/read/${(AppUtility.isNotEmpty(this.ansiTitle) ? AppUtility.toURI(this.ansiTitle) : AppUtility.toANSI(`${this.Title}-${this.Author}`, true))}`;
	}

}

/** Bookmark of an e-book */
export class Bookmark {

	ID = "";
	Chapter = 0;
	Position = 0;
	Time = new Date();

	static deserialize(json: any, bookmark?: Bookmark) {
		bookmark = bookmark || new Bookmark();
		AppUtility.copy(json, bookmark);
		return bookmark;
	}

}
