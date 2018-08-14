import { AppUtility } from "../components/app.utility";

/** Contact information */
export class ContactInfo {
	Name = "";
	Title = "";
	Phone = "";
	Email = "";
	Address = "";
	County = "";
	Province = "";
	Country = "";
	PostalCode = "";
	Notes = "";
	GPSLocation = "";

	static deserialize(json: any, obj?: ContactInfo) {
		obj = obj || new ContactInfo();
		AppUtility.copy(json, obj);
		return obj;
	}
}
