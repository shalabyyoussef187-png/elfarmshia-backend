const express = require('express');
const router = express.Router();
const requireAdminAuth = require('../middleware/requireAdminAuth');
const requireAnyAuth = require('../middleware/requireAnyAuth');
const orderController = require('../controllers/orderController');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order Management System
 */


/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order (Public)
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerName
 *               - phone
 *               - addressText
 *               - productId
 *             properties:
 *               customerName:
 *                 type: string
 *                 example: Youssif
 *               phone:
 *                 type: string
 *                 example: "01012345678"
 *               addressText:
 *                 type: string
 *                 example: Port Said
 *               lat:
 *                 type: number
 *                 example: 31.2565
 *               lng:
 *                 type: number
 *                 example: 32.2841
 *               productId:
 *                 type: string
 *                 example: 65f1a2b3c4d5e6f7a8b9c0d1
 *               quantity:
 *                 type: number
 *                 example: 2
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     customerName:
 *                       type: string
 *                     productName:
 *                       type: string
 *                       example: Panadol
 *                     quantity:
 *                       type: number
 *                     status:
 *                       type: string
 *                       example: pending
 */
router.post('/', orderController.createOrder);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all orders
 */
router.get('/', requireAdminAuth, orderController.getAllOrders);


/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get single order by ID (Admin & User)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Order ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 */
router.get('/:id', requireAnyAuth, orderController.getOrderById);


/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Update order status (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Order ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, shipped, delivered, cancelled]
 *                 example: shipped
 *     responses:
 *       200:
 *         description: Order status updated
 *       404:
 *         description: Order not found
 */
router.put('/:id/status', requireAdminAuth, orderController.updateOrderStatus);


/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Delete order (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Order ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order deleted
 *       404:
 *         description: Order not found
 */
router.delete('/:id', requireAdminAuth, orderController.deleteOrder);


module.exports = router;