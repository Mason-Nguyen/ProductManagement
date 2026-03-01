using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProductManagement.Models
{
    public class LoginLog
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [ForeignKey("User")]
        public Guid UserId { get; set; }

        [Required]
        public int Action { get; set; } // 1: Login, 2: Logout

        [Required]
        public DateTime ActionTime { get; set; } = DateTime.UtcNow;

        [MaxLength(100)]
        public string IpAddress { get; set; } = string.Empty;

        public User User { get; set; } = null!;
    }
}
