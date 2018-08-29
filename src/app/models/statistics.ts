import * as Collections from "typescript-collections";
import { AppUtility } from "../components/app.utility";

/** Statistic base information */
export class StatisticBase {
	Name = "";
	Title = "";
	Counters = 0;

	public static deserialize(json: any, obj?: StatisticBase) {
		obj = obj || new StatisticBase();
		AppUtility.copy(json, obj, data => {
			obj.Title = AppUtility.toANSI(obj.Name).toLowerCase();
		});
		return obj;
	}
}

/** Statistic information */
export class StatisticInfo extends StatisticBase {
	FullName = "";
	Children: Array<StatisticInfo> = [];

	public static deserialize(json: any, obj?: StatisticInfo) {
		obj = obj || new StatisticInfo();
		AppUtility.copy(json, obj, data => {
			obj.FullName = obj.Name;
			obj.Title = AppUtility.toANSI(obj.FullName).toLowerCase();
			obj.Children = !AppUtility.isArray(data.Children)
				? []
				: (data.Children as Array<any>).map(c => {
						const child = new StatisticInfo();
						AppUtility.copy(c, child);
						child.FullName = obj.Name + " > " + child.Name;
						child.Title = AppUtility.toANSI(child.FullName).toLowerCase();
						return child;
					});
		});
		return obj;
	}

	public toJSON() {
		return JSON.stringify({
			Name: this.Name,
			Counters: this.Counters,
			Children: this.Children.map(c => {
				return {
					Name: c.Name,
					Counters: c.Counters
				};
			})
		});
	}
}

/** All available statistics */
export class Statistics {
	Categories = new Array<StatisticInfo>();
	Authors = new Collections.Dictionary<string, Array<StatisticBase>>();
	Status = new Array<StatisticBase>();
}
