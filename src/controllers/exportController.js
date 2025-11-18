const path = require('path');
const fs = require('fs');
const Contract = require('../models/Contract');
const Payment = require('../models/Payment');
const Transaction = require('../models/Transaction');
const PDFHelper = require('../utils/pdfHelper');
const ExcelHelper = require('../utils/excelHelper');

// Export contract PDF
exports.exportContractPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const contract = await Contract.getById(id);
    if (!contract) {
      return res.status(404).json({ error: 'Không tìm thấy hợp đồng' });
    }

    // Check quyền truy cập
    const Property = require('../models/Property');
    const landlordId = await Property.getLandlordIdByUserId(userId);
    const tenantId = await Contract.getTenantIdByUserId(userId);

    if (contract.LandlordID !== landlordId && contract.TenantID !== tenantId) {
      return res.status(403).json({ error: 'Bạn không có quyền xuất hợp đồng này' });
    }

    // Tạo folder exports nếu chưa có
    const exportsDir = path.join(__dirname, '../../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const filename = `contract_${id}_${Date.now()}.pdf`;
    const filepath = path.join(exportsDir, filename);

    await PDFHelper.generateContractPDF(contract, filepath);

    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Xóa file sau khi download
      fs.unlinkSync(filepath);
    });
  } catch (error) {
    console.error('Export contract PDF error:', error);
    res.status(500).json({ error: 'Lỗi khi xuất hợp đồng PDF' });
  }
};

// Export payment PDF
exports.exportPaymentPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const payment = await Payment.getById(id);
    if (!payment) {
      return res.status(404).json({ error: 'Không tìm thấy thanh toán' });
    }

    // Check quyền truy cập
    const Property = require('../models/Property');
    const landlordId = await Property.getLandlordIdByUserId(userId);
    const tenantId = await Contract.getTenantIdByUserId(userId);

    if (payment.LandlordID !== landlordId && payment.TenantID !== tenantId) {
      return res.status(403).json({ error: 'Bạn không có quyền xuất hóa đơn này' });
    }

    const exportsDir = path.join(__dirname, '../../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const filename = `payment_${id}_${Date.now()}.pdf`;
    const filepath = path.join(exportsDir, filename);

    await PDFHelper.generatePaymentPDF(payment, filepath);

    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      fs.unlinkSync(filepath);
    });
  } catch (error) {
    console.error('Export payment PDF error:', error);
    res.status(500).json({ error: 'Lỗi khi xuất hóa đơn PDF' });
  }
};

// Export transactions Excel (AppOwner)
exports.exportTransactionsExcel = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let transactions;
    if (startDate && endDate) {
      transactions = await Transaction.getByDateRange(startDate, endDate);
    } else {
      transactions = await Transaction.getAll();
    }

    const exportsDir = path.join(__dirname, '../../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const filename = `transactions_${Date.now()}.xlsx`;
    const filepath = path.join(exportsDir, filename);

    await ExcelHelper.exportTransactions(transactions, filepath);

    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      fs.unlinkSync(filepath);
    });
  } catch (error) {
    console.error('Export transactions Excel error:', error);
    res.status(500).json({ error: 'Lỗi khi xuất Excel' });
  }
};

// Export payments Excel
exports.exportPaymentsExcel = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    let payments;

    if (role === 'AppOwner') {
      payments = await Payment.getAll();
    } else if (role === 'Landlord') {
      const Property = require('../models/Property');
      const landlordId = await Property.getLandlordIdByUserId(userId);
      payments = await Payment.getByLandlord(landlordId);
    } else if (role === 'Tenant') {
      const tenantId = await Contract.getTenantIdByUserId(userId);
      payments = await Payment.getByTenant(tenantId);
    } else {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    const exportsDir = path.join(__dirname, '../../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const filename = `payments_${Date.now()}.xlsx`;
    const filepath = path.join(exportsDir, filename);

    await ExcelHelper.exportPayments(payments, filepath);

    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      fs.unlinkSync(filepath);
    });
  } catch (error) {
    console.error('Export payments Excel error:', error);
    res.status(500).json({ error: 'Lỗi khi xuất Excel' });
  }
};

// Export revenue report PDF (AppOwner)
exports.exportRevenueReportPDF = async (req, res) => {
  try {
    const { startDate, endDate, year } = req.query;

    // Lấy dữ liệu
    const revenue = await Transaction.getTotalRevenue(startDate, endDate);
    const occupancy = await Transaction.getRoomOccupancyRate();
    const monthlyRevenue = year ? await Transaction.getRevenueByMonth(year) : null;

    const reportData = {
      startDate,
      endDate,
      totalRevenue: revenue.TotalRevenue,
      transactionCount: revenue.TransactionCount,
      occupancy: {
        TotalRooms: occupancy.TotalRooms,
        RentedRooms: occupancy.RentedRooms,
        OccupancyRate: occupancy.OccupancyRate
      },
      monthlyData: monthlyRevenue
    };

    const exportsDir = path.join(__dirname, '../../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const filename = `revenue_report_${Date.now()}.pdf`;
    const filepath = path.join(exportsDir, filename);

    await PDFHelper.generateReportPDF(reportData, filepath);

    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      fs.unlinkSync(filepath);
    });
  } catch (error) {
    console.error('Export revenue report PDF error:', error);
    res.status(500).json({ error: 'Lỗi khi xuất báo cáo PDF' });
  }
};

// Export revenue report Excel (AppOwner)
exports.exportRevenueReportExcel = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();

    const revenue = await Transaction.getTotalRevenue();
    const monthlyRevenue = await Transaction.getRevenueByMonth(currentYear);

    const reportData = {
      TotalRevenue: revenue.TotalRevenue,
      TransactionCount: revenue.TransactionCount,
      monthlyData: monthlyRevenue
    };

    const exportsDir = path.join(__dirname, '../../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const filename = `revenue_report_${Date.now()}.xlsx`;
    const filepath = path.join(exportsDir, filename);

    await ExcelHelper.exportRevenueReport(reportData, filepath);

    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      fs.unlinkSync(filepath);
    });
  } catch (error) {
    console.error('Export revenue report Excel error:', error);
    res.status(500).json({ error: 'Lỗi khi xuất báo cáo Excel' });
  }
};
