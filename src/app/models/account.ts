import { Privilege } from "./privileges";
import { UserProfile } from "./user";

/** Account of the app */
export class Account {
	id: string;
	roles: Array<string>;
	privileges: Array<Privilege>;
	status: string;
	twoFactors: {
		required: boolean,
		providers: Array<{ Label: string, Type: string, Time: Date, Info: string }>
	};
	profile: UserProfile;
	facebook: {
		id: string,
		name: string,
		pictureUrl: string,
		profileUrl: string
	};
}
