import jsPDF from 'jspdf';

export const ExportService = {
  /**
   * Tạo tên file theo định dạng: ghi-chu-DD-MM-YYYY-HH-mm
   */
  generateFileName: (extension: string): string => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const day = pad(now.getDate());
    const month = pad(now.getMonth() + 1);
    const year = now.getFullYear();
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    return `ghi-chu-${day}-${month}-${year}-${hours}-${minutes}.${extension}`;
  },

  toPDF: (title: string, htmlContent: string) => {
    if (!htmlContent || htmlContent.trim() === '<br>') {
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    // Đổi tiêu đề metadata thành Life Notes và sử dụng CSS @page để ẩn URL/Date/Page headers của trình duyệt
    printWindow.document.write(`
      <html>
        <head>
          <title>Life Notes</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

            @page {
              margin: 0; /* Loại bỏ lề trang của trình duyệt để ẩn header/footer chứa URL blob */
            }

            body { 
              font-family: "Noto Serif", serif; 
              padding: 2cm; /* Sử dụng padding thay cho margin để tạo lề cho nội dung */
              color: #1c1917;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              background-color: white;
              max-width: 100%;
              margin: 0;
            }
            h1 { display: none !important; }
            .rich-content { 
              font-family: "Noto Serif", serif;
              font-size: 13pt; 
              line-height: 1.6;
              text-align: left;
              word-wrap: break-word;
              overflow-wrap: break-word;
              white-space: pre-wrap;
              width: 100%;
            }
            .rich-content ul { list-style-type: disc; padding-left: 1.5rem; margin: 1rem 0; }
            .rich-content ol { list-style-type: decimal; padding-left: 1.5rem; margin: 1rem 0; }
            .rich-content table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
            .rich-content table td, .rich-content table th { border: 1px solid #d6d3d1; padding: 8px; }
            
            /* Đảm bảo link không in URL kèm theo */
            a { text-decoration: none; color: inherit; }
          </style>
        </head>
        <body>
          <div class="rich-content">${htmlContent}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    
    // Đợi render trước khi in
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 1000);
  },

  toTXT: (title: string, htmlContent: string) => {
    if (!htmlContent || htmlContent.trim() === '<br>') {
      return;
    }

    const temp = document.createElement('div');
    temp.innerHTML = htmlContent
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<div[^>]*>/gi, '\n')
      .replace(/<\/div>/gi, '');
    
    const text = temp.innerText;
    const blob = new Blob([text], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = ExportService.generateFileName('txt');
    link.click();
    URL.revokeObjectURL(url);
  },

  toDOCX: (title: string, htmlContent: string) => {
    if (!htmlContent || htmlContent.trim() === '<br>') {
      return;
    }

    const cssStyles = `
      <style>
        @page { margin: 1in; }
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; }
        h1 { display: none !important; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        td, th { border: 1px solid #000; padding: 5px; }
      </style>
    `;

    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Life Notes</title>${cssStyles}</head>
    <body><div class="rich-content">`;
    const footer = "</div></body></html>";
    const sourceHTML = header + htmlContent + footer;
    
    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = ExportService.generateFileName('doc');
    link.click();
    URL.revokeObjectURL(url);
  }
};