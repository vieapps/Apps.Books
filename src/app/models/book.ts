import * as Collections from "typescript-collections";
import { List } from "linqts";
import { AppConfig } from "../app.config";
import { AppData } from "../app.data";
import { AppUtility } from "../components/app.utility";
import { Base as BaseModel } from "./base";
import { RatingPoint } from "./ratingpoint";
import { CounterInfo } from "./counters";

export class Book extends BaseModel {
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

	/** Initializes a new instance of book */
	constructor() {
		super();
		this.Language = "vi";
	}

	public static deserialize(json: any, book?: Book) {
		book = book || new Book();
		book.copy(json, data => {
			book.Counters = new Collections.Dictionary<string, CounterInfo>();
			new List<any>(data.Counters).ForEach(c => book.Counters.setValue(c.Type, CounterInfo.deserialize(c)));

			book.RatingPoints = new Collections.Dictionary<string, RatingPoint>();
			new List<any>(data.RatingPoints).ForEach(r => book.RatingPoints.setValue(r.Type, RatingPoint.deserialize(r)));

			if (book.SourceUrl !== "" && AppConfig.isNativeApp) {
				book.SourceUrl = "";
			}

			book.Chapters = book.TotalChapters > 1 && book.Chapters.length < 1
				? new List(book.TOCs).Select(t => "").ToArray()
				: book.Chapters;

			book.ANSITitle = AppUtility.toANSI(book.Title + " " + book.Author).toLowerCase();
		});
		return book;
	}

	public static update(data: any) {
		if (AppUtility.isObject(data, true)) {
			const book = data instanceof Book
				? data as Book
				: Book.deserialize(data, AppData.books.getValue(data.ID));
			AppData.books.setValue(book.ID, book);
		}
	}
}
