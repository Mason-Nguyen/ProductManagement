using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProductManagement.Models
{
    public class Provider
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string ProviderName { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "varchar(255)")]
        public string TaxIdentification { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        [Column(TypeName = "nvarchar(255)")]
        public string ContactPerson { get; set; } = string.Empty;

        [Column(TypeName = "varchar(255)")]
        public string PhoneNumber { get; set; } = string.Empty;
    }
}
