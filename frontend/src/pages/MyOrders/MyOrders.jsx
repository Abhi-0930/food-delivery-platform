import React, { useContext, useEffect, useRef, useState } from 'react'
import './MyOrders.css'
import axios from 'axios'
import { StoreContext } from '../../Context/StoreContext';
import { assets } from '../../assets/assets';

const MyOrders = () => {
  
  const [data,setData] =  useState([]);
  const {url,token,currency} = useContext(StoreContext);
  const [showAll, setShowAll] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);
  const [activeOrder, setActiveOrder] = useState(null);
  const loadMoreRef = useRef(null);

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

  const getStatusPriority = (status = "") => {
    const normalized = status.toLowerCase();
    if (normalized.includes("prepar") || normalized.includes("process")) return 0;
    if (normalized.includes("out")) return 1;
    if (normalized.includes("deliver")) return 2;
    return 3;
  };

  const orderedOrders = [...uniqueOrders].sort((first, second) => {
    const firstPriority = getStatusPriority(first.status);
    const secondPriority = getStatusPriority(second.status);
    if (firstPriority === secondPriority) return 0;
    return firstPriority - secondPriority;
  });

  useEffect(() => {
    if (!showAll) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 4, orderedOrders.length));
        }
      },
      { rootMargin: "200px" }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [showAll, orderedOrders.length]);

  useEffect(() => {
    if (!showAll) {
      setVisibleCount(4);
    }
  }, [showAll]);

  useEffect(() => {
    if (!activeOrder) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setActiveOrder(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeOrder]);

  const statusSteps = [
    "Order placed",
    "Preparing",
    "Out for delivery",
    "Delivered"
  ];

  const getStatusIndex = (status = "") => {
    const normalized = status.toLowerCase();
    if (normalized.includes("deliver")) return 3;
    if (normalized.includes("out")) return 2;
    if (normalized.includes("prepar") || normalized.includes("process")) return 1;
    if (normalized.includes("place") || normalized.includes("pending")) return 0;
    return 0;
  };

  const displayedOrders = showAll
    ? orderedOrders.slice(0, visibleCount)
    : orderedOrders.slice(0, 4);

  const currentStatusIndex = activeOrder
    ? getStatusIndex(activeOrder.status)
    : 0;

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
        ) : displayedOrders.map((order,index)=>{
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
                <button onClick={() => setActiveOrder(order)}>Track Order</button>
            </div>
          )
        })}
        {uniqueOrders.length > 4 && !showAll && (
          <button className="my-orders-showall" onClick={() => setShowAll(true)}>
            Show all orders
          </button>
        )}
        {uniqueOrders.length > 4 && showAll && (
          <button className="my-orders-showall" onClick={() => setShowAll(false)}>
            Show less
          </button>
        )}
        {showAll && (
          <div className="my-orders-loadmore" ref={loadMoreRef}>
            {visibleCount < uniqueOrders.length ? "Loading more..." : "All orders loaded"}
          </div>
        )}
      </div>
      {activeOrder && (
        <div className="order-tracking-overlay" onClick={() => setActiveOrder(null)}>
          <div
            className="order-tracking-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="order-tracking-close"
              onClick={() => setActiveOrder(null)}
              aria-label="Close tracking"
            >
              x
            </button>
            <div className="order-tracking-header">
              <div>
                <p className="order-tracking-label">Order</p>
                <h3>#{String(activeOrder._id).slice(-6).toUpperCase()}</h3>
              </div>
              <div className="order-tracking-total">
                {currency}{activeOrder.amount}.00
              </div>
            </div>
            <div className="order-tracking-meta">
              <div>
                <span>Items</span>
                <b>{activeOrder.items.length}</b>
              </div>
              <div>
                <span>Status</span>
                <b>{activeOrder.status}</b>
              </div>
            </div>
            <div className="order-tracking-timeline">
              {statusSteps.map((step, index) => {
                const isDone = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                const stateText = isCurrent
                  ? "In progress"
                  : index < currentStatusIndex
                    ? "Completed"
                    : "Pending";
                return (
                  <div
                    key={step}
                    className={`order-tracking-step ${isDone ? "is-done" : ""} ${isCurrent ? "is-current" : ""}`}
                  >
                    <div className="order-tracking-dot" />
                    <div className="order-tracking-step-content">
                      <p>{step}</p>
                      <span>{stateText}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="order-tracking-actions">
              <button className="order-tracking-refresh" onClick={fetchOrders}>
                Refresh status
              </button>
              <button className="order-tracking-close-btn" onClick={() => setActiveOrder(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyOrders
