import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { QRCodeModule } from "angular2-qrcode";
import { BooksInfoPage } from "./info.page";

@NgModule({
	imports: [
		CommonModule,
		IonicModule,
		QRCodeModule,
		RouterModule.forChild([{ path: "", component: BooksInfoPage }])
	],
	exports: [],
	declarations: [BooksInfoPage]
})

export class BooksInfoPageModule {}
