import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Generates a styled PDF from the content of a React component rendered in the DOM.
 * @param {string} elementId - The ID of the HTML element to convert to PDF.
 * @param {string} fileName - The name of the downloaded PDF file.
 */
export const generatePDF = async (
  elementId: string,
  fileName = "document.pdf"
) => {
  try {
    // Get the HTML element by ID
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found.`);
    }

    // Render the element to a canvas
    const canvas = await html2canvas(element, { scale: 2 });

    // Convert canvas to image and generate PDF
    const imageData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imageData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(fileName);
  } catch (error: any) {
    console.error("Error generating PDF:", error.message);
  }
};
