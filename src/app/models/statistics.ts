import * as Collections from "typescript-collections";
import { List } from "linqts";
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
				: new List<any>(data.Children)
					.Select(c => {
						const child = new StatisticInfo();
						AppUtility.copy(c, child);
						child.FullName = obj.Name + " > " + child.Name;
						child.Title = AppUtility.toANSI(child.FullName).toLowerCase();
						return child;
					})
					.ToArray();
		});
		return obj;
	}

	public toJSON() {
		const json = {
			Name: this.Name,
			Counters: this.Counters,
			Children: []
		};

		json.Children = new List(this.Children)
			.Select(c => {
				return { Name: c.Name, Counters: c.Counters };
			})
			.ToArray();

		return JSON.stringify(json);
	}
}

/** All available statistics */
export class Statistics {
	Categories = new Array<StatisticInfo>();
	Authors = new Collections.Dictionary<string, Array<StatisticBase>>();
	Status = new Array<StatisticBase>();
}
