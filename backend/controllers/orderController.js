import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js"
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

//config variables
const currency = "inr";
const deliveryCharge = 50;
const frontend_URL = 'http://localhost:5173';

const removeExpiredDeliveredOrders = async () => {
    const cutoff = new Date(Date.now() - 5 * 60 * 1000);
    await orderModel.deleteMany({ deliveredAt: { $ne: null, $lte: cutoff } });
};

// Placing User Order for Frontend using stripe
const placeOrder = async (req, res) => {

    try {
        const newOrder = new orderModel({
            userId: req.body.userId,
            items: req.body.items,
            amount: req.body.amount,
            address: req.body.address,
        })
        await newOrder.save();
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

        const line_items = req.body.items.map((item) => ({
            price_data: {
                currency: currency,
                product_data: {
                    name: item.name
                },
                unit_amount: item.price * 100 
            },
            quantity: item.quantity
        }))

        line_items.push({
            price_data: {
                currency: currency,
                product_data: {
                    name: "Delivery Charge"
                },
                unit_amount: deliveryCharge * 100
            },
            quantity: 1
        })

        const session = await stripe.checkout.sessions.create({
            success_url: `${frontend_URL}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${frontend_URL}/verify?success=false&orderId=${newOrder._id}`,
            line_items: line_items,
            mode: 'payment',
        });

        res.json({ success: true, session_url: session.url });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// Placing User Order for Frontend using stripe
const placeOrderCod = async (req, res) => {

    try {
        const newOrder = new orderModel({
            userId: req.body.userId,
            items: req.body.items,
            amount: req.body.amount,
            address: req.body.address,
            payment: true,
        })
        await newOrder.save();
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

        res.json({ success: true, message: "Order Placed" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// Listing Order for Admin panel
const listOrders = async (req, res) => {
    try {
        await removeExpiredDeliveredOrders();
        const cutoff = new Date(Date.now() - 5 * 60 * 1000);
        const orders = await orderModel.find({
            $or: [{ deliveredAt: null }, { deliveredAt: { $gt: cutoff } }]
        });
        res.json({ success: true, data: orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// User Orders for Frontend
const userOrders = async (req, res) => {
    try {
        await removeExpiredDeliveredOrders();
        const cutoff = new Date(Date.now() - 5 * 60 * 1000);
        const orders = await orderModel.find({
            userId: req.body.userId,
            $or: [{ deliveredAt: null }, { deliveredAt: { $gt: cutoff } }]
        });
        res.json({ success: true, data: orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

const updateStatus = async (req, res) => {
    console.log(req.body);
    try {
        const statusPriority = {
            "Food Processing": 0,
            "Out for delivery": 1,
            "Delivered": 2
        };

        const order = await orderModel.findById(req.body.orderId);
        if (!order) {
            return res.json({ success: false, message: "Order not found" });
        }

        const nextPriority = statusPriority[req.body.status];
        const currentPriority = statusPriority[order.status];

        if (nextPriority < currentPriority) {
            return res.json({
                success: false,
                message: "Cannot move order to a previous status"
            });
        }

        const isDelivered = req.body.status === "Delivered";
        await orderModel.findByIdAndUpdate(req.body.orderId, {
            status: req.body.status,
            deliveredAt: isDelivered ? new Date() : order.deliveredAt
        });
        res.json({ success: true, message: "Status Updated" })
    } catch (error) {
        res.json({ success: false, message: "Error" })
    }

}

const verifyOrder = async (req, res) => {
    const { orderId, success } = req.body;
    try {
        if (success === "true") {
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            res.json({ success: true, message: "Paid" })
        }
        else {
            await orderModel.findByIdAndDelete(orderId)
            res.json({ success: false, message: "Not Paid" })
        }
    } catch (error) {
        res.json({ success: false, message: "Not  Verified" })
    }

}

export { placeOrder, listOrders, userOrders, updateStatus, verifyOrder, placeOrderCod }