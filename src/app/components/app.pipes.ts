import { Pipe, PipeTransform } from "@angular/core";
import { DecimalPipe } from "@angular/common";

@Pipe({ name: "vinumber" })
export class VinumberPipe extends DecimalPipe implements PipeTransform {
	transform(value: string): string {
		return super.transform(value, "1.2-2").replace(".", "#").replace(/,/g, ".").replace("#", ",").replace(",00", "");
	}
}
