import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { UsersListPage } from "./list.page";

@NgModule({
	declarations: [UsersListPage],
	imports: [
		CommonModule,
		IonicModule,
		RouterModule.forChild([{ path: "", component: UsersListPage }])
	]
})

export class UsersListPageModule {}
