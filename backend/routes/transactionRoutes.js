import express from "express";
import mongoose from "mongoose";

import Transaction from "../models/Transaction.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All transaction routes require authentication
router.use(authMiddleware);

// Allowed payment methods
const paymentMethods = ["cash", "upi", "card", "bank", "other"];

// Helper: validate date
function isValidDate(value) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

// 1. ADD TRANSACTION
router.post("/", async (req, res) => {
  try {
    const { type, title, amount, category, date, note, paymentMethod } =
      req.body;

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be income or expense",
      });
    }

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid transaction title is required",
      });
    }

    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a positive number",
      });
    }

    if (
      typeof category !== "string" ||
      !category.trim() ||
      category.trim().length > 60
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid category is required",
      });
    }

    if (date !== undefined && !isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid date",
      });
    }

    if (
      paymentMethod !== undefined &&
      !paymentMethods.includes(paymentMethod)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    const transaction = await Transaction.create({
      userId: req.userId,
      type,
      title: title.trim(),
      amount,
      category: category.trim(),
      date: date ? new Date(date) : new Date(),
      note: typeof note === "string" ? note.trim() : "",
      paymentMethod: paymentMethod || "other",
    });

    return res.status(201).json({
      success: true,
      message: "Transaction added successfully",
      transaction,
    });
  } catch (error) {
    console.error("Add transaction error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to add transaction",
    });
  }
});

// 2. GET ALL TRANSACTIONS
router.get("/", async (req, res) => {
  try {
    const requestedLimit = Number(req.query.limit) || 50;
    const limit = Math.min(Math.max(requestedLimit, 1), 100);

    const transactions = await Transaction.find({
      userId: req.userId,
    })
      .sort({ date: -1, createdAt: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error("Get transactions error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve transactions",
    });
  }
});

// 3. GET FINANCIAL SUMMARY
router.get("/summary", async (req, res) => {
  try {
    const result = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.userId),
        },
      },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    let income = 0;
    let expenses = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    for (const item of result) {
      if (item._id === "income") {
        income = item.total;
        incomeCount = item.count;
      }

      if (item._id === "expense") {
        expenses = item.total;
        expenseCount = item.count;
      }
    }

    return res.status(200).json({
      success: true,
      summary: {
        totalIncome: income,
        totalExpenses: expenses,
        availableBalance: income - expenses,
        incomeCount,
        expenseCount,
        totalTransactions: incomeCount + expenseCount,
      },
    });
  } catch (error) {
    console.error("Summary error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to calculate financial summary",
    });
  }
});

// 4. UPDATE TRANSACTION
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID",
      });
    }

    const transaction = await Transaction.findOne({
      _id: id,
      userId: req.userId,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const { type, title, amount, category, date, note, paymentMethod } =
      req.body;

    if (type !== undefined) {
      if (!["income", "expense"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid transaction type",
        });
      }
      transaction.type = type;
    }

    if (title !== undefined) {
      if (
        typeof title !== "string" ||
        !title.trim() ||
        title.trim().length > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid transaction title",
        });
      }
      transaction.title = title.trim();
    }

    if (amount !== undefined) {
      if (
        typeof amount !== "number" ||
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Amount must be a positive number",
        });
      }
      transaction.amount = amount;
    }

    if (category !== undefined) {
      if (
        typeof category !== "string" ||
        !category.trim() ||
        category.trim().length > 60
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid category",
        });
      }
      transaction.category = category.trim();
    }

    if (date !== undefined) {
      if (!isValidDate(date)) {
        return res.status(400).json({
          success: false,
          message: "Invalid date",
        });
      }
      transaction.date = new Date(date);
    }

    if (note !== undefined) {
      if (typeof note !== "string" || note.length > 500) {
        return res.status(400).json({
          success: false,
          message: "Invalid note",
        });
      }
      transaction.note = note.trim();
    }

    if (paymentMethod !== undefined) {
      if (!paymentMethods.includes(paymentMethod)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment method",
        });
      }
      transaction.paymentMethod = paymentMethod;
    }

    await transaction.save();

    return res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      transaction,
    });
  } catch (error) {
    console.error("Update transaction error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update transaction",
    });
  }
});

// 5. DELETE TRANSACTION
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID",
      });
    }

    const transaction = await Transaction.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("Delete transaction error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete transaction",
    });
  }
});

export default router;
