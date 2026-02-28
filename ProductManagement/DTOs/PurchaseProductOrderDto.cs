using System.ComponentModel.DataAnnotations;

namespace ProductManagement.DTOs
{
    public class PurchaseProductOrderDto
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public string ProductCode { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public long InStock { get; set; }
        public long MinInStock { get; set; }
        public long QuantityRequest { get; set; }
        public Guid PurchaseOrderId { get; set; }
        public string PurchaseOrderTitle { get; set; } = string.Empty;
        public DateTime? ImportedDate { get; set; }
        public int Quantity { get; set; }
        public Guid? CheckedUserId { get; set; }
        public string? CheckedUserName { get; set; }
        public string? Comment { get; set; }
    }

    public class ImportProductOrderRequest
    {
        [Required(ErrorMessage = "PurchaseProductOrderId is required")]
        public Guid PurchaseProductOrderId { get; set; }

        [Required(ErrorMessage = "Quantity is required")]
        [Range(0, int.MaxValue, ErrorMessage = "Quantity must be 0 or greater")]
        public int Quantity { get; set; }
    }

    public class CreatePurchaseProductOrderRequest
    {
        [Required(ErrorMessage = "ProductId is required")]
        public Guid ProductId { get; set; }

        [Required(ErrorMessage = "PurchaseOrderId is required")]
        public Guid PurchaseOrderId { get; set; }

        [Required(ErrorMessage = "ImportedDate is required")]
        public DateTime ImportedDate { get; set; }

        [Required(ErrorMessage = "Quantity is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be greater than 0")]
        public int Quantity { get; set; }

        [MaxLength(3000, ErrorMessage = "Comment cannot exceed 3000 characters")]
        public string? Comment { get; set; }
    }

    public class UpdatePurchaseProductOrderRequest
    {
        [Required(ErrorMessage = "ImportedDate is required")]
        public DateTime ImportedDate { get; set; }

        [Required(ErrorMessage = "Quantity is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be greater than 0")]
        public int Quantity { get; set; }

        [MaxLength(3000, ErrorMessage = "Comment cannot exceed 3000 characters")]
        public string? Comment { get; set; }
    }
}
