import { AppUtility } from "../components/app.utility";

/** Rating information */
export class RatingPoint {
	Type = "";
	Total = 0;
	Points = 0.0;
	Average = 0.0;

	static deserialize(json: any, obj?: RatingPoint) {
		obj = obj || new RatingPoint();
		AppUtility.copy(json, obj);
		return obj;
	}
}
