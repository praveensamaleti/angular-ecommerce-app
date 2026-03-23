import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { ProductCardComponent } from './product-card.component';
import type { Product } from '../../models/domain';

const mockProduct: Product = {
  id: 'p1',
  name: 'Test Widget',
  price: 49.99,
  images: ['https://example.com/img.jpg'],
  category: 'Electronics',
  stock: 5,
  rating: 4.2,
  ratingCount: 17,
  description: 'A great product',
  specs: {},
  reviews: [],
  variants: [],
};

describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent, RouterTestingModule],
      providers: [provideMockStore({ initialState: { currency: { currency: 'USD' } } })],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
    component.product = mockProduct;
    fixture.detectChanges();
  });

  it('should render product name', () => {
    expect(fixture.nativeElement.textContent).toContain('Test Widget');
  });

  it('should show Add to Cart button when cartQty is 0', () => {
    component.cartQty = 0;
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button.btn-primary');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Add to Cart');
  });

  it('should show qty counter when cartQty > 0', () => {
    component.cartQty = 3;
    fixture.detectChanges();
    const counter = fixture.nativeElement.querySelector('[role="group"]');
    expect(counter).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('3');
    const primaryBtn = fixture.nativeElement.querySelector('button.btn-primary');
    expect(primaryBtn).toBeNull();
  });

  it('should emit addToCart when Add to Cart clicked', () => {
    component.cartQty = 0;
    fixture.detectChanges();
    spyOn(component.addToCart, 'emit');
    const btn = fixture.nativeElement.querySelector('button.btn-primary');
    btn.click();
    expect(component.addToCart.emit).toHaveBeenCalledWith(mockProduct);
  });

  it('should emit qtyChange with qty+1 when + clicked', () => {
    component.cartQty = 2;
    fixture.detectChanges();
    spyOn(component.qtyChange, 'emit');
    const buttons = fixture.nativeElement.querySelectorAll('[role="group"] button');
    (buttons[1] as HTMLElement).click(); // + button
    expect(component.qtyChange.emit).toHaveBeenCalledWith({ product: mockProduct, qty: 3 });
  });

  it('should emit qtyChange with qty-1 when - clicked and qty > 1', () => {
    component.cartQty = 3;
    fixture.detectChanges();
    spyOn(component.qtyChange, 'emit');
    const buttons = fixture.nativeElement.querySelectorAll('[role="group"] button');
    (buttons[0] as HTMLElement).click(); // - button
    expect(component.qtyChange.emit).toHaveBeenCalledWith({ product: mockProduct, qty: 2 });
  });

  it('should emit removeFromCart when - clicked and qty === 1', () => {
    component.cartQty = 1;
    fixture.detectChanges();
    spyOn(component.removeFromCart, 'emit');
    const buttons = fixture.nativeElement.querySelectorAll('[role="group"] button');
    (buttons[0] as HTMLElement).click(); // - button
    expect(component.removeFromCart.emit).toHaveBeenCalledWith(mockProduct);
  });
});
