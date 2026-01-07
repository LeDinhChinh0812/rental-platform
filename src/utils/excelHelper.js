const ExcelJS = require('exceljs');

class ExcelHelper {
  // Export danh sách transactions ra Excel
  static async exportTransactions(transactions, outputPath) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transactions');

    // Định nghĩa columns
    worksheet.columns = [
      { header: 'ID', key: 'TransactionID', width: 10 },
      { header: 'Hợp đồng', key: 'ContractID', width: 12 },
      { header: 'Nhà', key: 'PropertyName', width: 25 },
      { header: 'Phòng', key: 'RoomNumber', width: 12 },
      { header: 'Số tiền', key: 'Amount', width: 15 },
      { header: 'Loại', key: 'Type', width: 12 },
      { header: 'Ngày GD', key: 'TransactionDate', width: 15 },
      { header: 'Phí (%)', key: 'FeePercentage', width: 10 }
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };

    // Thêm data
    transactions.forEach(transaction => {
      worksheet.addRow({
        TransactionID: transaction.TransactionID,
        ContractID: transaction.ContractID,
        PropertyName: transaction.PropertyName,
        RoomNumber: transaction.RoomNumber,
        Amount: transaction.Amount,
        Type: transaction.Type,
        TransactionDate: new Date(transaction.TransactionDate).toLocaleDateString('vi-VN'),
        FeePercentage: transaction.FeePercentage
      });
    });

    // Format số tiền
    worksheet.getColumn('Amount').numFmt = '#,##0 "VNĐ"';

    await workbook.xlsx.writeFile(outputPath);
    return outputPath;
  }

  // Export danh sách payments
  static async exportPayments(payments, outputPath) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Payments');

    worksheet.columns = [
      { header: 'ID', key: 'PaymentID', width: 10 },
      { header: 'Hợp đồng', key: 'ContractID', width: 12 },
      { header: 'Người thuê', key: 'TenantName', width: 20 },
      { header: 'Nhà', key: 'PropertyName', width: 25 },
      { header: 'Phòng', key: 'RoomNumber', width: 12 },
      { header: 'Số tiền', key: 'Amount', width: 15 },
      { header: 'Phương thức', key: 'PaymentMethod', width: 15 },
      { header: 'Trạng thái', key: 'Status', width: 12 },
      { header: 'Ngày TT', key: 'PaymentDate', width: 15 }
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    };

    payments.forEach(payment => {
      worksheet.addRow({
        PaymentID: payment.PaymentID,
        ContractID: payment.ContractID,
        TenantName: payment.TenantName,
        PropertyName: payment.PropertyName,
        RoomNumber: payment.RoomNumber,
        Amount: payment.Amount,
        PaymentMethod: payment.PaymentMethod,
        Status: payment.Status,
        PaymentDate: new Date(payment.PaymentDate).toLocaleDateString('vi-VN')
      });
    });

    worksheet.getColumn('Amount').numFmt = '#,##0 "VNĐ"';

    await workbook.xlsx.writeFile(outputPath);
    return outputPath;
  }

  // Export báo cáo revenue
  static async exportRevenueReport(revenueData, outputPath) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Revenue Report');

    // Summary section
    worksheet.addRow(['BÁO CÁO DOANH THU']).font = { size: 16, bold: true };
    worksheet.addRow([]);
    worksheet.addRow(['Tổng doanh thu:', revenueData.TotalRevenue || 0]);
    worksheet.addRow(['Số lượng giao dịch:', revenueData.TransactionCount || 0]);
    worksheet.addRow([]);

    // Monthly breakdown
    if (revenueData.monthlyData) {
      worksheet.addRow(['DOANH THU THEO THÁNG']).font = { bold: true };
      worksheet.addRow(['Tháng', 'Doanh thu', 'Số GD']);

      revenueData.monthlyData.forEach(month => {
        worksheet.addRow([
          `Tháng ${month.Month}`,
          month.Revenue,
          month.TransactionCount
        ]);
      });
    }

    worksheet.getColumn(2).numFmt = '#,##0 "VNĐ"';

    await workbook.xlsx.writeFile(outputPath);
    return outputPath;
  }
}

module.exports = ExcelHelper;
