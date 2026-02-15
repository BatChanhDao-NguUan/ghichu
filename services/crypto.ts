
import CryptoJS from 'crypto-js';

export const CryptoService = {
  /**
   * Băm mật khẩu để lưu trữ/so sánh
   */
  hashPassword: (password: string): string => {
    return CryptoJS.SHA256(password.trim()).toString();
  },

  /**
   * Mã hóa nội dung
   */
  encrypt: (content: string, passphrase: string): string => {
    // Luôn đảm bảo content không null/undefined trước khi mã hóa
    return CryptoJS.AES.encrypt(content || "", passphrase.trim()).toString();
  },

  /**
   * Giải mã nội dung
   * Trả về chuỗi rỗng nếu nội dung mã hóa rỗng nhưng mật khẩu đúng
   */
  decrypt: (encryptedContent: string, passphrase: string): string => {
    const key = passphrase.trim();
    if (!key) throw new Error("Passphrase is required");
    
    try {
      if (!encryptedContent) return "";

      const bytes = CryptoJS.AES.decrypt(encryptedContent, key);
      
      /**
       * CryptoJS.AES.decrypt trả về một WordArray.
       * Nếu mật khẩu sai:
       * 1. Thường giải mã ra dữ liệu rác (sigBytes > 0 nhưng không phải UTF-8 hợp lệ).
       * 2. Hoặc thư viện phát hiện lỗi cấu trúc (sigBytes < 0).
       * Nếu mật khẩu đúng và nội dung là rỗng:
       * 1. sigBytes sẽ bằng 0.
       */
      
      if (bytes.sigBytes < 0) {
        throw new Error("Wrong password");
      }

      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      
      // Nếu có dữ liệu đầu vào nhưng kết quả giải mã trống (UTF-8 fail)
      // và sigBytes > 0, chứng tỏ đó là dữ liệu rác (sai pass)
      if (encryptedContent.length > 0 && originalText === "" && bytes.sigBytes > 0) {
          throw new Error("Wrong password");
      }

      return originalText;
    } catch (e: any) {
      // Giữ nguyên lỗi "Wrong password" để UI hiển thị đúng
      throw new Error("Wrong password");
    }
  }
};
