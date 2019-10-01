import { Subscription, interval } from "rxjs";
import { Pipe, PipeTransform, NgModule, NgZone, ChangeDetectorRef, OnDestroy } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";

@Pipe({
	name: "time",
	pure: false
})

export class TimePipe implements PipeTransform, OnDestroy {

	constructor(
		private datePipe: DatePipe,
		private changeDetector: ChangeDetectorRef,
		private zone: NgZone
	) {
	}

	private static Resources = {
		"en": {
			"now": "just now",
			"seconds": "a few seconds ",
			"minute": "a minute ",
			"minutes": " minutes ",
			"hour": "an hour ",
			"hours": " hours ",
			"day": "a day ",
			"days": " days ",
			"month": "a month ",
			"months": " months ",
			"year": "a year ",
			"years": " years "
		},
		"vi": {
			"now": "vừa xong",
			"seconds": "vài giây ",
			"minute": "một phút ",
			"minutes": " phút ",
			"hour": "một giờ ",
			"hours": " giờ ",
			"day": "một ngày ",
			"days": " ngày ",
			"month": "một tháng ",
			"months": " tháng ",
			"year": "một năm ",
			"years": " năm "
		}
	} as { [key: string]: { [key: string]: string } };

	private static Suffixes = {
		"en": {
			"past": "ago",
			"future": "from now"
		},
		"vi": {
			"past": "trước",
			"future": "nữa"
		}
	} as { [key: string]: { [key: string]: string } };

	private timer: Subscription;

	ngOnDestroy() {
		this.removeTimer();
	}

	private setTimer(seconds: number) {
		this.removeTimer();
		seconds = Number.isNaN(seconds) 	// unknown
			? 35 														// update every 35 seconds
			: seconds < 60 									// less than 1 minute
				? 15 													// update every 15 seconds
				: seconds < 60 * 60 					// less than an hour
					? 60 												// update every 60 seconds
					: seconds < 60 * 60 * 24 		// less then a day
						? 300 										// update every 5 minutes
						: 3600; 									// update every hour
		this.timer = interval(seconds * 1000).subscribe(_ => this.zone.run(() => this.changeDetector.markForCheck()));
	}

	private removeTimer() {
		if (this.timer !== undefined) {
			this.timer.unsubscribe();
			this.timer = undefined;
		}
	}

	transform(value: string | number | Date, locale?: string, format?: string) {
		locale = (locale || "en_US").trim().substr(0, 2).toLowerCase();

		let suffixes = TimePipe.Suffixes[locale];
		if (suffixes === undefined) {
			suffixes = TimePipe.Suffixes["en"];
		}

		const time = new Date(value);
		const ticks = new Date().getTime() - time.getTime();
		let suffix = suffixes.past;
		if (ticks < 0) {
			suffix = suffixes.future;
		}

		let resources = TimePipe.Resources[locale];
		if (resources === undefined) {
			resources = TimePipe.Resources["en"];
		}

		const seconds = Math.round(Math.abs(ticks / 1000));
		this.setTimer(seconds);
		if (Number.isNaN(seconds)) {
			return "";
		}

		if (seconds <= 4) {
			return resources.now;
		}

		if (seconds <= 45) {
			return resources.seconds + suffix;
		}

		if (seconds <= 90) {
			return resources.minute + suffix;
		}

		const minutes = Math.round(Math.abs(seconds / 60));
		if (minutes <= 45) {
			return minutes + resources.minutes + suffix;
		}

		if (minutes <= 90) {
			return resources.hour + suffix;
		}

		const hours = Math.round(Math.abs(minutes / 60));
		if (hours <= 22) {
			return hours + resources.hours + suffix;
		}

		if (hours <= 36) {
			return resources.day + suffix;
		}

		const days = Math.round(Math.abs(hours / 24));
		if (days <= 25) {
			return days + resources.days + suffix + (format !== undefined ? ` (${this.datePipe.transform(time, format)})` : "");
		}

		if (days <= 45) {
			return resources.month + suffix + (format !== undefined ? ` (${this.datePipe.transform(time, format)})` : "");
		}

		if (days <= 345) {
			const months = Math.round(Math.abs(days / 30.416));
			return months + resources.months + suffix + (format !== undefined ? ` (${this.datePipe.transform(time, format)})` : "");
		}

		if (days <= 545) {
			return resources.year + suffix + (format !== undefined ? ` (${this.datePipe.transform(time, format)})` : "");
		}

		const years = Math.round(Math.abs(days / 365));
		return years + resources.years + suffix + (format !== undefined ? ` (${this.datePipe.transform(time, format)})` : "");
	}
}

@NgModule({
	declarations: [TimePipe],
	imports: [CommonModule],
	exports: [TimePipe],
	providers: [DatePipe]
})

export class TimePipeModule {}
