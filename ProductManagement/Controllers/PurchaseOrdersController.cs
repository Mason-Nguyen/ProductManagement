using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductManagement.Data;
using ProductManagement.DTOs;
using ProductManagement.Models;
using ProductManagement.Services;
using System.Security.Claims;

namespace ProductManagement.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PurchaseOrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PurchaseOrdersController(ApplicationDbContext context)
        {
            _context = context;
        }

        private static string GetStatusText(int status) => status switch
        {
            0 => "Draft",
            1 => "Ordering",
            2 => "Done",
            3 => "Cancelled",
            _ => "Unknown"
        };

        private static PurchaseOrderDto MapToDto(PurchaseOrder po) => new()
        {
            Id = po.Id,
            Title = po.Title,
            Description = po.Description,
            Urgent = po.Urgent,
            Status = po.Status,
            StatusText = GetStatusText(po.Status),
            ReviewerId = po.ReviewerId,
            ReviewerName = po.Reviewer.Username,
            ApproverId = po.ApproverId,
            ApproverName = po.Approver.Username,
            CreatedUserId = po.CreatedUserId,
            CreatedUserName = po.CreatedUser.Username,
            CreatedDate = po.CreatedDate,
            ModifiedDate = po.ModifiedDate,
            ReviewerComment = po.ReviewerComment,
            OrderingComment = po.OrderingComment,
            TotalPrice = po.TotalPrice,
            PurchaseRequestId = po.PurchaseRequestId
        };

        // GET: api/purchaseorders
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var orders = await _context.PurchaseOrders
                .Include(po => po.Reviewer)
                .Include(po => po.Approver)
                .Include(po => po.CreatedUser)
                .Include(po => po.PurchaseRequest)
                .OrderByDescending(po => po.CreatedDate)
                .ToListAsync();

            return Ok(orders.Select(MapToDto));
        }

        // GET: api/purchaseorders/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var order = await _context.PurchaseOrders
                .Include(po => po.Reviewer)
                .Include(po => po.Approver)
                .Include(po => po.CreatedUser)
                .Include(po => po.PurchaseRequest)
                .FirstOrDefaultAsync(po => po.Id == id);

            if (order == null)
                return NotFound(new { message = "Purchase order not found." });

            return Ok(MapToDto(order));
        }

        // POST: api/purchaseorders
        [HttpPost]
        [Authorize(Roles = "Purchaser")]
        public async Task<IActionResult> Create([FromBody] CreatePurchaseOrderRequest request)
        {
            // Get current user ID from JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var currentUserId))
                return Unauthorized(new { message = "Invalid user token." });

            // Validate PurchaseRequest exists and is approved
            var purchaseRequest = await _context.PurchaseRequests.FindAsync(request.PurchaseRequestId);
            if (purchaseRequest == null)
                return BadRequest(new { message = "Purchase request not found." });

            if (purchaseRequest.Status != 2)
                return BadRequest(new { message = "Only approved purchase requests can be converted to orders." });

            // Validate Reviewer exists
            var reviewer = await _context.Users.FindAsync(request.ReviewerId);
            if (reviewer == null)
                return BadRequest(new { message = "Invalid reviewer." });

            // Validate Approver exists
            var approver = await _context.Users.FindAsync(request.ApproverId);
            if (approver == null)
                return BadRequest(new { message = "Invalid approver." });

            var purchaseOrder = new PurchaseOrder
            {
                Id = Guid.NewGuid(),
                Title = request.Title,
                Description = request.Description,
                Urgent = request.Urgent,
                Status = request.Status,
                ReviewerId = request.ReviewerId,
                ApproverId = request.ApproverId,
                CreatedUserId = currentUserId,
                CreatedDate = DateTime.UtcNow,
                ModifiedDate = DateTime.UtcNow,
                ReviewerComment = request.ReviewerComment,
                OrderingComment = request.OrderingComment,
                TotalPrice = request.TotalPrice,
                PurchaseRequestId = request.PurchaseRequestId
            };

            _context.PurchaseOrders.Add(purchaseOrder);
            await _context.SaveChangesAsync();

            // Reload with navigation properties
            await _context.Entry(purchaseOrder).Reference(po => po.Reviewer).LoadAsync();
            await _context.Entry(purchaseOrder).Reference(po => po.Approver).LoadAsync();
            await _context.Entry(purchaseOrder).Reference(po => po.CreatedUser).LoadAsync();

            return Ok(MapToDto(purchaseOrder));
        }

        // PUT: api/purchaseorders/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Purchaser")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePurchaseOrderRequest request)
        {
            var order = await _context.PurchaseOrders
                .Include(po => po.Reviewer)
                .Include(po => po.Approver)
                .Include(po => po.CreatedUser)
                .FirstOrDefaultAsync(po => po.Id == id);

            if (order == null)
                return NotFound(new { message = "Purchase order not found." });

            order.Title = request.Title;
            order.Description = request.Description;
            order.Urgent = request.Urgent;
            order.Status = request.Status;
            order.ReviewerComment = request.ReviewerComment;
            order.OrderingComment = request.OrderingComment;
            order.TotalPrice = request.TotalPrice;
            order.ModifiedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(MapToDto(order));
        }

        // DELETE: api/purchaseorders/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Purchaser")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var order = await _context.PurchaseOrders.FindAsync(id);
            if (order == null)
                return NotFound(new { message = "Purchase order not found." });

            _context.PurchaseOrders.Remove(order);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Purchase order deleted successfully." });
        }
        // GET: api/purchaseorders/exists-for-request/{purchaseRequestId}
        [HttpGet("exists-for-request/{purchaseRequestId}")]
        public async Task<IActionResult> ExistsForRequest(Guid purchaseRequestId)
        {
            var exists = await _context.PurchaseOrders
                .AnyAsync(po => po.PurchaseRequestId == purchaseRequestId);

            return Ok(new { exists });
        }

        // POST: api/purchaseorders/convert/{purchaseRequestId}
        [HttpPost("convert/{purchaseRequestId}")]
        [Authorize(Roles = "Reviewer,Approver,Requester")]
        public async Task<IActionResult> ConvertFromRequest(Guid purchaseRequestId)
        {
            // Get current user ID from JWT token
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var currentUserId))
                return Unauthorized(new { message = "Invalid user token." });

            // Validate PurchaseRequest exists and is approved
            var purchaseRequest = await _context.PurchaseRequests
                .Include(pr => pr.Reviewer)
                .Include(pr => pr.Approver)
                .FirstOrDefaultAsync(pr => pr.Id == purchaseRequestId);

            if (purchaseRequest == null)
                return NotFound(new { message = "Purchase request not found." });

            if (purchaseRequest.Status != 2)
                return BadRequest(new { message = "Only approved purchase requests can be converted to orders." });

            // Check for duplicate conversion
            var alreadyConverted = await _context.PurchaseOrders
                .AnyAsync(po => po.PurchaseRequestId == purchaseRequestId);

            if (alreadyConverted)
                return BadRequest(new { message = "This request has already been converted to a purchase order." });

            // Create PurchaseOrder
            var purchaseOrder = new PurchaseOrder
            {
                Id = Guid.NewGuid(),
                Title = purchaseRequest.Title,
                Description = purchaseRequest.Description,
                Urgent = purchaseRequest.Urgent,
                Status = 0, // Draft
                ReviewerId = purchaseRequest.ReviewerId!.Value,
                ApproverId = purchaseRequest.ApproverId!.Value,
                CreatedUserId = currentUserId,
                CreatedDate = DateTime.UtcNow,
                ModifiedDate = DateTime.UtcNow,
                ReviewerComment = purchaseRequest.ReviewerComment,
                OrderingComment = null,
                TotalPrice = 0,
                PurchaseRequestId = purchaseRequestId
            };

            _context.PurchaseOrders.Add(purchaseOrder);

            // Create PurchaseProductOrder for each product in the request
            var purchaseProducts = await _context.PurchaseProducts
                .Where(pp => pp.RequestId == purchaseRequestId)
                .ToListAsync();

            foreach (var pp in purchaseProducts)
            {
                _context.PurchaseProductOrders.Add(new PurchaseProductOrder
                {
                    Id = Guid.NewGuid(),
                    ProductId = pp.ProductId,
                    PurchaseOrderId = purchaseOrder.Id,
                    ImportedDate = null,
                    Quantity = 0,
                    CheckedUserId = null,
                    Comment = null
                });
            }

            // Update request status to Converted (5)
            purchaseRequest.Status = 5;
            purchaseRequest.ModifiedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Reload with navigation properties
            await _context.Entry(purchaseOrder).Reference(po => po.Reviewer).LoadAsync();
            await _context.Entry(purchaseOrder).Reference(po => po.Approver).LoadAsync();
            await _context.Entry(purchaseOrder).Reference(po => po.CreatedUser).LoadAsync();

            return Ok(MapToDto(purchaseOrder));
        }

        // PUT: api/purchaseorders/{id}/set-ordering
        [HttpPut("{id}/set-ordering")]
        [Authorize(Roles = "Receiver")]
        public async Task<IActionResult> SetOrdering(Guid id)
        {
            var order = await _context.PurchaseOrders
                .Include(po => po.Reviewer)
                .Include(po => po.Approver)
                .Include(po => po.CreatedUser)
                .FirstOrDefaultAsync(po => po.Id == id);

            if (order == null)
                return NotFound(new { message = "Purchase order not found." });

            if (order.Status != 0)
                return BadRequest(new { message = "Only draft orders can be set to ordering." });

            order.Status = 1; // Ordering
            order.ModifiedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(MapToDto(order));
        }

        // PUT: api/purchaseorders/{id}/cancel
        [HttpPut("{id}/cancel")]
        [Authorize(Roles = "Receiver")]
        public async Task<IActionResult> Cancel(Guid id)
        {
            var order = await _context.PurchaseOrders
                .Include(po => po.Reviewer)
                .Include(po => po.Approver)
                .Include(po => po.CreatedUser)
                .FirstOrDefaultAsync(po => po.Id == id);

            if (order == null)
                return NotFound(new { message = "Purchase order not found." });

            if (order.Status != 0 && order.Status != 1)
                return BadRequest(new { message = "Only draft or ordering orders can be cancelled." });

            order.Status = 3; // Cancelled
            order.ModifiedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(MapToDto(order));
        }

        // POST: api/purchaseorders/{id}/import
        [HttpPost("{id}/import")]
        [Authorize(Roles = "Receiver")]
        public async Task<IActionResult> ImportProducts(Guid id, [FromBody] List<ImportProductOrderRequest> items)
        {
            // Get current user ID from JWT token
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var currentUserId))
                return Unauthorized(new { message = "Invalid user token." });

            var order = await _context.PurchaseOrders
                .Include(po => po.Reviewer)
                .Include(po => po.Approver)
                .Include(po => po.CreatedUser)
                .FirstOrDefaultAsync(po => po.Id == id);

            if (order == null)
                return NotFound(new { message = "Purchase order not found." });

            if (order.Status != 1)
                return BadRequest(new { message = "Only ordering purchase orders can be imported." });

            // Get all product orders for this PO
            var productOrders = await _context.PurchaseProductOrders
                .Include(ppo => ppo.Product)
                .Where(ppo => ppo.PurchaseOrderId == id)
                .ToListAsync();

            // Get QuantityRequest from PurchaseProduct
            var purchaseProducts = await _context.PurchaseProducts
                .Where(pp => pp.RequestId == order.PurchaseRequestId)
                .ToListAsync();
            var qtyRequestLookup = purchaseProducts.ToDictionary(pp => pp.ProductId, pp => pp.QuantityRequest);

            // Validate and apply imports
            foreach (var item in items)
            {
                var ppo = productOrders.FirstOrDefault(p => p.Id == item.PurchaseProductOrderId);
                if (ppo == null)
                    return BadRequest(new { message = $"Product order {item.PurchaseProductOrderId} not found." });

                var quantityRequest = qtyRequestLookup.GetValueOrDefault(ppo.ProductId, 0);
                var newTotal = ppo.Quantity + item.Quantity;

                if (newTotal > quantityRequest)
                    return BadRequest(new { message = $"Import quantity for {ppo.Product.ProductCode} exceeds requested quantity. Max allowed: {quantityRequest - ppo.Quantity}." });
            }

            // Apply updates
            foreach (var item in items)
            {
                if (item.Quantity <= 0) continue;

                var ppo = productOrders.First(p => p.Id == item.PurchaseProductOrderId);
                ppo.Quantity += item.Quantity;
                ppo.ImportedDate = DateTime.UtcNow;
                ppo.CheckedUserId = currentUserId;

                // Update product InStock
                ppo.Product.InStock += item.Quantity;
                // Recalculate InStockStatus
                if (ppo.Product.InStock == 0)
                    ppo.Product.InStockStatus = 0; // Out of Stock
                else if (ppo.Product.InStock > 0 && ppo.Product.InStock < ppo.Product.MinInStock)
                    ppo.Product.InStockStatus = 2; // Almost Out
                else
                    ppo.Product.InStockStatus = 1; // In Stock
            }

            // Calculate TotalPrice = sum of (quantity * price) for all product orders
            decimal totalPrice = 0;
            foreach (var ppo in productOrders)
            {
                totalPrice += ppo.Quantity * ppo.Product.Price;
            }
            order.TotalPrice = Math.Round(totalPrice, 3);

            // Check if all products fully imported
            var allFullyImported = productOrders.All(ppo =>
            {
                var quantityRequest = qtyRequestLookup.GetValueOrDefault(ppo.ProductId, 0);
                return ppo.Quantity >= quantityRequest;
            });

            if (allFullyImported)
                order.Status = 2; // Done

            order.ModifiedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(MapToDto(order));
        }

        // GET: api/purchaseorders/{id}/export-pdf
        [HttpGet("{id}/export-pdf")]
        public async Task<IActionResult> ExportPdf(Guid id)
        {
            var order = await _context.PurchaseOrders
                .Include(po => po.Reviewer)
                .Include(po => po.Approver)
                .Include(po => po.CreatedUser)
                .Include(po => po.PurchaseRequest)
                .FirstOrDefaultAsync(po => po.Id == id);

            if (order == null)
                return NotFound(new { message = "Purchase order not found." });

            // Load product orders for this PO
            var productOrders = await _context.PurchaseProductOrders
                .Include(ppo => ppo.Product)
                .Include(ppo => ppo.CheckedUser)
                .Where(ppo => ppo.PurchaseOrderId == id)
                .OrderBy(ppo => ppo.Product.ProductCode)
                .ToListAsync();

            // Build QuantityRequest lookup from PurchaseProducts
            var purchaseProducts = await _context.PurchaseProducts
                .Where(pp => pp.RequestId == order.PurchaseRequestId)
                .ToListAsync();
            var qtyRequestLookup = purchaseProducts.ToDictionary(pp => pp.ProductId, pp => pp.QuantityRequest);

            // Generate PDF
            var pdfService = new PurchaseOrderPdfService();
            var pdfBytes = pdfService.GeneratePdf(order, productOrders, qtyRequestLookup);

            // Sanitize title for filename
            var safeTitle = string.Join("_", order.Title.Split(Path.GetInvalidFileNameChars()));
            var dateStr = order.CreatedDate.ToString("yyyyMMdd");
            var fileName = $"PurchaseOrder_{safeTitle}_{dateStr}.pdf";

            return File(pdfBytes, "application/pdf", fileName);
        }

        // POST: api/purchaseorders/export-excel
        [HttpPost("export-excel")]
        public async Task<IActionResult> ExportExcel([FromBody] ExportExcelRequest request)
        {
            if (request.OrderIds == null || request.OrderIds.Count == 0)
                return BadRequest(new { message = "No order IDs provided." });

            var orders = await _context.PurchaseOrders
                .Include(po => po.Reviewer)
                .Include(po => po.Approver)
                .Include(po => po.CreatedUser)
                .Include(po => po.PurchaseRequest)
                .Where(po => request.OrderIds.Contains(po.Id))
                .OrderByDescending(po => po.CreatedDate)
                .ToListAsync();

            if (orders.Count == 0)
                return NotFound(new { message = "No orders found." });

            // Load all product orders for these orders
            var orderIds = orders.Select(o => o.Id).ToList();
            var allProductOrders = await _context.PurchaseProductOrders
                .Include(ppo => ppo.Product)
                .Include(ppo => ppo.CheckedUser)
                .Where(ppo => orderIds.Contains(ppo.PurchaseOrderId))
                .OrderBy(ppo => ppo.Product.ProductCode)
                .ToListAsync();

            var productsByOrder = allProductOrders
                .GroupBy(ppo => ppo.PurchaseOrderId)
                .ToDictionary(g => g.Key, g => g.ToList());

            // Build QuantityRequest lookup from all related PurchaseProducts
            var requestIds = orders.Select(o => o.PurchaseRequestId).Distinct().ToList();
            var purchaseProducts = await _context.PurchaseProducts
                .Where(pp => requestIds.Contains(pp.RequestId))
                .ToListAsync();
            var qtyRequestLookup = purchaseProducts.ToDictionary(pp => pp.ProductId, pp => pp.QuantityRequest);

            // Generate Excel
            var excelService = new PurchaseOrderExcelService();
            var excelBytes = excelService.GenerateExcel(orders, productsByOrder, qtyRequestLookup);

            var dateStr = DateTime.UtcNow.ToString("yyyyMMdd");
            var fileName = $"PurchaseOrders_{dateStr}.xlsx";

            return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }
    }

    public class ExportExcelRequest
    {
        public List<Guid> OrderIds { get; set; } = new();
    }
}
