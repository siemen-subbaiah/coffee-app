import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { TruncatePipe } from '../../../core/pipes/truncate.pipe';
import { Product } from '../../models/cafe.model';
import { MatIconModule } from '@angular/material/icon';
import { CartService } from '../../../cart/services/cart.service';
import { MatDialog } from '@angular/material/dialog';
import { CartWarningComponent } from '../../../core/components/cart-warning/cart-warning.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [TruncatePipe, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent {
  isAllowedToCart = true;
  @Input({ required: true }) product!: Product;
  @Input() cafeId!: string;
  currentOrderSub = new Subscription();

  constructor(
    private cartService: CartService,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {}

  onAddItem(product: Product) {
    if (!this.checkAllowedToCart()) {
      this.dialog
        .open(CartWarningComponent)
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.cartService.clearCart();
            product.quantity++;
            this.cartService.addToCart(product);
          }
        });
      return;
    }
    product.quantity++;
    this.cartService.addToCart(product);
  }

  onRemoveItem(product: Product) {
    if (product.quantity > 0) {
      product.quantity--;
      this.cartService.removeFromCart(product.quantity, product);
    }
  }

  checkAllowedToCart() {
    if (this.cafeId) {
      const cartItems = JSON.parse(
        localStorage.getItem('cartItems')!,
      ) as Product[];
      if (cartItems?.length) {
        return cartItems[0].cafeId === this.cafeId;
      }
    }
    return true;
  }
}
