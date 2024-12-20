import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { BreakPointService } from '../../services/break-point.service';
import { FormsModule } from '@angular/forms';
import { UtilService } from '../../services/util.service';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MatTimepickerModule,
  provideNativeDateTimeAdapter,
} from '@dhutaryan/ngx-mat-timepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { OrderType } from '../../models/core.model';
import { Product } from '../../../cafes/models/cafe.model';
import { CartService } from '../../../cart/services/cart.service';

@Component({
  selector: 'app-bottom-sheet',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatListModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatTimepickerModule,
  ],
  templateUrl: './bottom-sheet.component.html',
  styleUrl: './bottom-sheet.component.scss',
  providers: [provideNativeDateAdapter(), provideNativeDateTimeAdapter()],
})
export class BottomSheetComponent implements OnInit {
  tables = [
    {
      id: 1,
      name: 'Table-1',
      info: '2-4 people',
    },
    {
      id: 2,
      name: 'Table-2',
      info: '3-6 people',
    },
    {
      id: 3,
      name: 'Table-1',
      info: '6-10 people',
    },
  ];
  guests = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  orderType!: number | null;
  tableId!: number | null;
  guest!: number | null;
  selectedDate!: Date | null;
  selectedTime!: Date | null;
  selectedEndTime!: Date | null;
  alreadySelectedOrderType!: number;
  cafeID!: string | null;
  cafeName!: string | null;
  minDate = new Date(); // Sets minDate to today

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA)
    public data: {
      orderType: number;
      cafeID: string;
      cafeName: string;
    },
    private bottomSheetRef: MatBottomSheetRef<BottomSheetComponent>,
    public breakPointService: BreakPointService,
    private cartService: CartService,
    private router: Router,
    private utilService: UtilService,
  ) {
    this.alreadySelectedOrderType = data?.orderType;
    this.orderType = data?.orderType;
    this.cafeID = data?.cafeID;
    this.cafeName = data?.cafeName;
  }

  ngOnInit(): void {
    const orderDetails = this.utilService.getOrderDetails();
    if (orderDetails) {
      this.orderType = this.alreadySelectedOrderType
        ? this.alreadySelectedOrderType
        : orderDetails.orderType;
      this.tableId = orderDetails.tableId;
      this.guest = orderDetails.guest;
      this.selectedDate = orderDetails.selectedDate;
      this.selectedTime = orderDetails.selectedTime;
      this.selectedEndTime = orderDetails.selectedEndTime;
      this.cafeName = this.data?.cafeName
        ? this.data?.cafeName
        : orderDetails?.cafeName;
      this.cafeID = this.data?.cafeID ? this.data?.cafeID : orderDetails.cafeID;
    }
  }

  onSelectType(type: 1 | 2) {
    this.orderType = type;
  }

  proccedToCart() {
    const orderDetails = {
      orderType: this.orderType,
      cafeID: this.cafeID,
      cafeName: this.cafeName,
      tableId: this.tableId,
      guest: this.guest,
      selectedDate: this.selectedDate,
      selectedTime: this.selectedTime,
      selectedEndTime: this.selectedEndTime,
    };
    localStorage.setItem('orderDetails', JSON.stringify(orderDetails));

    if (this.orderType === OrderType['Reserve table']) {
      this.prepareCustomizedCart();
    }

    this.router.navigate(['/cart']);
    this.bottomSheetRef.dismiss(orderDetails);
  }

  prepareCustomizedCart() {
    // Calculate time difference in hours
    const startTime = this.selectedTime ? new Date(this.selectedTime) : null;
    const endTime = this.selectedEndTime
      ? new Date(this.selectedEndTime)
      : null;

    if (startTime && endTime) {
      const timeDiffMs = endTime.getTime() - startTime.getTime();
      let hoursDiff = timeDiffMs / (1000 * 60 * 60); // Convert ms to hours

      // Round up to the nearest hour
      hoursDiff = Math.ceil(hoursDiff);

      // Calculate price based on hours
      let price = 500; // Base price
      if (hoursDiff > 1) {
        price = 500 * hoursDiff;
      }

      const customizedCart: Product[] = [
        {
          id: Date.now().toString(),
          cafeId: this.cafeID!,
          cafeName: this.cafeName!,
          description: '',
          image:
            'https://cdnimg.webstaurantstore.com/uploads/seo_category/2019/5/table-dining-sets.jpg',
          name: `Guests (${this.guest} people)`,
          price,
          quantity: 1,
          productType: 1, // does not matter!
        },
      ];
      this.cartService.cartItems = [...customizedCart];
      localStorage.setItem('cartItems', JSON.stringify(customizedCart));
    }
  }

  resetOptions() {
    this.orderType = null;
    localStorage.removeItem('orderDetails');
  }
}
