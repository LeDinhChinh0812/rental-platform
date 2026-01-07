const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFHelper {
  // Tạo PDF hợp đồng
  static async generateContractPDF(contract, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(outputPath);

        doc.pipe(stream);

        // Header
        doc.fontSize(20).text('HỢP ĐỒNG THUÊ NHÀ', { align: 'center' });
        doc.moveDown();

        // Thông tin hợp đồng
        doc.fontSize(12);
        doc.text(`Số hợp đồng: ${contract.ContractID}`, { continued: false });
        doc.text(`Ngày tạo: ${new Date(contract.CreatedAt).toLocaleDateString('vi-VN')}`);
        doc.moveDown();

        // Bên cho thuê
        doc.fontSize(14).text('BÊN CHO THUÊ (BÊN A)', { underline: true });
        doc.fontSize(12);
        doc.text(`Họ tên: ${contract.LandlordName || 'N/A'}`);
        doc.text(`Số điện thoại: ${contract.LandlordPhone || 'N/A'}`);
        doc.text(`Email: ${contract.LandlordEmail || 'N/A'}`);
        doc.moveDown();

        // Bên thuê
        doc.fontSize(14).text('BÊN THUÊ (BÊN B)', { underline: true });
        doc.fontSize(12);
        doc.text(`Họ tên: ${contract.TenantName}`);
        doc.text(`Số điện thoại: ${contract.TenantPhone}`);
        doc.text(`Email: ${contract.TenantEmail}`);
        doc.moveDown();

        // Thông tin phòng
        doc.fontSize(14).text('THÔNG TIN PHÒNG', { underline: true });
        doc.fontSize(12);
        doc.text(`Tên nhà: ${contract.PropertyName}`);
        doc.text(`Địa chỉ: ${contract.PropertyAddress}`);
        doc.text(`Số phòng: ${contract.RoomNumber}`);
        doc.text(`Diện tích: ${contract.Area} m²`);
        doc.moveDown();

        // Điều khoản
        doc.fontSize(14).text('ĐIỀU KHOẢN HỢP ĐỒNG', { underline: true });
        doc.fontSize(12);
        doc.text(`Ngày bắt đầu: ${new Date(contract.StartDate).toLocaleDateString('vi-VN')}`);
        doc.text(`Ngày kết thúc: ${new Date(contract.EndDate).toLocaleDateString('vi-VN')}`);
        doc.text(`Tiền thuê hàng tháng: ${contract.MonthlyRent.toLocaleString('vi-VN')} VNĐ`);
        doc.text(`Tiền đặt cọc: ${contract.Deposit.toLocaleString('vi-VN')} VNĐ`);
        doc.text(`Trạng thái: ${contract.Status}`);
        doc.moveDown();

        // Chữ ký
        doc.moveDown(2);
        doc.fontSize(12);
        doc.text('BÊN A', 100, doc.y);
        doc.text('BÊN B', 400, doc.y);
        doc.moveDown(3);
        doc.text('(Ký và ghi rõ họ tên)', 70, doc.y);
        doc.text('(Ký và ghi rõ họ tên)', 370, doc.y);

        doc.end();

        stream.on('finish', () => resolve(outputPath));
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Tạo PDF hóa đơn thanh toán
  static async generatePaymentPDF(payment, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(outputPath);

        doc.pipe(stream);

        // Header
        doc.fontSize(20).text('HÓA ĐƠN THANH TOÁN', { align: 'center' });
        doc.moveDown();

        // Thông tin hóa đơn
        doc.fontSize(12);
        doc.text(`Số hóa đơn: ${payment.PaymentID}`);
        doc.text(`Ngày thanh toán: ${new Date(payment.PaymentDate).toLocaleDateString('vi-VN')}`);
        doc.moveDown();

        // Thông tin khách hàng
        doc.fontSize(14).text('THÔNG TIN KHÁCH HÀNG', { underline: true });
        doc.fontSize(12);
        doc.text(`Họ tên: ${payment.TenantName}`);
        doc.text(`Phòng: ${payment.RoomNumber} - ${payment.PropertyName}`);
        doc.moveDown();

        // Chi tiết thanh toán
        doc.fontSize(14).text('CHI TIẾT THANH TOÁN', { underline: true });
        doc.fontSize(12);
        doc.text(`Số tiền: ${payment.Amount.toLocaleString('vi-VN')} VNĐ`);
        doc.text(`Phương thức: ${payment.PaymentMethod}`);
        doc.text(`Trạng thái: ${payment.Status}`);
        doc.moveDown();

        // Platform fee breakdown
        const platformFee = payment.Amount * 0.1;
        const landlordReceives = payment.Amount - platformFee;
        
        doc.fontSize(12);
        doc.text(`Phí nền tảng (10%): ${platformFee.toLocaleString('vi-VN')} VNĐ`);
        doc.text(`Chủ nhà nhận: ${landlordReceives.toLocaleString('vi-VN')} VNĐ`);
        doc.moveDown(2);

        doc.fontSize(10).text('Cảm ơn bạn đã sử dụng dịch vụ!', { align: 'center' });

        doc.end();

        stream.on('finish', () => resolve(outputPath));
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Tạo PDF báo cáo
  static async generateReportPDF(reportData, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(outputPath);

        doc.pipe(stream);

        // Header
        doc.fontSize(20).text('BÁO CÁO DOANH THU', { align: 'center' });
        doc.moveDown();

        // Thời gian
        doc.fontSize(12);
        doc.text(`Từ ngày: ${reportData.startDate || 'N/A'}`);
        doc.text(`Đến ngày: ${reportData.endDate || 'N/A'}`);
        doc.moveDown();

        // Tổng quan
        doc.fontSize(14).text('TỔNG QUAN', { underline: true });
        doc.fontSize(12);
        doc.text(`Tổng doanh thu: ${(reportData.totalRevenue || 0).toLocaleString('vi-VN')} VNĐ`);
        doc.text(`Số lượng giao dịch: ${reportData.transactionCount || 0}`);
        doc.moveDown();

        // Thống kê phòng
        if (reportData.occupancy) {
          doc.fontSize(14).text('THỐNG KÊ PHÒNG', { underline: true });
          doc.fontSize(12);
          doc.text(`Tổng số phòng: ${reportData.occupancy.TotalRooms || 0}`);
          doc.text(`Phòng đã thuê: ${reportData.occupancy.RentedRooms || 0}`);
          doc.text(`Tỷ lệ lấp đầy: ${reportData.occupancy.OccupancyRate || 0}%`);
          doc.moveDown();
        }

        doc.end();

        stream.on('finish', () => resolve(outputPath));
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = PDFHelper;
