import { Dictionary } from "typescript-collections";
import { AppUtility } from "../components/app.utility";
import { Base as BaseModel } from "./base";
import { RatingPoint } from "./ratingpoint";
import { CounterInfo } from "./counters";

export class Book extends BaseModel {

	constructor() {
		super();
		delete this["Privileges"];
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
			(data.Counters as Array<any>).forEach(o => book.Counters.setValue(o.Type, CounterInfo.deserialize(o)));

			book.RatingPoints = new Dictionary<string, RatingPoint>();
			(data.RatingPoints as Array<any>).forEach(o => book.RatingPoints.setValue(o.Type, RatingPoint.deserialize(o)));

			book.Chapters = book.TotalChapters > 1 && book.Chapters.length < 1
				? book.TOCs.map(o => "")
				: book.Chapters;

			book.ansiTitle = AppUtility.toANSI(`${book.Title} ${book.Author}`).toLowerCase();
			book.routerParams["x-request"] = AppUtility.toBase64Url({ Service: "books", Object: "book", ID: book.ID });
		});
		return book;
	}

	/** Gets by identity */
	public static get(id: string) {
		return id !== undefined
			? this.instances.getValue(id)
			: undefined;
	}


	/** Sets by identity */
	public static set(book: Book) {
		return book === undefined
			? undefined
			: this.instances.setValue(book.ID, book) || book;
	}

	/** Updates into dictionary */
	public static update(data: any) {
		return AppUtility.isObject(data, true)
			? this.set(data instanceof Book ? data as Book : this.deserialize(data, this.get(data.ID)))
			: undefined;
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
