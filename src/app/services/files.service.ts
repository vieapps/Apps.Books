import { Injectable } from "@angular/core";
import { HttpClient, HttpEventType } from "@angular/common/http";
import { AppConfig } from "../app.config";
import { AppXHR } from "../components/app.apis";
import { AppUtility } from "../components/app.utility";
import { Base as BaseService } from "./base.service";

@Injectable()
export class FilesService extends BaseService {

	constructor(http: HttpClient) {
		super("Files");
		AppXHR.initialize(http);
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

	private getHeaders(additionalHeaders: { [key: string]: string }, asBase64: boolean) {
		const headers = AppConfig.getAuthenticatedHeaders();
		Object.keys(additionalHeaders || {}).forEach(name => headers[name] = additionalHeaders[name]);
		if (asBase64) {
			headers["x-as-base64"] = "yes";
		}
		return headers;
	}

	/** Uploads a file (multipart/form-data or base64) to HTTP service of files with uploading progress report */
	public upload(path: string, data: FormData | string, headers: { [key: string]: string }, onNext?: (data?: any) => void, onError?: (error?: any) => void, onProgress?: (percentage: string) => void) {
		const asBase64 = typeof data === "string";
		return AppXHR.http.post(
			AppXHR.getURI(path, AppConfig.URIs.files),
			asBase64 ? { Data: data } : data,
			{
				headers: this.getHeaders(headers, asBase64),
				reportProgress: true,
				observe: "events"
			}
		).subscribe(
			event => {
				if (event.type === HttpEventType.UploadProgress) {
					const percentage = Math.round(event.loaded / event.total * 100) + "%";
					if (onProgress !== undefined) {
						onProgress(percentage);
					}
					else {
						console.log(super.getLogMessage(`${percentage} uploaded...`));
					}
				}
				else if (event.type === HttpEventType.Response) {
					if (onNext !== undefined) {
						onNext(event.body);
					}
				}
			},
			error => {
				console.error(super.getErrorMessage("Error occurred while uploading a file", error), error);
				if (onError !== undefined) {
					onError(AppUtility.parseError(error));
				}
			}
		);
	}

	/** Uploads a file (multipart/form-data or base64) to HTTP service of files */
	public async uploadAsync(path: string, data: FormData | string, headers: { [key: string]: string }, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		try {
			const asBase64 = typeof data === "string";
			const response = await AppXHR.http.post(
				AppXHR.getURI(path, AppConfig.URIs.files),
				asBase64 ? { Data: data } : data,
				{
					headers: this.getHeaders(headers, asBase64),
					observe: "body"
				}
			).toPromise();
			if (onNext !== undefined) {
				onNext(response);
			}
		}
		catch (error) {
			console.error(super.getErrorMessage("Error occurred while uploading a file", error), error);
			if (onError !== undefined) {
				onError(AppUtility.parseError(error));
			}
		}
	}

	/** Uploads an avatar image (multipart/form-data or base64) to HTTP service of files */
	public uploadAvatarAsync(data: FormData | string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return this.uploadAsync("avatars", data, undefined, onNext, onError);
	}

}
