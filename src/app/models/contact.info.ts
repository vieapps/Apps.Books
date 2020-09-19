import { AppUtility } from "@components/app.utility";

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

	public static deserialize(json: any, contactInfo?: ContactInfo) {
		contactInfo = contactInfo || new ContactInfo();
		AppUtility.copy(json, contactInfo);
		return contactInfo;
	}

}
