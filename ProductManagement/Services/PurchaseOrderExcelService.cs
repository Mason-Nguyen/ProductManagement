using ClosedXML.Excel;
using ProductManagement.Models;

namespace ProductManagement.Services
{
    public class PurchaseOrderExcelService
    {
        public byte[] GenerateExcel(
            List<PurchaseOrder> orders,
            Dictionary<Guid, List<PurchaseProductOrder>> productsByOrder,
            Dictionary<Guid, long> quantityRequestLookup)
        {
            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Purchase Orders");

            // ── Styles ──
            var headerColor = XLColor.FromHtml("#29417A");
            var subHeaderColor = XLColor.FromHtml("#334155");
            var lightBg = XLColor.FromHtml("#F0F4F8");

            var currentRow = 1;

            foreach (var order in orders)
            {
                // ── Order Header Row ──
                var headerRange = ws.Range(currentRow, 1, currentRow, 10);
                headerRange.Merge();
                var headerCell = ws.Cell(currentRow, 1);
                headerCell.Value = $"Purchase Order: {order.Title}";
                headerCell.Style.Font.Bold = true;
                headerCell.Style.Font.FontSize = 13;
                headerCell.Style.Font.FontColor = XLColor.White;
                headerCell.Style.Fill.BackgroundColor = headerColor;
                headerCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
                headerCell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
                headerRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                currentRow++;

                // ── Order Info Rows ──
                var statusText = GetStatusText(order.Status);
                var priority = order.Urgent == 1 ? "Urgent" : "Normal";

                AddInfoRow(ws, ref currentRow, "Created By", order.CreatedUser?.Username ?? "—", lightBg);
                AddInfoRow(ws, ref currentRow, "Reviewer", order.Reviewer?.Username ?? "—", lightBg);
                AddInfoRow(ws, ref currentRow, "Approver", order.Approver?.Username ?? "—", lightBg);
                AddInfoRow(ws, ref currentRow, "Status", statusText, lightBg);
                AddInfoRow(ws, ref currentRow, "Priority", priority, lightBg);
                AddInfoRow(ws, ref currentRow, "Description", order.Description, lightBg);
                AddInfoRow(ws, ref currentRow, "Reviewer Comment", order.ReviewerComment ?? "—", lightBg);
                AddInfoRow(ws, ref currentRow, "Ordering Comment", order.OrderingComment ?? "—", lightBg);
                AddInfoRow(ws, ref currentRow, "Created Date", order.CreatedDate.ToString("MMM dd, yyyy HH:mm"), lightBg);
                AddInfoRow(ws, ref currentRow, "Modified Date", order.ModifiedDate.ToString("MMM dd, yyyy HH:mm"), lightBg);
                AddInfoRow(ws, ref currentRow, "Total Price", order.TotalPrice.ToString("N3"), lightBg);

                // ── Products Sub-header ──
                var products = productsByOrder.GetValueOrDefault(order.Id, new List<PurchaseProductOrder>());

                var productsHeaderRange = ws.Range(currentRow, 1, currentRow, 10);
                productsHeaderRange.Merge();
                var productsHeaderCell = ws.Cell(currentRow, 1);
                productsHeaderCell.Value = $"Products ({products.Count})";
                productsHeaderCell.Style.Font.Bold = true;
                productsHeaderCell.Style.Font.FontSize = 11;
                productsHeaderCell.Style.Font.FontColor = XLColor.White;
                productsHeaderCell.Style.Fill.BackgroundColor = subHeaderColor;
                productsHeaderRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                currentRow++;

                if (products.Count > 0)
                {
                    // Product table headers
                    string[] colHeaders = { "#", "Product Code", "Product Name", "Category", "Unit", "Price", "Qty Requested", "Qty Imported", "Imported Date", "Checked By" };
                    for (int i = 0; i < colHeaders.Length; i++)
                    {
                        var cell = ws.Cell(currentRow, i + 1);
                        cell.Value = colHeaders[i];
                        cell.Style.Font.Bold = true;
                        cell.Style.Font.FontSize = 10;
                        cell.Style.Font.FontColor = XLColor.White;
                        cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#475569");
                        cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                        cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                    }
                    currentRow++;

                    // Product rows
                    var idx = 1;
                    foreach (var p in products)
                    {
                        var qtyRequested = quantityRequestLookup.GetValueOrDefault(p.ProductId, 0);
                        var rowBg = idx % 2 == 0 ? lightBg : XLColor.White;

                        SetCell(ws, currentRow, 1, idx.ToString(), rowBg);
                        SetCell(ws, currentRow, 2, p.Product?.ProductCode ?? "—", rowBg);
                        SetCell(ws, currentRow, 3, p.Product?.ProductName ?? p.Product?.ProductCode ?? "N/A", rowBg);
                        SetCell(ws, currentRow, 4, p.Product?.Category ?? "—", rowBg);
                        SetCell(ws, currentRow, 5, p.Product?.Unit ?? "—", rowBg);
                        SetCellNumber(ws, currentRow, 6, (double)(p.Product?.Price ?? 0), "N3", rowBg);
                        SetCell(ws, currentRow, 7, qtyRequested.ToString(), rowBg);
                        SetCell(ws, currentRow, 8, p.Quantity.ToString(), rowBg);
                        SetCell(ws, currentRow, 9, p.ImportedDate?.ToString("MMM dd, yyyy") ?? "—", rowBg);
                        SetCell(ws, currentRow, 10, p.CheckedUser?.Username ?? "—", rowBg);

                        currentRow++;
                        idx++;
                    }
                }
                else
                {
                    var noDataRange = ws.Range(currentRow, 1, currentRow, 10);
                    noDataRange.Merge();
                    ws.Cell(currentRow, 1).Value = "No products in this order.";
                    ws.Cell(currentRow, 1).Style.Font.Italic = true;
                    ws.Cell(currentRow, 1).Style.Font.FontColor = XLColor.Gray;
                    currentRow++;
                }

                // Spacing row between orders
                currentRow++;
            }

            // Auto-fit columns
            ws.Columns(1, 10).AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }

        private static string GetStatusText(int status) => status switch
        {
            0 => "Draft",
            1 => "Ordering",
            2 => "Done",
            3 => "Cancelled",
            _ => "Unknown"
        };

        private static void AddInfoRow(IXLWorksheet ws, ref int row, string label, string value, XLColor labelBg)
        {
            var labelCell = ws.Cell(row, 1);
            var labelRange = ws.Range(row, 1, row, 2);
            labelRange.Merge();
            labelCell.Value = label;
            labelCell.Style.Font.Bold = true;
            labelCell.Style.Font.FontSize = 10;
            labelCell.Style.Fill.BackgroundColor = labelBg;
            labelCell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;

            var valueRange = ws.Range(row, 3, row, 10);
            valueRange.Merge();
            var valueCell = ws.Cell(row, 3);
            valueCell.Value = value;
            valueCell.Style.Font.FontSize = 10;
            valueCell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;

            row++;
        }

        private static void SetCell(IXLWorksheet ws, int row, int col, string value, XLColor bg)
        {
            var cell = ws.Cell(row, col);
            cell.Value = value;
            cell.Style.Font.FontSize = 10;
            cell.Style.Fill.BackgroundColor = bg;
            cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }

        private static void SetCellNumber(IXLWorksheet ws, int row, int col, double value, string format, XLColor bg)
        {
            var cell = ws.Cell(row, col);
            cell.Value = value;
            cell.Style.NumberFormat.Format = "#,##0.000";
            cell.Style.Font.FontSize = 10;
            cell.Style.Fill.BackgroundColor = bg;
            cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
        }
    }
}
