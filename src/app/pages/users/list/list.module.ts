import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { TimePipeModule } from "../../../components/time.pipe";
import { UsersListPage } from "./list.page";

@NgModule({
	providers: [],
	imports: [
		CommonModule,
		IonicModule,
		RouterModule.forChild([{ path: "", component: UsersListPage }]),
		TimePipeModule
	],
	exports: [],
	declarations: [UsersListPage]
})

export class UsersListPageModule {}
