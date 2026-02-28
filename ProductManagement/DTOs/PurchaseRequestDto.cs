namespace ProductManagement.DTOs
{
    public class PurchaseRequestDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Urgent { get; set; }
        public int Status { get; set; }
        public string StatusText { get; set; } = string.Empty;
        public Guid? ReviewerId { get; set; }
        public string? ReviewerName { get; set; }
        public Guid? ApproverId { get; set; }
        public string? ApproverName { get; set; }
        public Guid CreatedUserId { get; set; }
        public string CreatedUserName { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public string? ReviewerComment { get; set; }
        public decimal TotalPrice { get; set; }
        public List<PurchaseProductDto> Products { get; set; } = new();
    }

    public class PurchaseProductDto
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public string ProductCode { get; set; } = string.Empty;
        public string? ProductName { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public long QuantityRequest { get; set; }
        public decimal LineTotal { get; set; }
    }

    public class CreatePurchaseRequestDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Urgent { get; set; }
        public List<PurchaseProductItemDto> Products { get; set; } = new();
    }

    public class UpdatePurchaseRequestDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Urgent { get; set; }
        public List<PurchaseProductItemDto> Products { get; set; } = new();
    }

    public class PurchaseProductItemDto
    {
        public Guid ProductId { get; set; }
        public long QuantityRequest { get; set; }
    }

    public class AvailableProductDto
    {
        public Guid Id { get; set; }
        public string ProductCode { get; set; } = string.Empty;
        public string? ProductName { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public long InStock { get; set; }
        public long MinInStock { get; set; }
        public int InStockStatus { get; set; }
        public string InStockStatusText { get; set; } = string.Empty;
        public string ProviderName { get; set; } = string.Empty;
    }
}
