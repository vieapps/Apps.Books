import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { IonicModule } from "@ionic/angular";
import { UsersOtpPage } from "./otp.page";

@NgModule({
	declarations: [UsersOtpPage],
	imports: [
		CommonModule,
		FormsModule,
		IonicModule,
		RouterModule.forChild([
			{
				path: "",
				component: UsersOtpPage
			}
		])
	]
})

export class UsersOtpPageModule {}
