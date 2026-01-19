import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import orderModel from "../models/orderModel.js";

dotenv.config();

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

const getSignature = (order) => ({
  userId: order.userId ?? "",
  amount: order.amount ?? 0,
  items: JSON.stringify(normalizeItems(order.items)),
  address: JSON.stringify(normalizeAddress(order.address))
});

const cleanupDuplicateOrders = async () => {
  await connectDB();
  const orders = await orderModel.find({}).sort({ date: 1 });
  const toDelete = [];

  const duplicateWindowMs = 2 * 60 * 1000;
  const recent = [];

  orders.forEach((order) => {
    const signature = getSignature(order);
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

  console.log(`Duplicate orders removed: ${toDelete.length}`);
  await mongoose.disconnect();
};

cleanupDuplicateOrders()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Cleanup failed:", error);
    process.exit(1);
  });
