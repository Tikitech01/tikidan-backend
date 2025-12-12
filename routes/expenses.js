const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const User = require('../models/User');

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  
  const jwt = require('jsonwebtoken');
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// GET all expenses for logged-in employee
router.get('/', verifyToken, async (req, res) => {
  try {
    const expenses = await Expense.find({ employeeId: req.user._id })
      .populate('employeeId', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: expenses,
      message: 'Expenses retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses',
      error: error.message
    });
  }
});

// GET expenses with filters
router.get('/filter', verifyToken, async (req, res) => {
  try {
    const { status, category, startDate, endDate } = req.query;
    let query = { employeeId: req.user._id };

    if (status && status !== 'All') {
      query.status = status;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const expenses = await Expense.find(query)
      .populate('employeeId', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: expenses,
      message: 'Filtered expenses retrieved successfully'
    });
  } catch (error) {
    console.error('Error filtering expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to filter expenses',
      error: error.message
    });
  }
});

// GET single expense by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('employeeId', 'name email')
      .populate('approvedBy', 'name email');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if user is the owner or admin
    if (expense.employeeId._id.toString() !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this expense'
      });
    }

    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense',
      error: error.message
    });
  }
});

// CREATE new expense
router.post('/', verifyToken, async (req, res) => {
  try {
    const { category, amount, description, date, location, client, receipt } = req.body;

    // Validate required fields
    if (!category || !amount || !description) {
      return res.status(400).json({
        success: false,
        message: 'Category, amount, and description are required'
      });
    }

    const newExpense = new Expense({
      employeeId: req.user._id,
      category,
      amount: parseFloat(amount),
      description,
      date: date ? new Date(date) : new Date(),
      location: location || null,
      client: client || null,
      receipt: receipt || null,
      status: 'Pending'
    });

    const savedExpense = await newExpense.save();
    const populatedExpense = await Expense.findById(savedExpense._id)
      .populate('employeeId', 'name email')
      .populate('approvedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: populatedExpense
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expense',
      error: error.message
    });
  }
});

// UPDATE expense
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if user is the owner
    if (expense.employeeId.toString() !== req.user._id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this expense'
      });
    }

    // Only allow updates if status is Pending
    if (expense.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only edit expenses with Pending status'
      });
    }

    const { category, amount, description, date, location, client, receipt } = req.body;

    expense.category = category || expense.category;
    expense.amount = amount ? parseFloat(amount) : expense.amount;
    expense.description = description || expense.description;
    expense.date = date ? new Date(date) : expense.date;
    expense.location = location !== undefined ? location : expense.location;
    expense.client = client !== undefined ? client : expense.client;
    expense.receipt = receipt || expense.receipt;

    const updatedExpense = await expense.save();
    const populatedExpense = await Expense.findById(updatedExpense._id)
      .populate('employeeId', 'name email')
      .populate('approvedBy', 'name email');

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: populatedExpense
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense',
      error: error.message
    });
  }
});

// DELETE expense
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if user is the owner
    if (expense.employeeId.toString() !== req.user._id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this expense'
      });
    }

    await Expense.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense',
      error: error.message
    });
  }
});

// GET statistics for dashboard
router.get('/stats/dashboard', verifyToken, async (req, res) => {
  try {
    const expenses = await Expense.find({ employeeId: req.user._id });

    const approvedExpenses = expenses.filter(e => e.status === 'Approved');
    const pendingExpenses = expenses.filter(e => e.status === 'Pending');
    const paidExpenses = expenses.filter(e => e.status === 'Paid');

    const stats = {
      totalExpenses: expenses.length,
      approvedCount: approvedExpenses.length,
      pendingCount: pendingExpenses.length,
      paidCount: paidExpenses.length,
      totalApprovedAmount: approvedExpenses.reduce((sum, e) => sum + e.amount, 0),
      totalPendingAmount: pendingExpenses.reduce((sum, e) => sum + e.amount, 0),
      totalPaidAmount: paidExpenses.reduce((sum, e) => sum + e.amount, 0)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

module.exports = router;
