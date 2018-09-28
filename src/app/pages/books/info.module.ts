import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { QRCodeModule } from "angular2-qrcode";
import { ViewBookInfoPage } from "./info.page";

@NgModule({
	declarations: [ViewBookInfoPage],
	imports: [
		CommonModule,
		QRCodeModule,
		IonicModule,
		RouterModule.forChild([
			{
				path: "",
				component: ViewBookInfoPage
			}
		])
	]
})

export class ViewBookInfoPageModule {}
