import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/services/auth.service';
import { User } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { LoginScreenComponent } from './core/auth/screens/login-screen/login-screen.component';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { OrderService } from './orders/services/order.service';
import { UtilService } from './core/services/util.service';
import { Order } from './orders/models/order.model';
import { OrderType } from './core/models/core.model';
import { PaymentService } from './payment/services/payment.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoginScreenComponent, MainLayoutComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  authSub = new Subscription();
  orderSub = new Subscription();
  userLoggedIn!: boolean;
  currentOrders: Order[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    const darkTheme = localStorage.getItem('dark-theme');

    if (darkTheme) {
      document.body.classList.add('dark-theme');
    }

    this.authSub = this.authService.user$.subscribe({
      next: (res: User) => {
        if (res) {
          this.userLoggedIn = true;
          this.authService.currentUser = res;
          localStorage.setItem('uid', res?.uid);
          localStorage.setItem('photoURL', res?.photoURL ?? '');
        } else {
          this.userLoggedIn = false;
        }
      },
    });
  }

  ngOnDestroy(): void {
    this.authSub.unsubscribe();
  }
}
