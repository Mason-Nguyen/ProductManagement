using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductManagement.Data;
using ProductManagement.DTOs;
using ProductManagement.Models;
using ProductManagement.Services;
using ProductManagement.Exceptions;

namespace ProductManagement.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Requester")]
    public class PurchaseRequestsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IPurchaseRequestCommandService _commandService;

        public PurchaseRequestsController(
            ApplicationDbContext context,
            IPurchaseRequestCommandService commandService)
        {
            _context = context;
            _commandService = commandService;
        }

        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.Parse(userIdClaim!);
        }

        private static string GetStatusText(int status) => status switch
        {
            0 => "Draft",
            1 => "Waiting for Review",
            2 => "Approved",
            3 => "Cancelled",
            4 => "Rejected",
            _ => "Unknown"
        };

        private static string GetInStockStatusText(int status) => status switch
        {
            0 => "Out of Stock",
            1 => "In Stock",
            2 => "Almost Out of Stock",
            _ => "Unknown"
        };

        private PurchaseRequestDto MapToDto(PurchaseRequest pr)
        {
            return new PurchaseRequestDto
            {
                Id = pr.Id,
                Title = pr.Title,
                Description = pr.Description,
                Urgent = pr.Urgent,
                Status = pr.Status,
                StatusText = GetStatusText(pr.Status),
                ReviewerId = pr.ReviewerId,
                ReviewerName = pr.Reviewer?.Username,
                ApproverId = pr.ApproverId,
                ApproverName = pr.Approver?.Username,
                CreatedUserId = pr.CreatedUserId,
                CreatedUserName = pr.CreatedUser?.Username ?? string.Empty,
                CreatedDate = pr.CreatedDate,
                ModifiedDate = pr.ModifiedDate,
                ReviewerComment = pr.ReviewerComment,
                TotalPrice = pr.TotalPrice,
                Products = _context.PurchaseProducts
                    .Include(pp => pp.Product)
                    .Where(pp => pp.RequestId == pr.Id)
                    .Select(pp => new PurchaseProductDto
                    {
                        Id = pp.Id,
                        ProductId = pp.ProductId,
                        ProductCode = pp.Product.ProductCode,
                        ProductName = pp.Product.ProductName,
                        Category = pp.Product.Category,
                        Unit = pp.Product.Unit,
                        Price = pp.Product.Price,
                        QuantityRequest = pp.QuantityRequest,
                        LineTotal = pp.Product.Price * pp.QuantityRequest
                    })
                    .ToList()
            };
        }

        // GET: api/purchaserequests
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var requests = await _context.PurchaseRequests
                .Include(pr => pr.Reviewer)
                .Include(pr => pr.Approver)
                .Include(pr => pr.CreatedUser)
                .Where(pr => pr.Status != 3)
                .OrderByDescending(pr => pr.ModifiedDate)
                .ToListAsync();

            return Ok(requests.Select(MapToDto));
        }

        // GET: api/purchaserequests/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var userId = GetCurrentUserId();

            var request = await _context.PurchaseRequests
                .Include(pr => pr.Reviewer)
                .Include(pr => pr.Approver)
                .Include(pr => pr.CreatedUser)
                .FirstOrDefaultAsync(pr => pr.Id == id && pr.CreatedUserId == userId);

            if (request == null)
                return NotFound(new { message = "Purchase request not found." });

            return Ok(MapToDto(request));
        }

        // POST: api/purchaserequests
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreatePurchaseRequestDto dto)
        {
            var userId = GetCurrentUserId();

            if (dto.Products == null || dto.Products.Count == 0)
                return BadRequest(new { message = "At least one product is required." });

            // Validate products exist and get their prices
            var productIds = dto.Products.Select(p => p.ProductId).ToList();
            var products = await _context.Products
                .Where(p => productIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id);

            if (products.Count != productIds.Count)
                return BadRequest(new { message = "One or more products are invalid." });

            // Calculate total price
            decimal totalPrice = 0;
            foreach (var item in dto.Products)
            {
                if (products.TryGetValue(item.ProductId, out var product))
                {
                    totalPrice += product.Price * item.QuantityRequest;
                }
            }

            var now = DateTime.UtcNow;

            var purchaseRequest = new PurchaseRequest
            {
                Id = Guid.NewGuid(),
                Title = dto.Title,
                Description = dto.Description,
                Urgent = dto.Urgent,
                Status = 0, // Draft
                ReviewerId = null,
                ApproverId = null,
                CreatedUserId = userId,
                CreatedDate = now,
                ModifiedDate = now,
                ReviewerComment = null,
                TotalPrice = Math.Round(totalPrice, 3)
            };

            _context.PurchaseRequests.Add(purchaseRequest);

            // Add products
            foreach (var item in dto.Products)
            {
                _context.PurchaseProducts.Add(new PurchaseProduct
                {
                    Id = Guid.NewGuid(),
                    RequestId = purchaseRequest.Id,
                    ProductId = item.ProductId,
                    QuantityRequest = item.QuantityRequest
                });
            }

            await _context.SaveChangesAsync();

            // Reload with includes
            var created = await _context.PurchaseRequests
                .Include(pr => pr.CreatedUser)
                .FirstAsync(pr => pr.Id == purchaseRequest.Id);

            return Ok(MapToDto(created));
        }

        // PUT: api/purchaserequests/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePurchaseRequestDto dto)
        {
            var userId = GetCurrentUserId();

            var request = await _context.PurchaseRequests
                .FirstOrDefaultAsync(pr => pr.Id == id && pr.CreatedUserId == userId);

            if (request == null)
                return NotFound(new { message = "Purchase request not found." });

            if (dto.Products == null || dto.Products.Count == 0)
                return BadRequest(new { message = "At least one product is required." });

            // Validate products
            var productIds = dto.Products.Select(p => p.ProductId).ToList();
            var products = await _context.Products
                .Where(p => productIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id);

            if (products.Count != productIds.Count)
                return BadRequest(new { message = "One or more products are invalid." });

            // Calculate total price
            decimal totalPrice = 0;
            foreach (var item in dto.Products)
            {
                if (products.TryGetValue(item.ProductId, out var product))
                {
                    totalPrice += product.Price * item.QuantityRequest;
                }
            }

            // Update request fields
            request.Title = dto.Title;
            request.Description = dto.Description;
            request.Urgent = dto.Urgent;
            request.Status = 0; // Reset to Draft on update
            request.ModifiedDate = DateTime.UtcNow;
            request.TotalPrice = Math.Round(totalPrice, 3);

            // Replace products: remove old, add new
            var existingProducts = await _context.PurchaseProducts
                .Where(pp => pp.RequestId == id)
                .ToListAsync();
            _context.PurchaseProducts.RemoveRange(existingProducts);

            foreach (var item in dto.Products)
            {
                _context.PurchaseProducts.Add(new PurchaseProduct
                {
                    Id = Guid.NewGuid(),
                    RequestId = id,
                    ProductId = item.ProductId,
                    QuantityRequest = item.QuantityRequest
                });
            }

            await _context.SaveChangesAsync();

            // Reload
            var updated = await _context.PurchaseRequests
                .Include(pr => pr.Reviewer)
                .Include(pr => pr.Approver)
                .Include(pr => pr.CreatedUser)
                .FirstAsync(pr => pr.Id == id);

            return Ok(MapToDto(updated));
        }

        // DELETE: api/purchaserequests/{id} — soft delete (Status = 3)
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var userId = GetCurrentUserId();

            var request = await _context.PurchaseRequests
                .FirstOrDefaultAsync(pr => pr.Id == id && pr.CreatedUserId == userId);

            if (request == null)
                return NotFound(new { message = "Purchase request not found." });

            request.Status = 3; // Cancelled
            await _context.SaveChangesAsync();

            return Ok(new { message = "Purchase request cancelled successfully." });
        }

        // GET: api/purchaserequests/available-products?excludeRequestId={id?}
        [HttpGet("available-products")]
        public async Task<IActionResult> GetAvailableProducts([FromQuery] Guid? excludeRequestId)
        {
            // Get product IDs already used in non-cancelled requests
            var usedProductIdsQuery = _context.PurchaseProducts
                .Include(pp => pp.PurchaseRequest)
                .Where(pp => pp.PurchaseRequest.Status != 3);

            // If editing a request, exclude its own products from the "used" list
            if (excludeRequestId.HasValue)
            {
                usedProductIdsQuery = usedProductIdsQuery
                    .Where(pp => pp.RequestId != excludeRequestId.Value);
            }

            var usedProductIds = await usedProductIdsQuery
                .Select(pp => pp.ProductId)
                .Distinct()
                .ToListAsync();

            // Get products where InStockStatus is 0 or 2 AND not already used AND Status = true
            var availableProducts = await _context.Products
                .Include(p => p.Provider)
                .Where(p => p.Status &&
                            (p.InStockStatus == 0 || p.InStockStatus == 2) &&
                            !usedProductIds.Contains(p.Id))
                .OrderBy(p => p.ProductCode)
                .Select(p => new AvailableProductDto
                {
                    Id = p.Id,
                    ProductCode = p.ProductCode,
                    ProductName = p.ProductName,
                    Category = p.Category,
                    Unit = p.Unit,
                    Price = p.Price,
                    InStock = p.InStock,
                    MinInStock = p.MinInStock,
                    InStockStatus = p.InStockStatus,
                    InStockStatusText = GetInStockStatusText(p.InStockStatus),
                    ProviderName = p.Provider.ProviderName
                })
                .ToListAsync();

            return Ok(availableProducts);
        }

        // PUT: api/purchaserequests/{id}/submit
        [HttpPut("{id}/submit")]
        public async Task<IActionResult> Submit(Guid id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _commandService.SubmitAsync(id, userId);
                return Ok(result);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
