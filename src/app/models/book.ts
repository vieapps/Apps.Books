import * as Collections from "typescript-collections";
import { AppUtility } from "../components/app.utility";
import { Base as BaseModel } from "./base";
import { RatingPoint } from "./ratingpoint";
import { CounterInfo } from "./counters";

export class Book extends BaseModel {

	constructor() {
		super();
		this.Language = "vi";
	}

	/** All instances of book */
	public static instances = new Collections.Dictionary<string, Book>();

	ID = "";
	Title = "";
	Author = "";
	Translator = "";
	Category = "";
	Original = "";
	Publisher = "";
	Producer = "";
	Language = "";
	Status = "";
	Cover = "";
	Tags = "";
	Source = "";
	SourceUrl = "";
	Contributor = "";
	TotalChapters = 0;
	Counters: Collections.Dictionary<string, CounterInfo> = undefined;
	RatingPoints: Collections.Dictionary<string, RatingPoint> = undefined;
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

	ANSITitle = "";

	public static deserialize(json: any, book?: Book) {
		book = book || new Book();
		book.copy(json, data => {
			book.Counters = new Collections.Dictionary<string, CounterInfo>();
			(data.Counters as Array<any>).forEach(o => book.Counters.setValue(o.Type, CounterInfo.deserialize(o)));

			book.RatingPoints = new Collections.Dictionary<string, RatingPoint>();
			(data.RatingPoints as Array<any>).forEach(o => book.RatingPoints.setValue(o.Type, RatingPoint.deserialize(o)));

			book.Chapters = book.TotalChapters > 1 && book.Chapters.length < 1
				? book.TOCs.map(o => "")
				: book.Chapters;

			book.ANSITitle = AppUtility.toANSI(book.Title + " " + book.Author).toLowerCase();
		});
		return book;
	}

	public static update(data: any) {
		if (AppUtility.isObject(data, true)) {
			const book = data instanceof Book
				? data as Book
				: Book.deserialize(data, Book.instances.getValue(data.ID));
			Book.instances.setValue(book.ID, book);
		}
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
