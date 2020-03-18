import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { TimePipeModule } from "../../../components/time.pipe";
import { UsersListPage } from "./list.page";

@NgModule({
	imports: [
		CommonModule,
		IonicModule,
		RouterModule.forChild([{ path: "", component: UsersListPage }]),
		TimePipeModule
	],
	exports: [],
	providers: [],
	declarations: [UsersListPage]
})

export class UsersListPageModule {}
