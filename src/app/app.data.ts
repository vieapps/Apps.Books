import * as Collections from "typescript-collections";
import { Profile } from "./models/profile";
import { Book } from "./models/book";
import { Statistics } from "./models/statistics";

/** All data of the app */
export class AppData {
	/** Account profiles */
	public static profiles = new Collections.Dictionary<string, Profile>();

	/** Paginations */
	public static paginations = new Collections.Dictionary<string, { TotalRecords: number, TotalPages: number, PageSize: number, PageNumber: number }>();

	/** Books */
	public static books = new Collections.Dictionary<string, Book>();

	/** Statistics */
	public static statistics = new Statistics();
}
