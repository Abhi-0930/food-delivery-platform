import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js"
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

//config variables
const currency = "inr";
const deliveryCharge = 50;
const frontend_URL = 'http://localhost:5173';

const normalizeItems = (items = []) =>
    items
        .map((item) => ({
            id: item._id ?? item.id ?? "",
            name: item.name ?? "",
            qty: item.quantity ?? 0,
            price: item.price ?? 0
        }))
        .sort((a, b) => `${a.id}${a.name}`.localeCompare(`${b.id}${b.name}`));

const normalizeAddress = (address = {}) => ({
    firstName: address.firstName ?? "",
    lastName: address.lastName ?? "",
    email: address.email ?? "",
    street: address.street ?? "",
    city: address.city ?? "",
    state: address.state ?? "",
    zipcode: address.zipcode ?? "",
    country: address.country ?? "",
    phone: address.phone ?? ""
});

const removeRecentDuplicates = async () => {
    const duplicateWindowMs = 2 * 60 * 1000;
    const cutoff = new Date(Date.now() - duplicateWindowMs);
    const recentOrders = await orderModel.find({ date: { $gte: cutoff } }).sort({ date: 1 });
    const recent = [];
    const toDelete = [];

    recentOrders.forEach((order) => {
        const signature = {
            userId: order.userId ?? "",
            amount: order.amount ?? 0,
            items: JSON.stringify(normalizeItems(order.items)),
            address: JSON.stringify(normalizeAddress(order.address))
        };
        const orderTime = new Date(order.date).getTime();
        const matchIndex = recent.findIndex((entry) => {
            const delta = orderTime - entry.time;
            return (
                delta <= duplicateWindowMs &&
                entry.signature.userId === signature.userId &&
                entry.signature.amount === signature.amount &&
                entry.signature.items === signature.items &&
                entry.signature.address === signature.address
            );
        });

        if (matchIndex === -1) {
            recent.push({ signature, time: orderTime, order });
            return;
        }

        const existing = recent[matchIndex].order;
        if (existing.payment === true && order.payment !== true) {
            toDelete.push(order._id);
            return;
        }

        if (order.payment === true && existing.payment !== true) {
            toDelete.push(existing._id);
            recent[matchIndex] = { signature, time: orderTime, order };
            return;
        }

        toDelete.push(order._id);
    });

    if (toDelete.length) {
        await orderModel.deleteMany({ _id: { $in: toDelete } });
    }
};

const getDeliveredCutoff = () => new Date(Date.now() - 30 * 1000);

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
        await removeRecentDuplicates();
        const cutoff = getDeliveredCutoff();
        const orders = await orderModel.find({
            $or: [
                { deliveredAt: null, status: { $ne: "Delivered" } },
                { deliveredAt: { $gt: cutoff } },
                { status: "Delivered", deliveredAt: null, date: { $gt: cutoff } }
            ]
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
        await removeRecentDuplicates();
        const orders = await orderModel.find({ userId: req.body.userId });
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
            deliveredAt: isDelivered ? new Date() : null
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