import React, { useContext, useEffect, useState } from 'react'
import './MyOrders.css'
import axios from 'axios'
import { StoreContext } from '../../Context/StoreContext';
import { assets } from '../../assets/assets';

const MyOrders = () => {
  
  const [data,setData] =  useState([]);
  const {url,token,currency} = useContext(StoreContext);

  const fetchOrders = async () => {
    const response = await axios.post(url+"/api/order/userorders",{},{headers:{token}});
    setData(response.data.data)
  }

  useEffect(()=>{
    if (!token) return;
    fetchOrders();
    const intervalId = setInterval(fetchOrders, 10000);
    return () => clearInterval(intervalId);
  },[token])

  const uniqueOrders = Array.from(
    new Map(data.map((order) => [order._id, order])).values()
  );

  return (
    <div className='my-orders'>
      <h2>My Orders</h2>
      <div className="container">
        {uniqueOrders.length === 0 ? (
          <div className="my-orders-empty">
            <div className="my-orders-empty-image">
              <img src={assets.parcel_icon} alt="No orders yet" />
            </div>
            <h3>No orders yet</h3>
            <p>You haven't booked any orders. Start exploring the menu and place your first one.</p>
          </div>
        ) : uniqueOrders.map((order,index)=>{
          return (
            <div key={index} className='my-orders-order'>
                <img src={assets.parcel_icon} alt="" />
                <p>{order.items.map((item,index)=>{
                  if (index === order.items.length-1) {
                    return item.name+" x "+item.quantity
                  }
                  else{
                    return item.name+" x "+item.quantity+", "
                  }
                  
                })}</p>
                <p>{currency}{order.amount}.00</p>
                <p>Items: {order.items.length}</p>
                <p><span>&#x25cf;</span> <b>{order.status}</b></p>
                <button onClick={fetchOrders}>Track Order</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MyOrders
