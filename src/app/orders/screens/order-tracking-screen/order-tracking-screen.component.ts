import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrderService } from '../../services/order.service';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import {
  STEPPER_GLOBAL_OPTIONS,
  StepperSelectionEvent,
} from '@angular/cdk/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { BreakPointService } from '../../../core/services/break-point.service';
import { PaymentService } from '../../../payment/services/payment.service';
import { UtilService } from '../../../core/services/util.service';
import { orderWorker } from '../../../core/utils/data';

@Component({
  selector: 'app-order-tracking-screen',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatStepperModule,
  ],
  templateUrl: './order-tracking-screen.component.html',
  styleUrl: './order-tracking-screen.component.scss',
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { displayDefaultIndicatorType: false },
    },
  ],
})
export class OrderTrackingScreenComponent implements OnInit, OnDestroy {
  orderId!: string;
  isOrderAccepted = false;
  isOrderPrepared = false;
  isOrderDone = false;
  progress = 0;
  deliveryTime = 0;
  orderDeliveryText!: string;
  stepperIndex = 0;
  currentIllustration = '/order-accepted.svg';
  timeoutId!: any;
  intervalId!: any;
  orderSub = new Subscription();
  fallbackProgressStarted = false;
  @ViewChild('stepper') stepper!: MatStepper;

  constructor(
    public breakPointService: BreakPointService,
    private cdr: ChangeDetectorRef,
    private paymentService: PaymentService,
    private orderService: OrderService,
    private utilService: UtilService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.params['id'];
    this.getOrder(this.orderId);
  }

  getOrder(orderId: string) {
    this.orderSub = this.orderService.getOrderById(orderId).subscribe({
      next: (res) => {
        if (res) {
          this.deliveryTime = res.deliveryTime as number;
          if (res.orderType === 0) {
            this.orderDeliveryText = 'Need to see!';
          } else if (res.orderType === 1) {
            this.orderDeliveryText =
              'Your order is ready for pickup, please collect at counter';
          } else if (res.orderType === 2) {
            this.orderDeliveryText =
              'Your order will be delivered to your table, Enjoy';
          }

          if (!res.isDelivered) {
            this.isOrderAccepted = true;
            this.essentialsUpdate('cooking.svg');

            // this is to check if there is an active worker!
            const workerTimeout = setTimeout(() => {
              if (!this.fallbackProgressStarted) {
                this.startProgress();
              }
            }, 3000);

            orderWorker.onmessage = (e) => {
              console.log(e.data);
              clearTimeout(workerTimeout);
              this.startWorkerProgress(e.data);
            };
          } else {
            this.progress = 100;
            this.isOrderAccepted = true;
            this.isOrderPrepared = true;
            this.isOrderDone = true;
          }
        } else {
          this.router.navigate(['/']);
          this.utilService.openSnackBar('Order not found');
        }
      },
      error: (err) => {
        this.router.navigate(['/']);
        this.utilService.openSnackBar('Something went wrong');
      },
    });
  }

  startProgress() {
    this.fallbackProgressStarted = true;

    const totalTimeInMilliseconds = this.deliveryTime * 60 * 1000; // Convert deliveryTime from minutes to milliseconds
    const totalIntervals = totalTimeInMilliseconds / 1000; // Total intervals (1 per second)
    const increment = 100 / totalIntervals; // Progress increment per second

    this.intervalId = setInterval(() => {
      this.progress += increment;

      if (this.progress >= 100) {
        this.progress = 100;
        clearInterval(this.intervalId);
        this.isOrderDone = true;
        this.essentialsUpdate('done.svg');
        this.updateOrderDelivery(this.orderId, this.deliveryTime, Date.now());
      }
    }, 1000);
  }

  startWorkerProgress(data: any) {
    this.progress = data.progress;
    if (this.progress >= 100) {
      this.progress = 100;
      this.isOrderDone = true;
      this.essentialsUpdate('done.svg');
      this.updateOrderDelivery(this.orderId, this.deliveryTime, Date.now());

      if (orderWorker) {
        orderWorker.terminate();
      }
    }
  }

  get currentImage() {
    switch (this.stepperIndex) {
      case 0:
        return '/order-accepted.svg';
      case 1:
        return '/cooking.svg';
      case 2:
        return '/done.svg';
      default:
        return '/order-accepted.svg';
    }
  }

  onStepChange(event: StepperSelectionEvent) {
    this.stepperIndex = event.selectedIndex;
  }

  essentialsUpdate(imgUrl: string) {
    this.stepperIndex++;
    this.currentIllustration = imgUrl;
    this.cdr.detectChanges(); // Force Angular to check for updates
    this.stepper.next();
  }

  updateOrderDelivery(
    orderId: string,
    deliveryTime: number,
    deliveredTime: number,
  ) {
    this.paymentService
      .updateOrder(orderId, deliveryTime, deliveredTime)
      .subscribe({
        next: (res) => {
          this.utilService.openSnackBar('Order delivered successfully');
        },
        error: (err) => {
          console.log(err);
          this.utilService.openSnackBar('Something went wrong');
        },
      });
  }

  ngOnDestroy(): void {
    if (this.orderSub) {
      this.orderSub.unsubscribe();
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // if (orderWorker) {
    //   orderWorker.terminate();
    // }
  }
}
