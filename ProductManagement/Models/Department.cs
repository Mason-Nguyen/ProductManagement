using System.ComponentModel.DataAnnotations;

namespace ProductManagement.Models
{
    public class Department
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;
    }
}
