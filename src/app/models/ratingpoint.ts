import { AppUtility } from "../components/app.utility";

/** Rating information */
export class RatingPoint {

	Type = "";
	Total = 0;
	Points = 0.0;

	public static deserialize(json: any, ratingPoint?: RatingPoint) {
		ratingPoint = ratingPoint || new RatingPoint();
		AppUtility.copy(json, ratingPoint);
		return ratingPoint;
	}

	public get Average() {
		return this.Total > 0 ? this.Points / this.Total : 0;
	}

}
