using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProductManagement.Models
{
    public class PurchaseRequest
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        public int Urgent { get; set; } = 0; // 0: Normal, 1: Urgent

        [Required]
        public int Status { get; set; } = 0; // 0: Draft, 1: Waiting for review, 2: Approved, 3: Cancelled, 4: Rejected

        public Guid? ReviewerId { get; set; }

        [ForeignKey("ReviewerId")]
        public User? Reviewer { get; set; }

        public Guid? ApproverId { get; set; }

        [ForeignKey("ApproverId")]
        public User? Approver { get; set; }

        public Guid CreatedUserId { get; set; }

        [ForeignKey("CreatedUserId")]
        public User CreatedUser { get; set; } = null!;

        [Required]
        public DateTime CreatedDate { get; set; }

        [Required]
        public DateTime ModifiedDate { get; set; }

        public string? ReviewerComment { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,3)")]
        public decimal TotalPrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? ExpectedTotalPrice { get; set; }

        public DateTime? ExpectedDeliveryDate { get; set; }
    }
}
