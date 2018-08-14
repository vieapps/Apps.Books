import { Privilege } from "./privileges";
import { Profile } from "./profile";

/** Account of the app */
export class Account {
	id: string = null;
	roles: Array<string> = null;
	privileges: Array<Privilege> = null;
	status: string = null;
	twoFactors: {
		required: boolean,
		providers: Array<{ Label: string, Type: string, Time: Date, Info: string }>
	} = {
		required: false,
		providers: new Array<{ Label: string, Type: string, Time: Date, Info: string }>()
	};
	profile: Profile = null;
	facebook = {
		id: null as string,
		name: null as string,
		pictureUrl: null as string,
		profileUrl: null as string
	};
}
