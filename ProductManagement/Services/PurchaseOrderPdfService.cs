using iText.Kernel.Pdf;
using iText.Layout;
using iText.Layout.Element;
using iText.Layout.Properties;
using iText.Kernel.Colors;
using iText.Layout.Borders;
using iText.Kernel.Font;
using iText.IO.Font.Constants;
using ProductManagement.Models;

namespace ProductManagement.Services
{
    public class PurchaseOrderPdfService
    {
        private static readonly Color HeaderBg = new DeviceRgb(41, 65, 122);
        private static readonly Color LightBg = new DeviceRgb(240, 244, 248);
        private static readonly Color AccentColor = new DeviceRgb(59, 130, 246);
        private static readonly Color TextDark = new DeviceRgb(30, 30, 30);
        private static readonly Color TextMuted = new DeviceRgb(100, 100, 100);
        private static readonly Color BorderColor = new DeviceRgb(200, 210, 220);
        private static readonly Color UrgentColor = new DeviceRgb(220, 38, 38);
        private static readonly Color TableHeaderBg = new DeviceRgb(51, 65, 85);

        public byte[] GeneratePdf(
            PurchaseOrder order,
            List<PurchaseProductOrder> productOrders,
            Dictionary<Guid, long> quantityRequestLookup)
        {
            using var memoryStream = new MemoryStream();
            using var writer = new PdfWriter(memoryStream);
            using var pdf = new PdfDocument(writer);
            using var document = new Document(pdf);

            var fontBold = PdfFontFactory.CreateFont(StandardFonts.HELVETICA_BOLD);
            var fontRegular = PdfFontFactory.CreateFont(StandardFonts.HELVETICA);
            var fontItalic = PdfFontFactory.CreateFont(StandardFonts.HELVETICA_OBLIQUE);

            document.SetMargins(36, 36, 36, 36);

            // ── Title Header ──
            var titleTable = new Table(UnitValue.CreatePercentArray(new float[] { 70, 30 }))
                .UseAllAvailableWidth()
                .SetMarginBottom(20);

            titleTable.AddCell(new Cell()
                .Add(new Paragraph("PURCHASE ORDER")
                    .SetFont(fontBold)
                    .SetFontSize(22)
                    .SetFontColor(ColorConstants.WHITE))
                .SetBackgroundColor(HeaderBg)
                .SetPadding(15)
                .SetBorder(Border.NO_BORDER));

            titleTable.AddCell(new Cell()
                .Add(new Paragraph($"Date: {order.CreatedDate:MMM dd, yyyy}")
                    .SetFont(fontRegular)
                    .SetFontSize(10)
                    .SetFontColor(ColorConstants.WHITE)
                    .SetTextAlignment(TextAlignment.RIGHT))
                .SetBackgroundColor(HeaderBg)
                .SetPadding(15)
                .SetVerticalAlignment(VerticalAlignment.MIDDLE)
                .SetBorder(Border.NO_BORDER));

            document.Add(titleTable);

            // ── Order Info Section ──
            AddSectionTitle(document, "Order Information", fontBold);

            var infoTable = new Table(UnitValue.CreatePercentArray(new float[] { 25, 75 }))
                .UseAllAvailableWidth()
                .SetMarginBottom(15);

            AddInfoRow(infoTable, "Title", order.Title, fontBold, fontRegular);
            AddInfoRow(infoTable, "Created By", order.CreatedUser?.Username ?? "—", fontBold, fontRegular);
            AddInfoRow(infoTable, "Reviewer", order.Reviewer?.Username ?? "—", fontBold, fontRegular);
            AddInfoRow(infoTable, "Approver", order.Approver?.Username ?? "—", fontBold, fontRegular);

            var statusText = GetStatusText(order.Status);
            AddInfoRow(infoTable, "Status", statusText, fontBold, fontRegular);

            var priorityText = order.Urgent == 1 ? "🔥 Urgent" : "Normal";
            var priorityCell = new Cell()
                .Add(new Paragraph(priorityText)
                    .SetFont(order.Urgent == 1 ? fontBold : fontRegular)
                    .SetFontSize(10)
                    .SetFontColor(order.Urgent == 1 ? UrgentColor : TextDark))
                .SetBorder(new SolidBorder(BorderColor, 0.5f))
                .SetPadding(6);
            infoTable.AddCell(new Cell()
                .Add(new Paragraph("Priority").SetFont(fontBold).SetFontSize(10).SetFontColor(TextMuted))
                .SetBorder(new SolidBorder(BorderColor, 0.5f))
                .SetPadding(6)
                .SetBackgroundColor(LightBg));
            infoTable.AddCell(priorityCell);

            AddInfoRow(infoTable, "Created Date", order.CreatedDate.ToString("MMM dd, yyyy HH:mm"), fontBold, fontRegular);
            AddInfoRow(infoTable, "Modified Date", order.ModifiedDate.ToString("MMM dd, yyyy HH:mm"), fontBold, fontRegular);

            document.Add(infoTable);

            // ── Description ──
            if (!string.IsNullOrWhiteSpace(order.Description))
            {
                AddSectionTitle(document, "Description", fontBold);
                document.Add(new Paragraph(order.Description)
                    .SetFont(fontRegular)
                    .SetFontSize(10)
                    .SetFontColor(TextDark)
                    .SetMarginBottom(15)
                    .SetPadding(8)
                    .SetBackgroundColor(LightBg));
            }

            // ── Reviewer Comment ──
            if (!string.IsNullOrWhiteSpace(order.ReviewerComment))
            {
                AddSectionTitle(document, "Reviewer Comment", fontBold);
                document.Add(new Paragraph(order.ReviewerComment)
                    .SetFont(fontItalic)
                    .SetFontSize(10)
                    .SetFontColor(TextMuted)
                    .SetMarginBottom(15)
                    .SetPadding(8)
                    .SetBackgroundColor(LightBg));
            }

            // ── Ordering Comment ──
            if (!string.IsNullOrWhiteSpace(order.OrderingComment))
            {
                AddSectionTitle(document, "Ordering Comment", fontBold);
                document.Add(new Paragraph(order.OrderingComment)
                    .SetFont(fontItalic)
                    .SetFontSize(10)
                    .SetFontColor(TextMuted)
                    .SetMarginBottom(15)
                    .SetPadding(8)
                    .SetBackgroundColor(LightBg));
            }

            // ── Products Table ──
            AddSectionTitle(document, $"Products ({productOrders.Count})", fontBold);

            if (productOrders.Count > 0)
            {
                var colWidths = new float[] { 10, 16, 10, 7, 10, 8, 9, 12, 9, 9 };
                var productTable = new Table(UnitValue.CreatePercentArray(colWidths))
                    .UseAllAvailableWidth()
                    .SetMarginBottom(15);

                // Table headers
                string[] headers = { "#", "Product Code", "Name", "Category", "Unit", "Price", "Qty Requested", "Qty Imported", "Imported Date", "Checked By" };
                foreach (var header in headers)
                {
                    productTable.AddHeaderCell(new Cell()
                        .Add(new Paragraph(header)
                            .SetFont(fontBold)
                            .SetFontSize(8)
                            .SetFontColor(ColorConstants.WHITE))
                        .SetBackgroundColor(TableHeaderBg)
                        .SetPadding(6)
                        .SetBorder(new SolidBorder(ColorConstants.WHITE, 0.5f))
                        .SetTextAlignment(TextAlignment.CENTER));
                }

                // Table rows
                var rowIndex = 0;
                foreach (var p in productOrders)
                {
                    var rowBg = rowIndex % 2 == 0 ? ColorConstants.WHITE : LightBg;
                    var qtyRequested = quantityRequestLookup.GetValueOrDefault(p.ProductId, 0);

                    AddProductCell(productTable, (rowIndex + 1).ToString(), fontRegular, rowBg, TextAlignment.CENTER);
                    AddProductCell(productTable, p.Product?.ProductCode ?? "—", fontBold, rowBg, TextAlignment.LEFT);
                    AddProductCell(productTable, p.Product?.ProductName ?? p.Product?.ProductCode ?? "N/A", fontRegular, rowBg, TextAlignment.LEFT);
                    AddProductCell(productTable, p.Product?.Category ?? "—", fontRegular, rowBg, TextAlignment.CENTER);
                    AddProductCell(productTable, p.Product?.Unit ?? "—", fontRegular, rowBg, TextAlignment.CENTER);
                    AddProductCell(productTable, p.Product?.Price.ToString("N3") ?? "0.000", fontRegular, rowBg, TextAlignment.RIGHT);
                    AddProductCell(productTable, qtyRequested.ToString(), fontRegular, rowBg, TextAlignment.CENTER);
                    AddProductCell(productTable, p.Quantity.ToString(), fontRegular, rowBg, TextAlignment.CENTER);
                    AddProductCell(productTable, p.ImportedDate?.ToString("MMM dd, yyyy") ?? "—", fontRegular, rowBg, TextAlignment.CENTER);
                    AddProductCell(productTable, p.CheckedUser?.Username ?? "—", fontRegular, rowBg, TextAlignment.CENTER);

                    rowIndex++;
                }

                document.Add(productTable);
            }
            else
            {
                document.Add(new Paragraph("No products in this order.")
                    .SetFont(fontItalic)
                    .SetFontSize(10)
                    .SetFontColor(TextMuted)
                    .SetMarginBottom(15));
            }

            // ── Total Price Footer ──
            var totalTable = new Table(UnitValue.CreatePercentArray(new float[] { 70, 30 }))
                .UseAllAvailableWidth()
                .SetMarginTop(10);

            totalTable.AddCell(new Cell()
                .Add(new Paragraph("TOTAL PRICE")
                    .SetFont(fontBold)
                    .SetFontSize(14)
                    .SetFontColor(ColorConstants.WHITE)
                    .SetTextAlignment(TextAlignment.RIGHT))
                .SetBackgroundColor(HeaderBg)
                .SetPadding(12)
                .SetBorder(Border.NO_BORDER));

            totalTable.AddCell(new Cell()
                .Add(new Paragraph(order.TotalPrice.ToString("N3"))
                    .SetFont(fontBold)
                    .SetFontSize(14)
                    .SetFontColor(ColorConstants.WHITE)
                    .SetTextAlignment(TextAlignment.CENTER))
                .SetBackgroundColor(AccentColor)
                .SetPadding(12)
                .SetBorder(Border.NO_BORDER));

            document.Add(totalTable);

            document.Close();
            return memoryStream.ToArray();
        }

