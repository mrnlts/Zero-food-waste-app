const express = require('express');

const isUserLoggedIn = require('../middleware/login');
const Order = require('../models/Order.model');

const router = express.Router();

router.get('/', isUserLoggedIn, async (req, res, next) => {
  try {
    const dbOpenOrders = await Order.find({ user: req.session.currentUser._id, status: 'open' })
      .populate('business')
      .populate({ path: 'product', populate: [{ path: 'businessName' }] });
    const dbClosedOrders = await Order.find({ user: req.session.currentUser._id, status: { $ne: 'open' } })
      .populate('business')
      .populate({ path: 'product', populate: [{ path: 'businessName' }] });
    res.render('user/order-history', {
      dbOrders: { dbOpenOrders, dbClosedOrders },
      successMessage: req.flash('success'),
      orderHistory: true,
    });
  } catch (e) {
    res.render('error404');
    next(e);
  }
});

router.get('/:id/details', isUserLoggedIn, async (req, res, next) => {
  const { id } = req.params;
  try {
    const dbOrder = await Order.findById(id)
      .populate('business')
      .populate({ path: 'products', populate: [{ path: 'item' }] });
    let openOrder = true;
    if (dbOrder.status !== 'open') {
      openOrder = false;
    }
    let prices = [];
    await dbOrder.products.forEach(prod => prices.push(prod.item.price));
    const total = await prices.reduce((acc, curr) => acc + curr);
    res.render('user/order-detail', { dbOrder, successMessage: req.flash('closed'), openOrder, total, orderDetail:true });
  } catch (e) {
    res.render('error404');
    next(e);
  }
});

router.post('/:id/confirm', isUserLoggedIn, async (req, res, next) => {
  const { id } = req.params;
  try {
    await Order.findByIdAndUpdate(id, { status: 'pending' });
    req.flash('closed', 'Your order has been sent to the restaurant!');
    res.redirect(`/orders/${id}/details`);
  } catch (e) {
    res.render('error404');
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  const { product, business } = req.body;
  try {
    let dbOrder = await Order.findOne({ business, status: 'open' });
    if (!dbOrder) {
      dbOrder = Order.create({
        business,
        products: [{ item: product, amount: 1 }],
        user: req.session.currentUser._id,
        status: 'open',
      });
    }
    let products = await [...dbOrder.products];
    await products.push({ amount: 1, item: product });
    await Order.findOneAndUpdate(business, { products });
    req.flash('success', 'Product added to shopping cart');
    res.redirect('/orders');
  } catch (e) {
    res.render('error500');
    next(e);
  }
});

router.post('/:id/delivered', async (req, res, next) => {
  const { id } = req.params;
  try {
    await Order.findByIdAndUpdate(id, { status: 'delivered' });
    req.flash('deliver', 'Your order was delivered');
    res.redirect('/business/orders');
  } catch (e) {
    res.render('error500');
    next(e);
  }
});

module.exports = router;
