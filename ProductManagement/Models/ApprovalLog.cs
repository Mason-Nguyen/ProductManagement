using System.ComponentModel.DataAnnotations;

namespace ProductManagement.Models
{
    public class ApprovalLog
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid RequestId { get; set; }

        [Required]
        public Guid ApproverId { get; set; }

        [Required]
        public int Action { get; set; } // 2: Approved, 4: Rejected

        [MaxLength(3000)]
        public string? ApproverComment { get; set; }

        [Required]
        public DateTime LogTime { get; set; }

        public PurchaseRequest PurchaseRequest { get; set; } = null!;
        public User Approver { get; set; } = null!;
    }
}
