import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { IonicModule } from "@ionic/angular";
import { TimePipeModule } from "../../../components/time.pipe";
import { UsersOtpPage } from "./otp.page";

@NgModule({
	providers: [],
	imports: [
		CommonModule,
		FormsModule,
		IonicModule,
		TimePipeModule,
		RouterModule.forChild([{ path: "", component: UsersOtpPage }])
	],
	exports: [],
	declarations: [UsersOtpPage]
})

export class UsersOtpPageModule {}
