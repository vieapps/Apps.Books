import * as Collections from "typescript-collections";
import { Profile } from "./models/profile";
import { Book } from "./models/book";
import { Statistics } from "./models/statistics";

/** All data of the app */
export class AppData {
	/** Account profiles */
	static profiles = new Collections.Dictionary<string, Profile>();

	/** Books */
	static books = new Collections.Dictionary<string, Book>();

	/** Statistics */
	static statistics = new Statistics();

	/** Paginations */
	static paginations = new Collections.Dictionary<string, { TotalRecords: number, TotalPages: number, PageSize: number, PageNumber: number }>();
}
