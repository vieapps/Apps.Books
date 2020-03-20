import { Privileges } from "./privileges";
import { AppUtility } from "../components/app.utility";

/** Base of all model/entity classes */
export abstract class Base {

	/** The identity */
	public ID: string;

	/** The working privileges */
	public Privileges: Privileges;

	/** Gets the link for working with router */
	public abstract get routerLink(): string;

	/** The params for working with router */
	protected _routerParams: { [key: string]: any };

	/** Gets the params for working with router */
	public get routerParams() {
		this._routerParams = this._routerParams || {
			"x-request": AppUtility.toBase64Url({ ID: this.ID })
		};
		return this._routerParams;
	}

	/** Gets the URI (means link with 'x-request' param) for working with router */
	public get routerURI() {
		return this.getRouterURI();
	}

	/** Gets the URI (means link with 'x-request' param) for working with router */
	public getRouterURI(params?: { [key: string]: any }) {
		return `${this.routerLink}?x-request=${(params !== undefined ? AppUtility.toBase64Url(params) : this.routerParams["x-request"])}`;
	}

	/** Copies data from source (object or JSON) and fill into this objects' properties */
	public copy(source: any, onCompleted?: (data: any) => void) {
		AppUtility.copy(source, this, data => {
			if (AppUtility.isObject(data.Privileges, true)) {
				this.Privileges = Privileges.deserialize(data.Privileges);
			}
			if (onCompleted !== undefined) {
				onCompleted(data);
			}
		});
	}

}
