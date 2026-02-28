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
    public class PurchaseProductOrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PurchaseProductOrdersController(ApplicationDbContext context)
        {
            _context = context;
        }

        private static PurchaseProductOrderDto MapToDto(PurchaseProductOrder ppo, long quantityRequest = 0) => new()
        {
            Id = ppo.Id,
            ProductId = ppo.ProductId,
            ProductCode = ppo.Product.ProductCode,
            ProductName = ppo.Product.ProductName ?? ppo.Product.ProductCode,
            Category = ppo.Product.Category,
            Unit = ppo.Product.Unit,
            Price = ppo.Product.Price,
            InStock = ppo.Product.InStock,
            MinInStock = ppo.Product.MinInStock,
            QuantityRequest = quantityRequest,
            PurchaseOrderId = ppo.PurchaseOrderId,
            PurchaseOrderTitle = ppo.PurchaseOrder.Title,
            ImportedDate = ppo.ImportedDate,
            Quantity = ppo.Quantity,
            CheckedUserId = ppo.CheckedUserId,
            CheckedUserName = ppo.CheckedUser?.Username,
            Comment = ppo.Comment
        };

        // GET: api/purchaseproductorders
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var orders = await _context.PurchaseProductOrders
                .Include(ppo => ppo.Product)
                .Include(ppo => ppo.PurchaseOrder)
                .Include(ppo => ppo.CheckedUser)
                .OrderByDescending(ppo => ppo.ImportedDate)
                .ToListAsync();

            return Ok(orders.Select(o => MapToDto(o)));
        }

        // GET: api/purchaseproductorders/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var order = await _context.PurchaseProductOrders
                .Include(ppo => ppo.Product)
                .Include(ppo => ppo.PurchaseOrder)
                .Include(ppo => ppo.CheckedUser)
                .FirstOrDefaultAsync(ppo => ppo.Id == id);

            if (order == null)
                return NotFound(new { message = "Purchase product order not found." });

            return Ok(MapToDto(order));
        }

        // POST: api/purchaseproductorders
        [HttpPost]
        [Authorize(Roles = "Receiver")]
        public async Task<IActionResult> Create([FromBody] CreatePurchaseProductOrderRequest request)
        {
            // Get current user ID from JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var currentUserId))
                return Unauthorized(new { message = "Invalid user token." });

            // Validate Product exists
            var product = await _context.Products.FindAsync(request.ProductId);
            if (product == null)
                return BadRequest(new { message = "Product not found." });

            // Validate PurchaseOrder exists
            var purchaseOrder = await _context.PurchaseOrders.FindAsync(request.PurchaseOrderId);
            if (purchaseOrder == null)
                return BadRequest(new { message = "Purchase order not found." });

            var purchaseProductOrder = new PurchaseProductOrder
            {
                Id = Guid.NewGuid(),
                ProductId = request.ProductId,
                PurchaseOrderId = request.PurchaseOrderId,
                ImportedDate = request.ImportedDate,
                Quantity = request.Quantity,
                CheckedUserId = currentUserId,
                Comment = request.Comment
            };

            _context.PurchaseProductOrders.Add(purchaseProductOrder);
            await _context.SaveChangesAsync();

            // Reload with navigation properties
            await _context.Entry(purchaseProductOrder).Reference(ppo => ppo.Product).LoadAsync();
            await _context.Entry(purchaseProductOrder).Reference(ppo => ppo.PurchaseOrder).LoadAsync();
            await _context.Entry(purchaseProductOrder).Reference(ppo => ppo.CheckedUser).LoadAsync();

            return Ok(MapToDto(purchaseProductOrder));
        }

        // PUT: api/purchaseproductorders/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Receiver")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePurchaseProductOrderRequest request)
        {
            var order = await _context.PurchaseProductOrders
                .Include(ppo => ppo.Product)
                .Include(ppo => ppo.PurchaseOrder)
                .Include(ppo => ppo.CheckedUser)
                .FirstOrDefaultAsync(ppo => ppo.Id == id);

            if (order == null)
                return NotFound(new { message = "Purchase product order not found." });

            order.ImportedDate = request.ImportedDate;
            order.Quantity = request.Quantity;
            order.Comment = request.Comment;

            await _context.SaveChangesAsync();

            return Ok(MapToDto(order));
        }

        // DELETE: api/purchaseproductorders/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Receiver")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var order = await _context.PurchaseProductOrders.FindAsync(id);
            if (order == null)
                return NotFound(new { message = "Purchase product order not found." });

            _context.PurchaseProductOrders.Remove(order);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Purchase product order deleted successfully." });
        }

        // GET: api/purchaseproductorders/by-order/{purchaseOrderId}
        [HttpGet("by-order/{purchaseOrderId}")]
        public async Task<IActionResult> GetByOrderId(Guid purchaseOrderId)
        {
            var orders = await _context.PurchaseProductOrders
                .Include(ppo => ppo.Product)
                .Include(ppo => ppo.PurchaseOrder)
                .Include(ppo => ppo.CheckedUser)
                .Where(ppo => ppo.PurchaseOrderId == purchaseOrderId)
                .OrderBy(ppo => ppo.Product.ProductCode)
                .ToListAsync();

            // Look up QuantityRequest from PurchaseProduct via PurchaseOrder.PurchaseRequestId
            var purchaseRequestId = orders.FirstOrDefault()?.PurchaseOrder?.PurchaseRequestId;
            var purchaseProducts = purchaseRequestId.HasValue
                ? await _context.PurchaseProducts
                    .Where(pp => pp.RequestId == purchaseRequestId.Value)
                    .ToListAsync()
                : new List<PurchaseProduct>();

            var qtyLookup = purchaseProducts.ToDictionary(pp => pp.ProductId, pp => pp.QuantityRequest);

            return Ok(orders.Select(o => MapToDto(o, qtyLookup.GetValueOrDefault(o.ProductId, 0))));
        }
    }
}
