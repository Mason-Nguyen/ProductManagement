using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductManagement.Data;
using ProductManagement.DTOs;
using ProductManagement.Models;

namespace ProductManagement.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProductsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Compute InStockStatus based on InStock and MinInStock values.
        /// 0 = Out of Stock, 1 = In Stock, 2 = Almost Out of Stock
        /// </summary>
        private static int ComputeInStockStatus(long inStock, long minInStock)
        {
            if (inStock == 0) return 0;
            if (inStock > 0 && inStock < minInStock) return 2;
            return 1;
        }

        private static string GetInStockStatusText(int status) => status switch
        {
            0 => "Out of Stock",
            1 => "In Stock",
            2 => "Almost Out of Stock",
            _ => "Unknown"
        };

        private static ProductDto MapToDto(Product p) => new()
        {
            Id = p.Id,
            ProductCode = p.ProductCode,
            ProductName = p.ProductName,
            Category = p.Category,
            Unit = p.Unit,
            Price = p.Price,
            InStock = p.InStock,
            MinInStock = p.MinInStock,
            ProviderId = p.ProviderId,
            ProviderName = p.Provider?.ProviderName ?? string.Empty,
            Status = p.Status,
            InStockStatus = p.InStockStatus,
            InStockStatusText = GetInStockStatusText(p.InStockStatus)
        };

        // GET: api/products (only Status = true)
        [HttpGet]
        [Authorize(Roles = "Admin,Approver,Reviewer,Requester,Receiver")]
        public async Task<IActionResult> GetAll()
        {
            var products = await _context.Products
                .Include(p => p.Provider)
                .Where(p => p.Status)
                .OrderBy(p => p.ProductCode)
                .ToListAsync();

            return Ok(products.Select(MapToDto));
        }

        // GET: api/products/{id}
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Approver,Reviewer,Requester,Receiver")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var product = await _context.Products
                .Include(p => p.Provider)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
                return NotFound(new { message = "Product not found." });

            return Ok(MapToDto(product));
        }

        // POST: api/products
        [HttpPost]
        [Authorize(Roles = "Requester")]
        public async Task<IActionResult> Create([FromBody] CreateProductRequest request)
        {
            var provider = await _context.Providers.FindAsync(request.ProviderId);
            if (provider == null)
                return BadRequest(new { message = "Invalid provider." });

            var product = new Product
            {
                Id = Guid.NewGuid(),
                ProductCode = request.ProductCode,
                ProductName = request.ProductName,
                Category = request.Category,
                Unit = request.Unit,
                Price = Math.Round(request.Price, 3),
                InStock = request.InStock,
                MinInStock = request.MinInStock,
                ProviderId = request.ProviderId,
                Status = true,
                InStockStatus = ComputeInStockStatus(request.InStock, request.MinInStock)
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            // Reload with Provider for DTO
            await _context.Entry(product).Reference(p => p.Provider).LoadAsync();
            return Ok(MapToDto(product));
        }

        // PUT: api/products/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Requester")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProductRequest request)
        {
            var product = await _context.Products
                .Include(p => p.Provider)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
                return NotFound(new { message = "Product not found." });

            var provider = await _context.Providers.FindAsync(request.ProviderId);
            if (provider == null)
                return BadRequest(new { message = "Invalid provider." });

            product.ProductCode = request.ProductCode;
            product.ProductName = request.ProductName;
            product.Category = request.Category;
            product.Unit = request.Unit;
            product.Price = Math.Round(request.Price, 3);
            product.InStock = request.InStock;
            product.MinInStock = request.MinInStock;
            product.ProviderId = request.ProviderId;
            product.InStockStatus = ComputeInStockStatus(request.InStock, request.MinInStock);

            await _context.SaveChangesAsync();

            await _context.Entry(product).Reference(p => p.Provider).LoadAsync();
            return Ok(MapToDto(product));
        }

        // DELETE: api/products/{id} — Soft delete (set Status = false)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Requester")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found." });

            product.Status = false;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Product deleted successfully." });
        }
    }
}
