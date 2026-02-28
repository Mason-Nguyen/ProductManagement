using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductManagement.Data;
using ProductManagement.DTOs;
using ProductManagement.Models;
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
    }
}
