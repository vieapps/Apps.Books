import { AppUtility } from "../components/app.utility";

/** Statistic base information */
export class StatisticBase {
	Name = "";
	Title = "";
	Counters = 0;

	public static deserialize(json: any, statistic?: StatisticBase) {
		statistic = statistic || new StatisticBase();
		AppUtility.copy(json, statistic, () => statistic.Title = AppUtility.toANSI(statistic.Name).toLowerCase());
		return statistic;
	}
}

/** Statistic information */
export class StatisticInfo extends StatisticBase {
	FullName = "";
	Children: Array<StatisticInfo> = [];

	public static deserialize(json: any, statistic?: StatisticInfo) {
		statistic = statistic || new StatisticInfo();
		AppUtility.copy(json, statistic, data => {
			statistic.FullName = statistic.Name;
			statistic.Title = AppUtility.toANSI(statistic.FullName).toLowerCase();
			statistic.Children = AppUtility.isArray(data.Children, true)
				? (data.Children as Array<any>).map(o => {
						const child = new StatisticInfo();
						AppUtility.copy(o, child);
						child.FullName = statistic.Name + " > " + child.Name;
						child.Title = AppUtility.toANSI(child.FullName).toLowerCase();
						return child;
					})
				: [];
		});
		return statistic;
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
