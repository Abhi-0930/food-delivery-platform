import React, { useContext } from 'react'
import './Cart.css'
import { StoreContext } from '../../Context/StoreContext'
import { useNavigate } from 'react-router-dom';
import { assets } from '../../assets/assets';

const Cart = () => {

  const {cartItems, food_list, removeFromCart,getTotalCartAmount,url,currency,deliveryCharge} = useContext(StoreContext);
  const navigate = useNavigate();

  const hasItems = food_list.some((item) => cartItems[item._id] > 0);

  return (
    <div className='cart'>
      {!hasItems ? (
        <div className="cart-empty">
          <div className="cart-empty-image">
            <img src={assets.basket_icon} alt="Empty cart" />
          </div>
          <h3>Your cart is empty</h3>
          <p>Add an item to cart to see it here.</p>
          <button onClick={() => navigate('/')}>Browse Menu</button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            <div className="cart-items-title">
              <p>Items</p> <p>Title</p> <p>Price</p> <p>Quantity</p> <p>Total</p> <p>Remove</p>
            </div>
            <br />
            <hr />
            {food_list.map((item, index) => {
              if (cartItems[item._id]>0) {
                const imageUrl = item.image?.startsWith("http") || item.image?.startsWith("/")
                  ? item.image
                  : `${url}/images/${item.image}`;
                return (<div key={index}>
                  <div className="cart-items-title cart-items-item">
                    <img src={imageUrl} alt="" />
                    <p>{item.name}</p>
                    <p>{currency}{item.price}</p>
                    <div>{cartItems[item._id]}</div>
                    <p>{currency}{item.price*cartItems[item._id]}</p>
                    <p className='cart-items-remove-icon' onClick={()=>removeFromCart(item._id)}>x</p>
                  </div>
                  <hr />
                </div>)
              }
            })}
          </div>
          <div className="cart-bottom">
            <div className="cart-total">
              <h2>Cart Totals</h2>
              <div>
                <div className="cart-total-details"><p>Subtotal</p><p>{currency}{getTotalCartAmount()}</p></div>
                <hr />
                <div className="cart-total-details"><p>Delivery Fee</p><p>{currency}{getTotalCartAmount()===0?0:deliveryCharge}</p></div>
                <hr />
                <div className="cart-total-details"><b>Total</b><b>{currency}{getTotalCartAmount()===0?0:getTotalCartAmount()+deliveryCharge}</b></div>
              </div>
              <button onClick={()=>navigate('/order')}>PROCEED TO CHECKOUT</button>
            </div>
            <div className="cart-promocode">
              <div>
                <p>If you have a promo code, Enter it here</p>
                <div className='cart-promocode-input'>
                  <input type="text" placeholder='promo code'/>
                  <button>Submit</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Cart
