import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";
import { UsersSelectorModalPage } from "./user.selector.modal.page";

@NgModule({
	providers: [],
	imports: [
		CommonModule,
		IonicModule
	],
	exports: [],
	declarations: [UsersSelectorModalPage],
	entryComponents: [UsersSelectorModalPage]
})

export class UsersSelectorModalPageModule {}
