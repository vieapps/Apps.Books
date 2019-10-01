import { Injectable } from "@angular/core";
import { HttpClient, HttpEventType } from "@angular/common/http";
import { AppConfig } from "../app.config";
import { AppXHR } from "../components/app.apis";
import { AppCrypto } from "../components/app.crypto";
import { AppUtility } from "../components/app.utility";
import { Base as BaseService } from "./base.service";

/** Presents the header for uploading files */
export interface FilesHeader {
	ServiceName: string;
	ObjectName: string;
	SystemID?: string;
	DefinitionID?: string;
	ObjectID: string;
	ObjectTitle?: string;
	IsShared?: boolean;
	IsTracked?: boolean;
	IsTemporary?: boolean;
}

@Injectable()
export class FilesService extends BaseService {

	constructor(private http: HttpClient) {
		super("Files");
		AppXHR.initialize(this.http);
	}

	/** Reads the file content as data URL (base64-string) */
	public readAsDataURL(file: File, onRead: (data: string) => void, limitSize?: number, onLimitExceeded?: (fileSize?: number, limitSize?: number) => void) {
		if (limitSize !== undefined && file.size > limitSize) {
			console.warn(super.getLogMessage(`Limit size exceeded - Max allowed size: ${limitSize} bytes - Actual size: ${file.size} bytes`));
			if (onLimitExceeded !== undefined) {
				onLimitExceeded(file.size, limitSize);
			}
		}
		else {
			const fileReader = new FileReader();
			fileReader.onloadend = (event: any) => onRead(event.target.result);
			fileReader.readAsDataURL(file);
		}
	}

	/** Gets the multipart/form-data body from the collection of files to upload to HTTP service of files */
	public getMultipartBody(files: Array<File>) {
		const body = new FormData();
		(files || []).forEach(file => body.append("files[]", file, file !== undefined ? file.name : ""));
		return body;
	}

	private getHeader(additional: { [key: string]: string }, asBase64: boolean) {
		const header = AppConfig.getAuthenticatedHeaders();
		Object.keys(additional || {}).forEach(name => header[name] = additional[name]);
		Object.keys(header).filter(name => !AppUtility.isNotEmpty(header[name])).forEach(name => delete header[name]);
		if (asBase64) {
			header["x-as-base64"] = "true";
		}
		return header;
	}

	/** Uploads a file (multipart/form-data or base64) to HTTP service of files with uploading progress report */
	public upload(path: string, data: string | Array<string> | FormData, header: { [key: string]: string }, onNext?: (data?: any) => void, onError?: (error?: any) => void, onProgress?: (percentage: string) => void) {
		const asBase64 = !(data instanceof FormData);
		return AppXHR.http.post(
			AppXHR.getURI(path, AppConfig.URIs.files),
			asBase64 ? { Data: data } : data,
			{
				headers: this.getHeader(header, asBase64),
				reportProgress: true,
				observe: "events"
			}
		).subscribe(
			event => {
				if (event.type === HttpEventType.UploadProgress) {
					const percentage = Math.round(event.loaded / event.total * 100) + "%";
					if (AppConfig.app.debug) {
						console.log(super.getLogMessage(`Uploading... ${percentage}`));
					}
					if (onProgress !== undefined) {
						onProgress(percentage);
					}
				}
				else if (event.type === HttpEventType.Response) {
					if (onNext !== undefined) {
						onNext(event.body);
					}
				}
			},
			error => {
				console.error(super.getErrorMessage("Error occurred while uploading", error), error);
				if (onError !== undefined) {
					onError(AppUtility.parseError(error));
				}
			}
		);
	}

	/** Uploads a file (multipart/form-data or base64) to HTTP service of files */
	public async uploadAsync(path: string, data: string | Array<string> | FormData, header: { [key: string]: string }, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		try {
			const asBase64 = !(data instanceof FormData);
			const response = await AppXHR.http.post(
				AppXHR.getURI(path, AppConfig.URIs.files),
				asBase64 ? { Data: data } : data,
				{
					headers: this.getHeader(header, asBase64),
					observe: "body"
				}
			).toPromise();
			if (onNext !== undefined) {
				onNext(response);
			}
		}
		catch (error) {
			console.error(super.getErrorMessage("Error occurred while uploading", error), error);
			if (onError !== undefined) {
				onError(AppUtility.parseError(error));
			}
		}
	}

	/** Uploads an avatar image (multipart/form-data or base64) to HTTP service of files */
	public uploadAvatarAsync(data: string | Array<string> | FormData, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return this.uploadAsync("avatars", data, undefined, onNext, onError);
	}

	private getFilesHeader(header: FilesHeader): { [key: string]: string } {
		return {
			"x-service-name": header.ServiceName,
			"x-object-name": header.ObjectName,
			"x-system-id": header.SystemID,
			"x-definition-id": header.DefinitionID,
			"x-object-id": header.ObjectID,
			"x-object-title": AppCrypto.urlEncode(header.ObjectTitle || ""),
			"x-shared": AppUtility.isTrue(header.IsShared) ? "true" : undefined,
			"x-tracked": AppUtility.isTrue(header.IsTracked) ? "true" : undefined,
			"x-temporary": AppUtility.isTrue(header.IsTemporary) ? "true" : undefined
		};
	}

	/** Uploads thumbnail images (multipart/form-data or base64) to HTTP service of files */
	public uploadThumbnails(data: string | Array<string> | FormData, header: FilesHeader, onNext?: (data?: any) => void, onError?: (error?: any) => void, onProgress?: (percentage: string) => void) {
		return this.upload("thumbnails", data, this.getFilesHeader(header), onNext, onError, onProgress);
	}

	/** Uploads thumbnail images (multipart/form-data or base64) to HTTP service of files */
	public uploadThumbnailsAsync(data: string | Array<string> | FormData, header: FilesHeader, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return this.uploadAsync("thumbnails", data, this.getFilesHeader(header), onNext, onError);
	}

	/** Uploads files (multipart/form-data or base64) to HTTP service of files */
	public uploadFiles(data: FormData, header: FilesHeader, onNext?: (data?: any) => void, onError?: (error?: any) => void, onProgress?: (percentage: string) => void) {
		return this.upload("files", data, this.getFilesHeader(header), onNext, onError, onProgress);
	}

	/** Uploads files (multipart/form-data or base64) to HTTP service of files */
	public uploadFilesAsync(data: FormData, header: FilesHeader, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return this.uploadAsync("files", data, this.getFilesHeader(header), onNext, onError);
	}

}
