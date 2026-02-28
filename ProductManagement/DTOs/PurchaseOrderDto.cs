using System.ComponentModel.DataAnnotations;

namespace ProductManagement.DTOs
{
    public class PurchaseOrderDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Urgent { get; set; }
        public int Status { get; set; }
        public string StatusText { get; set; } = string.Empty;
        public Guid ReviewerId { get; set; }
        public string ReviewerName { get; set; } = string.Empty;
        public Guid ApproverId { get; set; }
        public string ApproverName { get; set; } = string.Empty;
        public Guid CreatedUserId { get; set; }
        public string CreatedUserName { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public string? ReviewerComment { get; set; }
        public string? OrderingComment { get; set; }
        public decimal TotalPrice { get; set; }
        public Guid PurchaseRequestId { get; set; }
    }

    public class CreatePurchaseOrderRequest
    {
        [Required(ErrorMessage = "Title is required")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Description is required")]
        public string Description { get; set; } = string.Empty;

        public int Urgent { get; set; } = 0;

        public int Status { get; set; } = 0;

        [Required(ErrorMessage = "ReviewerId is required")]
        public Guid ReviewerId { get; set; }

        [Required(ErrorMessage = "ApproverId is required")]
        public Guid ApproverId { get; set; }

        [MaxLength(3000, ErrorMessage = "Reviewer comment cannot exceed 3000 characters")]
        public string? ReviewerComment { get; set; }

        [MaxLength(3000, ErrorMessage = "Ordering comment cannot exceed 3000 characters")]
        public string? OrderingComment { get; set; }

        [Required(ErrorMessage = "TotalPrice is required")]
        public decimal TotalPrice { get; set; }

        [Required(ErrorMessage = "PurchaseRequestId is required")]
        public Guid PurchaseRequestId { get; set; }
    }

    public class UpdatePurchaseOrderRequest
    {
        [Required(ErrorMessage = "Title is required")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Description is required")]
        public string Description { get; set; } = string.Empty;

        public int Urgent { get; set; }

        public int Status { get; set; }

        [MaxLength(3000, ErrorMessage = "Reviewer comment cannot exceed 3000 characters")]
        public string? ReviewerComment { get; set; }

        [MaxLength(3000, ErrorMessage = "Ordering comment cannot exceed 3000 characters")]
        public string? OrderingComment { get; set; }

        [Required(ErrorMessage = "TotalPrice is required")]
        public decimal TotalPrice { get; set; }
    }
}
