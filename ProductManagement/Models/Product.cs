using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProductManagement.Models
{
    public class Product
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string ProductCode { get; set; } = string.Empty;

        [MaxLength(3000)]
        public string? ProductName { get; set; }

        [Required]
        [Column(TypeName = "varchar(255)")]
        public string Category { get; set; } = string.Empty;

        [Required]
        public string Unit { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(18,3)")]
        public decimal Price { get; set; }

        [Required]
        public long InStock { get; set; }

        [Required]
        public long MinInStock { get; set; }

        public Guid ProviderId { get; set; }

        [ForeignKey("ProviderId")]
        public Provider Provider { get; set; } = null!;

        public bool Status { get; set; } = true;

        public int InStockStatus { get; set; }
    }
}
