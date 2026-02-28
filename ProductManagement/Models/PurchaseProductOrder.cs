using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProductManagement.Models
{
    public class PurchaseProductOrder
    {
        [Key]
        public Guid Id { get; set; }

        [ForeignKey("Product")]
        public Guid ProductId { get; set; }

        public Product Product { get; set; } = null!;

        [ForeignKey("PurchaseOrder")]
        public Guid PurchaseOrderId { get; set; }

        public PurchaseOrder PurchaseOrder { get; set; } = null!;

        public DateTime ImportedDate { get; set; } = DateTime.UtcNow;

        [Required]
        public int Quantity { get; set; }

        [ForeignKey("CheckedUser")]
        public Guid CheckedUserId { get; set; }

        public User CheckedUser { get; set; } = null!;

        [MaxLength(3000)]
        public string? Comment { get; set; }
    }
}