        private static string GetStatusText(int status) => status switch
        {
            0 => "Draft",
            1 => "Ordering",
            2 => "Done",
            3 => "Cancelled",
            _ => "Unknown"
        };

        private static void AddSectionTitle(Document document, string title, PdfFont font)
        {
            document.Add(new Paragraph(title)
                .SetFont(font)
                .SetFontSize(13)
                .SetFontColor(AccentColor)
                .SetMarginBottom(6)
                .SetBorderBottom(new SolidBorder(AccentColor, 1)));
        }

        private static void AddInfoRow(Table table, string label, string value, PdfFont labelFont, PdfFont valueFont)
        {
            table.AddCell(new Cell()
                .Add(new Paragraph(label).SetFont(labelFont).SetFontSize(10).SetFontColor(TextMuted))
                .SetBorder(new SolidBorder(BorderColor, 0.5f))
                .SetPadding(6)
                .SetBackgroundColor(LightBg));
            table.AddCell(new Cell()
                .Add(new Paragraph(value).SetFont(valueFont).SetFontSize(10).SetFontColor(TextDark))
                .SetBorder(new SolidBorder(BorderColor, 0.5f))
                .SetPadding(6));
        }

        private static void AddProductCell(Table table, string text, PdfFont font, Color bgColor, TextAlignment alignment)
        {
            table.AddCell(new Cell()
                .Add(new Paragraph(text)
                    .SetFont(font)
                    .SetFontSize(8)
                    .SetFontColor(TextDark)
                    .SetTextAlignment(alignment))
                .SetBackgroundColor(bgColor)
                .SetPadding(5)
                .SetBorder(new SolidBorder(BorderColor, 0.5f)));
        }
    }
}
