using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProductManagement.Models
{
    public class PurchaseOrder
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        public int Urgent { get; set; } = 0;

        public int Status { get; set; } = 0;

        [ForeignKey("Reviewer")]
        public Guid ReviewerId { get; set; }

        public User Reviewer { get; set; } = null!;

        [ForeignKey("Approver")]
        public Guid ApproverId { get; set; }

        public User Approver { get; set; } = null!;

        [ForeignKey("CreatedUser")]
        public Guid CreatedUserId { get; set; }

        public User CreatedUser { get; set; } = null!;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime ModifiedDate { get; set; } = DateTime.UtcNow;

        [MaxLength(3000)]
        public string? ReviewerComment { get; set; }

        [MaxLength(3000)]
        public string? OrderingComment { get; set; }

        [Column(TypeName = "decimal(18,3)")]
        public decimal TotalPrice { get; set; }

        [ForeignKey("PurchaseRequest")]
        public Guid PurchaseRequestId { get; set; }

        public PurchaseRequest PurchaseRequest { get; set; } = null!;
    }
}
