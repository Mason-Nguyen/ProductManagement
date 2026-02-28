using System.ComponentModel.DataAnnotations;

namespace ProductManagement.DTOs
{
    public class ProductDto
    {
        public Guid Id { get; set; }
        public string ProductCode { get; set; } = string.Empty;
        public string? ProductName { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public long InStock { get; set; }
        public long MinInStock { get; set; }
        public Guid ProviderId { get; set; }
        public string ProviderName { get; set; } = string.Empty;
        public bool Status { get; set; }
        public int InStockStatus { get; set; }
        public string InStockStatusText { get; set; } = string.Empty;
    }

    public class CreateProductRequest
    {
        [Required]
        public string ProductCode { get; set; } = string.Empty;

        [MaxLength(3000, ErrorMessage = "Product name cannot exceed 3000 characters")]
        public string? ProductName { get; set; }

        [Required]
        public string Category { get; set; } = string.Empty;

        [Required]
        public string Unit { get; set; } = string.Empty;

        [Required]
        public decimal Price { get; set; }

        [Required]
        public long InStock { get; set; }

        [Required]
        public long MinInStock { get; set; }

        [Required]
        public Guid ProviderId { get; set; }
    }

    public class UpdateProductRequest
    {
        [Required]
        public string ProductCode { get; set; } = string.Empty;

        [MaxLength(3000, ErrorMessage = "Product name cannot exceed 3000 characters")]
        public string? ProductName { get; set; }

        [Required]
        public string Category { get; set; } = string.Empty;

        [Required]
        public string Unit { get; set; } = string.Empty;

        [Required]
        public decimal Price { get; set; }

        [Required]
        public long InStock { get; set; }

        [Required]
        public long MinInStock { get; set; }

        [Required]
        public Guid ProviderId { get; set; }
    }
}
