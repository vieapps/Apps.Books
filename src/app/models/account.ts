import { Privilege } from "./privileges";
import { UserProfile } from "./user";

/** Account of the app */
export class Account {
	id: string = undefined;
	roles: Array<string> = undefined;
	privileges: Array<Privilege> = undefined;
	status: string = undefined;
	twoFactors = {
		required: false,
		providers: new Array<{ Label: string, Type: string, Time: Date, Info: string }>()
	};
	profile: UserProfile = undefined;
	facebook = {
		id: null as string,
		name: null as string,
		pictureUrl: null as string,
		profileUrl: null as string
	};
}
