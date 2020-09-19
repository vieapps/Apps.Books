import { AppUtility } from "@components/app.utility";
import { Privileges } from "@models/privileges";
import { CounterInfo } from "@models/counters";

/** Base of all model/entity classes */
export abstract class Base {

	/** The identity */
	public ID: string;

	/** The working privileges */
	public Privileges: Privileges;

	/** The original privileges */
	public OriginalPrivileges: Privileges;

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
			this.Privileges = AppUtility.isObject(data.Privileges, true)
				? Privileges.deserialize(data.Privileges)
				: undefined;
			this.OriginalPrivileges = AppUtility.isObject(data.OriginalPrivileges, true)
				? Privileges.deserialize(data.OriginalPrivileges)
				: undefined;
			if (onCompleted !== undefined) {
				onCompleted(data);
			}
		});
	}

}

export interface AttachmentInfo {
	ID: string;
	ServiceName: string;
	ObjectName: string;
	SystemID: string;
	EntityInfo: string;
	ObjectID: string;
	Filename: string;
	Size: number;
	ContentType: string;
	Downloads: CounterInfo;
	IsShared: boolean;
	IsTracked: boolean;
	IsTemporary: boolean;
	Title: string;
	Description: string;
	Created: Date;
	CreatedID: string;
	LastModified: Date;
	LastModifiedID: string;
	URI: string;
	URIs: {
		Direct: string;
		Download: string;
	};
	isImage: boolean;
	isVideo: boolean;
	isAudio: boolean;
	isText: boolean;
	icon: string;
	friendlyFilename: string;
}
