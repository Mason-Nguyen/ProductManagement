using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProductManagement.Models
{
    public class PurchaseProduct
    {
        [Key]
        public Guid Id { get; set; }

        public Guid RequestId { get; set; }

        [ForeignKey("RequestId")]
        public PurchaseRequest PurchaseRequest { get; set; } = null!;

        public Guid ProductId { get; set; }

        [ForeignKey("ProductId")]
        public Product Product { get; set; } = null!;

        [Required]
        public long QuantityRequest { get; set; }
    }
}
