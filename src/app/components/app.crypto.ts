declare var RSA: any;
import * as CryptoJS from "crypto-js";

/** Servicing component for working with cryptography */
export class AppCrypto {

	private static _aes = {
		key: undefined,
		iv: undefined
	};
	private static _rsa = new RSA();
	private static _jwt: string;

	/** Gets the base64url-encoded string from the base64 string */
	public static getBase64Url(text: string) {
		return text.replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
	}

	/** Gets the base64 string from the base64url-encoded string */
	public static getBase64Str(text: string) {
		let result = text.replace(/\-/g, "+").replace(/\_/g, "/");
		switch (result.length % 4) {
			case 0:
				break;
			case 2:
				result += "==";
				break;
			case 3:
				result += "=";
				break;
			default:
				throw new Error("Base64-url string is not well-form");
		}
		return result;
	}

	/** Gets MD5 hash of the string */
	public static md5(text: string) {
		return CryptoJS.MD5(text).toString();
	}

	/** Gets MD5 hash of the object */
	public static hash(obj: any, preHash?: (obj: any) => void) {
		if (preHash !== undefined) {
			preHash(obj);
		}
		return this.md5(JSON.stringify(obj || {}, (_, value) => typeof value === "undefined" ? null : value));
	}

	/** Signs the string with the specified key using HMAC SHA256 */
	public static hmacSign(text: string, key: string) {
		return CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(text, key));
	}

	/** Signs the string with the specified key using HMAC SHA256 and encode as Base64Url string */
	public static urlSign(text: string, key: string) {
		return this.getBase64Url(this.hmacSign(text, key));
	}

	/** Encodes the string by Base64Url */
	public static urlEncode(text: string) {
		return this.getBase64Url(CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text)));
	}

	/** Decodes the string by Base64Url */
	public static urlDecode(text: string) {
		return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(this.getBase64Str(text)));
	}

	/** Encodes the JSON Web Token */
	public static jwtEncode(jwt: any, key?: string) {
		jwt.iat = Math.round(+new Date() / 1000);
		const encoded = this.urlEncode(JSON.stringify({ typ: "JWT", alg: "HS256" })) + "." + this.urlEncode(JSON.stringify(jwt, (_, value) => typeof value === "undefined" ? null : value));
		return `${encoded}.${this.urlSign(encoded, key || this._jwt)}`;
	}

	/** Decodes the JSON Web Token */
	public static jwtDecode(jwt: string, key?: string) {
		const elements = jwt.split(".");
		return elements.length > 2 && this.urlSign(`${elements[0]}.${elements[1]}`, key || this._jwt) === elements[2]
			? JSON.parse(this.urlDecode(elements[1]))
			: undefined;
	}

	/** Encrypts the string - using AES */
	public static aesEncrypt(text: string, key?: any, iv?: any) {
		return CryptoJS.AES.encrypt(text, key || this._aes.key, { iv: iv || this._aes.iv }).toString();
	}

	/** Decrypts the string - using AES */
	public static aesDecrypt(text: string, key?: any, iv?: any) {
		return CryptoJS.AES.decrypt(text, key || this._aes.key, { iv: iv || this._aes.iv }).toString(CryptoJS.enc.Utf8);
	}

	/** Encrypts the string - using RSA */
	public static rsaEncrypt(text: string) {
		return this._rsa.encrypt(text) as string;
	}

	/** Decrypts the string - using RSA */
	public static rsaDecrypt(text: string) {
		return this._rsa.decrypt(text) as string;
	}

	/** Initializes all keys for encrypting/decryptnig/hashing */
	public static init(keys: { aes: { key: string; iv: string }; rsa: { encryptionExponent?: string; decryptionExponent?: string; exponent: string; modulus: string }; jwt: string; }) {
		if (keys.aes !== undefined) {
			this._aes.key = CryptoJS.enc.Hex.parse(keys.aes.key);
			this._aes.iv = CryptoJS.enc.Hex.parse(keys.aes.iv);
		}
		if (keys.rsa !== undefined) {
			this._rsa.init(keys.rsa.encryptionExponent || keys.rsa.exponent, keys.rsa.decryptionExponent || keys.rsa.exponent, keys.rsa.modulus);
		}
		if (keys.jwt !== undefined) {
			this._jwt = keys.jwt = keys.aes !== undefined ? this.aesDecrypt(keys.jwt) : keys.jwt;
		}
	}

}
