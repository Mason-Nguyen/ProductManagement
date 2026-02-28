using System.ComponentModel.DataAnnotations;

namespace ProductManagement.Models
{
    public class ApprovalConfig
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid RoleId { get; set; }

        [Required]
        public decimal MinAmount { get; set; }

        [Required]
        public decimal MaxAmount { get; set; }

        public Role Role { get; set; } = null!;
    }
}
